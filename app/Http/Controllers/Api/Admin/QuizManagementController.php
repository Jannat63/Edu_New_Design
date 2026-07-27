<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Quiz;
use App\Models\Question;
use App\Models\QuestionOption;
use Illuminate\Http\Request;

class QuizManagementController extends Controller
{
    /** GET /api/v1/admin/quizzes/{id} — quiz settings + all questions/options */
    public function show(int $id, Request $request)
    {
        $quiz = Quiz::with(['questions.options', 'course:id,instructor_id'])->findOrFail($id);
        $this->gate($quiz, $request->user());

        return response()->json($this->payload($quiz));
    }

    /** PUT /api/v1/admin/quizzes/{id} — update quiz-level settings */
    public function update(int $id, Request $request)
    {
        $quiz = Quiz::with('course:id,instructor_id')->findOrFail($id);
        $this->gate($quiz, $request->user());

        $data = $request->validate([
            'title'              => 'sometimes|string|max:255',
            'description'        => 'nullable|string|max:2000',
            'pass_percentage'    => 'sometimes|integer|min:1|max:100',
            'attempts_allowed'   => 'sometimes|integer|min:1|max:20',
            'time_limit_minutes' => 'nullable|integer|min:1|max:300',
            'show_answers'       => 'sometimes|boolean',
        ]);

        $quiz->update($data);

        return response()->json(['message' => 'Quiz settings updated.', 'quiz' => $this->payload($quiz->fresh()->load(['questions.options', 'course:id,instructor_id']))]);
    }

    /** POST /api/v1/admin/quizzes/{id}/questions */
    public function storeQuestion(int $id, Request $request)
    {
        $quiz = Quiz::with('course:id,instructor_id')->findOrFail($id);
        $this->gate($quiz, $request->user());

        $data = $this->validateQuestion($request);

        $question = Question::create([
            'quiz_id'       => $quiz->id,
            'question_text' => $data['question_text'],
            'type'          => 'single_choice',
            'explanation'   => $data['explanation'] ?? null,
            'points'        => $data['points'] ?? 1,
            'sort_order'    => $quiz->questions()->max('sort_order') + 1,
        ]);

        $this->syncOptions($question, $data['options']);

        return response()->json(['message' => 'Question added.', 'question' => $this->questionPayload($question->fresh()->load('options'))], 201);
    }

    /** PUT /api/v1/admin/questions/{id} */
    public function updateQuestion(int $id, Request $request)
    {
        $question = Question::with('quiz.course:id,instructor_id')->findOrFail($id);
        $this->gate($question->quiz, $request->user());

        $data = $this->validateQuestion($request);

        $question->update([
            'question_text' => $data['question_text'],
            'explanation'   => $data['explanation'] ?? null,
            'points'        => $data['points'] ?? 1,
        ]);

        $this->syncOptions($question, $data['options']);

        return response()->json(['message' => 'Question updated.', 'question' => $this->questionPayload($question->fresh()->load('options'))]);
    }

    /** DELETE /api/v1/admin/questions/{id} */
    public function destroyQuestion(int $id, Request $request)
    {
        $question = Question::with('quiz.course:id,instructor_id')->findOrFail($id);
        $this->gate($question->quiz, $request->user());
        $question->delete();

        return response()->json(['message' => 'Question deleted.']);
    }

    /** POST /api/v1/admin/quizzes/{id}/questions/reorder — body: { ids:[3,1,2] } */
    public function reorderQuestions(int $id, Request $request)
    {
        $quiz = Quiz::with('course:id,instructor_id')->findOrFail($id);
        $this->gate($quiz, $request->user());

        $request->validate(['ids' => 'required|array']);
        foreach ($request->ids as $order => $qid) {
            Question::where('id', $qid)->where('quiz_id', $quiz->id)->update(['sort_order' => $order]);
        }

        return response()->json(['message' => 'Questions reordered.']);
    }

    // ── HELPERS ───────────────────────────────────────────────────────────────

    private function gate(Quiz $quiz, $user): void
    {
        if ($user->isAdmin()) return;
        if ($user->isInstructor() && $quiz->course?->instructor_id === $user->id) return;
        abort(403, 'You do not have permission to manage this quiz.');
    }

    private function validateQuestion(Request $request): array
    {
        return $request->validate([
            'question_text'         => 'required|string|max:1000',
            'explanation'           => 'nullable|string|max:1000',
            'points'                => 'nullable|integer|min:1|max:100',
            'options'               => 'required|array|min:2|max:6',
            'options.*.option_text' => 'required|string|max:500',
            'options.*.is_correct'  => 'required|boolean',
        ]);
    }

    private function syncOptions(Question $question, array $options): void
    {
        if (!collect($options)->contains(fn($o) => $o['is_correct'])) {
            abort(422, 'At least one option must be marked as correct.');
        }

        $question->options()->delete();
        foreach ($options as $i => $opt) {
            QuestionOption::create([
                'question_id' => $question->id,
                'option_text' => $opt['option_text'],
                'is_correct'  => $opt['is_correct'],
                'sort_order'  => $i,
            ]);
        }
    }

    private function payload(Quiz $quiz): array
    {
        return [
            'id'                 => $quiz->id,
            'title'              => $quiz->title,
            'description'        => $quiz->description,
            'pass_percentage'    => $quiz->pass_percentage,
            'attempts_allowed'   => $quiz->attempts_allowed,
            'time_limit_minutes' => $quiz->time_limit_minutes,
            'show_answers'       => $quiz->show_answers,
            'questions'          => $quiz->questions->map(fn($q) => $this->questionPayload($q)),
        ];
    }

    private function questionPayload(Question $q): array
    {
        return [
            'id'            => $q->id,
            'question_text' => $q->question_text,
            'explanation'   => $q->explanation,
            'points'        => $q->points,
            'sort_order'    => $q->sort_order,
            'options'       => $q->options->map(fn($o) => [
                'id'          => $o->id,
                'option_text' => $o->option_text,
                'is_correct'  => $o->is_correct,
            ]),
        ];
    }
}
