<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Discussion;
use App\Models\Enrollment;
use Illuminate\Http\Request;

class DiscussionController extends Controller
{
    /** GET /api/v1/courses/{courseId}/discussions?lesson_id=&page= */
    public function index(int $courseId, Request $request)
    {
        $this->assertAccess($request->user(), $courseId);

        $query = Discussion::with(['user:id,name,avatar','replies.user:id,name,avatar'])
            ->where('course_id', $courseId)
            ->whereNull('parent_id')
            ->orderByDesc('is_pinned')
            ->orderByDesc('created_at');

        if ($request->lesson_id) {
            $query->where('lesson_id', $request->lesson_id);
        }

        $discussions = $query->paginate(15)->through(fn($d) => $this->payload($d));
        return response()->json($discussions);
    }

    /** POST /api/v1/courses/{courseId}/discussions */
    public function store(int $courseId, Request $request)
    {
        $this->assertAccess($request->user(), $courseId);

        $data = $request->validate([
            'body'      => 'required|string|min:3|max:5000',
            'lesson_id' => 'nullable|exists:lessons,id',
            'parent_id' => 'nullable|exists:discussions,id',
        ]);

        $discussion = Discussion::create([
            ...$data,
            'course_id' => $courseId,
            'user_id'   => $request->user()->id,
        ]);

        return response()->json([
            'message'    => 'Posted.',
            'discussion' => $this->payload($discussion->load(['user:id,name,avatar','replies'])),
        ], 201);
    }

    /** PUT /api/v1/discussions/{id} */
    public function update(int $id, Request $request)
    {
        $d = Discussion::findOrFail($id);
        abort_unless($d->user_id === $request->user()->id || $request->user()->isAdmin(), 403);
        $d->update($request->validate(['body' => 'required|string|min:3|max:5000']));
        return response()->json(['message' => 'Updated.', 'discussion' => $this->payload($d->fresh())]);
    }

    /** DELETE /api/v1/discussions/{id} */
    public function destroy(int $id, Request $request)
    {
        $d = Discussion::findOrFail($id);
        abort_unless($d->user_id === $request->user()->id || $request->user()->isAdmin(), 403);
        $d->delete();
        return response()->json(['message' => 'Deleted.']);
    }

    /** PUT /api/v1/discussions/{id}/solve */
    public function markSolved(int $id, Request $request)
    {
        $d = Discussion::findOrFail($id);
        abort_unless($d->user_id === $request->user()->id || $request->user()->isAdmin(), 403);
        $wasSolved = $d->is_solved;
        $d->update(['is_solved' => !$wasSolved]);
        return response()->json(['message' => !$wasSolved ? 'Marked as solved.' : 'Unmarked.']);
    }

    /** PUT /api/v1/discussions/{id}/pin — admin only */
    public function pin(int $id, Request $request)
    {
        abort_unless($request->user()->isAdmin(), 403);
        $d = Discussion::findOrFail($id);
        $d->update(['is_pinned' => !$d->is_pinned]);
        return response()->json(['message' => 'Updated.']);
    }

    /** POST /api/v1/discussions/{id}/upvote */
    public function upvote(int $id, Request $request)
    {
        $d = Discussion::findOrFail($id);
        $this->assertAccess($request->user(), $d->course_id);
        $d->increment('upvotes');
        return response()->json(['message' => 'Upvoted.', 'upvotes' => $d->upvotes + 1]);
    }

    private function assertAccess($user, int $courseId): void
    {
        if ($user->isAdmin() || $user->isInstructor()) return;
        abort_unless(Enrollment::where('user_id',$user->id)->where('course_id',$courseId)->exists(), 403, 'Enroll to join discussions.');
    }

    private function payload(Discussion $d): array
    {
        return [
            'id'         => $d->id,
            'body'       => $d->body,
            'is_pinned'  => $d->is_pinned,
            'is_solved'  => $d->is_solved,
            'upvotes'    => $d->upvotes,
            'lesson_id'  => $d->lesson_id,
            'created_at' => $d->created_at->diffForHumans(),
            'user'       => ['id'=>$d->user?->id,'name'=>$d->user?->name,'avatar'=>$d->user?->avatar_url],
            'replies'    => $d->relationLoaded('replies')
                ? $d->replies->map(fn($r)=>$this->payload($r))->values()
                : [],
        ];
    }
}
