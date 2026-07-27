<?php
namespace App\Notifications;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
class NewDiscussionReply extends Notification {
    public function __construct(public readonly string $courseTitle, public readonly string $replierName, public readonly string $body) {}
    public function via($n): array { return ['database']; }
    public function toArray($n): array {
        return ['type'=>'discussion','title'=>'New reply on your question','message'=>"{$this->replierName} replied: ".substr($this->body,0,80).'...','icon'=>'message-square','url'=>'/dashboard'];
    }
}
