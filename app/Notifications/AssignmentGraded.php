<?php
namespace App\Notifications;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
class AssignmentGraded extends Notification {
    public function __construct(public readonly string $assignmentTitle, public readonly int $score, public readonly int $maxScore, public readonly ?string $feedback = null) {}
    public function via($n): array { return ['database','mail']; }
    public function toMail($n): MailMessage {
        return (new MailMessage)
            ->subject("Assignment graded: {$this->assignmentTitle}")
            ->greeting("Hello {$n->name}!")
            ->line("Your assignment **{$this->assignmentTitle}** has been graded.")
            ->line("Score: **{$this->score} / {$this->maxScore}**")
            ->when($this->feedback, fn($m) => $m->line("Feedback: {$this->feedback}"))
            ->action('View Result', url('/dashboard'));
    }
    public function toArray($n): array {
        return ['type'=>'grade','title'=>'Assignment graded','message'=>"{$this->assignmentTitle}: {$this->score}/{$this->maxScore}",'url'=>'/dashboard','icon'=>'award'];
    }
}
