<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Assignment;
use App\Models\AssignmentSubmission;
use App\Models\Enrollment;
use App\Notifications\AssignmentGraded;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AssignmentController extends Controller
{
    /** GET /api/v1/assignments/{id} — student sees assignment details + own submission */
    public function show(int $id, Request $request)
    {
        $assignment = Assignment::with('lesson:id,title,course_id')->findOrFail($id);
        $user       = $request->user();

        $this->assertEnrolled($user->id, $assignment->course_id);

        $submission = $assignment->submissionFor($user->id);

        return response()->json([
            'id'                  => $assignment->id,
            'title'               => $assignment->title,
            'description'         => $assignment->description,
            'instructions'        => $assignment->instructions,
            'max_score'           => $assignment->max_score,
            'accepted_file_types' => $assignment->accepted_file_types,
            'max_file_size_mb'    => $assignment->max_file_size_mb,
            'lesson'              => ['id' => $assignment->lesson->id, 'title' => $assignment->lesson->title],
            'submission'          => $submission ? $this->subPayload($submission) : null,
        ]);
    }

    /** POST /api/v1/assignments/{id}/submit — student uploads their work */
    public function submit(int $id, Request $request)
    {
        $assignment = Assignment::findOrFail($id);
        $user       = $request->user();

        $this->assertEnrolled($user->id, $assignment->course_id);

        // Check if already graded (disallow re-submit after grading)
        $existing = $assignment->submissionFor($user->id);
        if ($existing && $existing->isGraded()) {
            return response()->json(['message' => 'Your submission has already been graded and cannot be replaced.'], 422);
        }

        // Enforce the instructor-configured accepted file types (e.g. "pdf,doc,docx,zip")
        // — previously only the size was validated, so any file type was accepted
        // regardless of what the assignment was configured to allow.
        $request->validate([
            'file'  => 'required|file|max:' . ($assignment->max_file_size_mb * 1024)
                        . '|mimes:' . implode(',', $assignment->accepted_types_array),
            'notes' => 'nullable|string|max:2000',
        ]);

        $file = $request->file('file');

        // Delete old file if re-submitting
        if ($existing?->file_path) {
            Storage::disk('local')->delete($existing->file_path);
        }

        // Stored on the PRIVATE disk, not 'public' — student-submitted files
        // are arbitrary (subject only to the mimes check above) and must
        // never be directly reachable by URL. They're served exclusively
        // through download() below, which authorizes the requester and
        // forces Content-Disposition: attachment so a browser never
        // executes/renders an uploaded file inline.
        $path = $file->store("assignments/{$assignment->course_id}/{$assignment->id}", 'local');

        $sub = AssignmentSubmission::updateOrCreate(
            ['assignment_id' => $assignment->id, 'user_id' => $user->id],
            [
                'course_id'    => $assignment->course_id,
                'file_path'    => $path,
                'file_name'    => $file->getClientOriginalName(),
                'file_size'    => $this->humanFileSize($file->getSize()),
                'notes'        => $request->input('notes'),
                'status'       => 'pending',
                'submitted_at' => now(),
                'score'        => null,
                'feedback'     => null,
                'graded_at'    => null,
                'graded_by'    => null,
            ]
        );

        return response()->json(['message' => 'Assignment submitted successfully.', 'submission' => $this->subPayload($sub)], 201);
    }

    /** GET /api/v1/admin/assignments/{id}/submissions — instructor/admin sees all */
    public function submissions(int $id, Request $request)
    {
        $assignment = Assignment::with('course:id,title,instructor_id')->findOrFail($id);
        $user       = $request->user();

        if (!$user->isAdmin() && $assignment->course->instructor_id !== $user->id) {
            abort(403, 'Access denied.');
        }

        $subs = AssignmentSubmission::with('student:id,name,email,avatar')
            ->where('assignment_id', $assignment->id)
            ->orderByDesc('submitted_at')
            ->get()
            ->map(fn($s) => [
                ...$this->subPayload($s),
                'student' => [
                    'id'     => $s->student->id,
                    'name'   => $s->student->name,
                    'email'  => $s->student->email,
                    'avatar' => $s->student->avatar_url,
                ],
            ]);

        return response()->json([
            'assignment' => ['id' => $assignment->id, 'title' => $assignment->title, 'max_score' => $assignment->max_score],
            'submissions' => $subs,
            'stats' => [
                'total'   => $subs->count(),
                'graded'  => $subs->where('status','graded')->count(),
                'pending' => $subs->where('status','pending')->count(),
                'avg_score' => $subs->whereNotNull('score')->avg('score'),
            ],
        ]);
    }

    /** PUT /api/v1/admin/assignments/{id}/submissions/{subId}/grade */
    public function grade(int $id, int $subId, Request $request)
    {
        $assignment = Assignment::findOrFail($id);
        $user       = $request->user();

        if (!$user->isAdmin() && $assignment->course->instructor_id !== $user->id) {
            abort(403, 'Access denied.');
        }

        $data = $request->validate([
            'score'    => 'required|integer|min:0|max:' . $assignment->max_score,
            'feedback' => 'nullable|string|max:5000',
        ]);

        $sub = AssignmentSubmission::where('id', $subId)
            ->where('assignment_id', $assignment->id)
            ->firstOrFail();

        $sub->update([
            'score'      => $data['score'],
            'feedback'   => $data['feedback'] ?? null,
            'status'     => 'graded',
            'graded_at'  => now(),
            'graded_by'  => $user->id,
        ]);

        // Notify student via DB + email
        $sub->student->notify(new AssignmentGraded(
            $assignment->title,
            $data['score'],
            $assignment->max_score,
            $data['feedback'] ?? null
        ));

        return response()->json(['message' => 'Submission graded.', 'submission' => $this->subPayload($sub->fresh())]);
    }

    /**
     * GET /api/v1/assignments/submissions/{id}/download
     * Streams the submitted file. Only the student who submitted it, the
     * course's instructor, or an admin may download it — the file itself
     * lives on the private disk and has no other route to it.
     */
    public function download(int $submissionId, Request $request)
    {
        $submission = AssignmentSubmission::with('assignment.course')->findOrFail($submissionId);
        $user = $request->user();

        $isOwner      = $submission->user_id === $user->id;
        $isInstructor = $submission->assignment->course->instructor_id === $user->id;

        if (!$isOwner && !$isInstructor && !$user->isAdmin()) {
            abort(403, 'Access denied.');
        }

        if (!$submission->file_path || !Storage::disk('local')->exists($submission->file_path)) {
            abort(404, 'File not found.');
        }

        // download() (not response()) forces Content-Disposition: attachment
        // with the original filename, so the browser always saves the file
        // rather than rendering it — closes the "upload an .html and open it
        // directly" risk even for file types that pass the mimes check.
        return Storage::disk('local')->download($submission->file_path, $submission->file_name);
    }

    // ── HELPERS ───────────────────────────────────────────────────────────────
    private function assertEnrolled(int $userId, int $courseId): void
    {
        $enrolled = Enrollment::where('user_id', $userId)->where('course_id', $courseId)->exists();
        abort_unless($enrolled, 403, 'You must be enrolled in this course.');
    }

    private function subPayload(AssignmentSubmission $s): array
    {
        return [
            'id'           => $s->id,
            'file_name'    => $s->file_name,
            'file_url'     => $s->file_url,
            'file_size'    => $s->file_size,
            'notes'        => $s->notes,
            'score'        => $s->score,
            'feedback'     => $s->feedback,
            'status'       => $s->status,
            'submitted_at' => $s->submitted_at?->diffForHumans(),
            'graded_at'    => $s->graded_at?->diffForHumans(),
        ];
    }

    private function humanFileSize(int $bytes): string
    {
        if ($bytes >= 1048576) return round($bytes / 1048576, 1) . ' MB';
        if ($bytes >= 1024)    return round($bytes / 1024, 1) . ' KB';
        return $bytes . ' B';
    }
}
