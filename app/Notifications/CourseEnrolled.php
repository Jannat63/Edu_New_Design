<?php
namespace App\Notifications;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
class CourseEnrolled extends Notification {
    public function __construct(public readonly string $courseTitle, public readonly string $courseSlug) {}
    public function via($n): array { return ['database','mail']; }
    public function toMail($n): MailMessage {
        return (new MailMessage)
            ->subject("You're enrolled in: {$this->courseTitle}")
            ->greeting("Hello {$n->name}!")
            ->line("You have successfully enrolled in **{$this->courseTitle}**.")
            ->action('Start Learning', url("/learn/{$this->courseSlug}"))
            ->line('Happy learning!');
    }
    public function toArray($n): array {
        return ['type'=>'enrollment','title'=>'Enrolled in a course','message'=>"You are now enrolled in {$this->courseTitle}.",'url'=>"/learn/{$this->courseSlug}",'icon'=>'book-open'];
    }
}
