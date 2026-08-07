<?php

namespace App\Services;

use App\Models\Lesson;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Wraps the Anthropic API for EduBD's lesson doubt-solving assistant.
 *
 * Scoping note (see UPGRADE_PLAN.md Phase 2 item 3): lessons only carry a
 * transcript-equivalent for type=text lessons (the `content` column). Video
 * lessons have a video_url but no transcript field anywhere in the schema —
 * there's no transcript to ground answers in. Rather than block the whole
 * feature on adding transcription infrastructure, this service is explicit
 * with the model about what it does and doesn't have, and the system prompt
 * instructs it to say so rather than guess at video content it hasn't seen.
 * `isGrounded()` reports which case applied so the UI can show a hint.
 */
class AnthropicDoubtAssistant
{
    private const API_URL = 'https://api.anthropic.com/v1/messages';
    private const MAX_HISTORY_MESSAGES = 12; // trailing messages sent as context, keeps cost/latency bounded
    private const MAX_RESPONSE_TOKENS = 600;

    private ?string $apiKey;
    private string $model;

    public function __construct(?string $apiKey = null, ?string $model = null)
    {
        $this->apiKey = $apiKey ?? config('services.anthropic.api_key');
        $this->model = $model ?? config('services.anthropic.model', 'claude-sonnet-5');
    }

    public function isConfigured(): bool
    {
        return !empty($this->apiKey);
    }

    /**
     * @param  Lesson  $lesson
     * @param  array<int, array{role: string, content: string}>  $history  Prior turns, oldest first.
     * @param  string  $question  The student's new message.
     * @return array{answer: string, grounded_in_transcript: bool}
     * @throws \RuntimeException on API failure — caller decides how to surface it.
     */
    public function ask(Lesson $lesson, array $history, string $question): array
    {
        if (!$this->isConfigured()) {
            throw new \RuntimeException('AI doubt assistant is not configured (missing ANTHROPIC_API_KEY).');
        }

        $lesson->loadMissing('course:id,title,description,what_you_learn');
        $grounded = $lesson->type === 'text' && filled($lesson->content);

        $system = $this->buildSystemPrompt($lesson, $grounded);

        $messages = array_map(
            fn (array $m) => ['role' => $m['role'], 'content' => $m['content']],
            array_slice($history, -self::MAX_HISTORY_MESSAGES),
        );

        // Defensive: if a previous turn failed after the student's question
        // was saved but before the assistant replied (API error below), the
        // thread can have a trailing unanswered 'user' message. The API
        // requires strict user/assistant alternation, so drop any such
        // orphan(s) before appending the new question — otherwise two
        // consecutive 'user' messages get rejected outright with a 400.
        while (!empty($messages) && end($messages)['role'] === 'user') {
            array_pop($messages);
        }

        $messages[] = ['role' => 'user', 'content' => $question];

        $response = Http::withHeaders([
                'x-api-key'         => $this->apiKey,
                'anthropic-version' => '2023-06-01',
                'content-type'      => 'application/json',
            ])
            ->timeout(12) // stay under the frontend's 15s fetch timeout (resources/js/lib/api.js)
            // so a slow response fails cleanly here with a real error
            // message, instead of racing the client's own abort and
            // showing a generic "timed out" for a call that was actually
            // still going to succeed.
            ->post(self::API_URL, [
                'model'      => $this->model,
                'max_tokens' => self::MAX_RESPONSE_TOKENS,
                'system'     => $system,
                'messages'   => $messages,
            ]);

        if (!$response->successful()) {
            Log::warning('AnthropicDoubtAssistant: API call failed', [
                'status' => $response->status(),
                'body'   => $response->json('error') ?? $response->body(),
            ]);
            throw new \RuntimeException('The doubt-solving assistant is temporarily unavailable. Please try again shortly.');
        }

        $textBlocks = collect($response->json('content', []))
            ->where('type', 'text')
            ->pluck('text');

        $answer = trim($textBlocks->implode("\n"));

        if ($answer === '') {
            throw new \RuntimeException('The assistant returned an empty response. Please try rephrasing your question.');
        }

        return ['answer' => $answer, 'grounded_in_transcript' => $grounded];
    }

    private function buildSystemPrompt(Lesson $lesson, bool $grounded): string
    {
        $course = $lesson->course;

        $context = "Course: {$course->title}\n"
            . ($course->description ? "Course description: {$course->description}\n" : '')
            . ($course->what_you_learn ? "What students learn in this course: {$course->what_you_learn}\n" : '')
            . "Current lesson: {$lesson->title} (type: {$lesson->type})\n";

        if ($grounded) {
            $context .= "Lesson content (this is the actual material the student is looking at):\n"
                . "\"\"\"\n{$lesson->content}\n\"\"\"\n";
        }

        $groundingInstruction = $grounded
            ? 'You have the actual lesson content above — ground your answer in it directly.'
            : "You do NOT have this lesson's video transcript or slide content — only its title and the course-level "
                . "description above. Do not invent or guess specifics about what the video covers. If the question "
                . "needs the actual video content to answer well, say plainly that you don't have the transcript for "
                . "this lesson yet and answer only what you can from the course-level context and general knowledge "
                . "of the subject, being clear about which is which.";

        return <<<PROMPT
            You are EduBD's lesson doubt-solving assistant, embedded directly in the lesson
            player. A student enrolled in this course is asking a question while watching or
            reading this specific lesson.

            {$context}
            {$groundingInstruction}

            Rules:
            - Answer only questions related to this lesson or course subject matter. If asked
              something unrelated (general chit-chat, other subjects, requests to do unrelated
              tasks), politely redirect to lesson content.
            - Be concise — a few short paragraphs or a short list, not an essay. Students are
              mid-lesson, not reading a textbook chapter.
            - Never fabricate specific facts, numbers, or claims about what the video shows if
              you don't have the transcript — say so instead.
            - Match the student's language if they write in Bengali or a mix of Bengali/English.
            PROMPT;
    }
}
