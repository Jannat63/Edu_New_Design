<?php

namespace App\Notifications;

use App\Models\Payment;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class AbandonedCheckoutReminder extends Notification
{
    /**
     * @param string      $itemTitle   Course or bundle title.
     * @param string      $resumeUrl   Relative path back to the course/bundle page.
     * @param string|null $couponCode  Set only for course purchases (bundle
     *                                 checkout doesn't support coupons at all,
     *                                 so there's nothing to offer there).
     * @param int|null    $discountPct
     * @param \Illuminate\Support\Carbon|null $couponExpiresAt
     */
    public function __construct(
        public readonly string $itemTitle,
        public readonly string $resumeUrl,
        public readonly ?string $couponCode = null,
        public readonly ?int $discountPct = null,
        public readonly ?\Illuminate\Support\Carbon $couponExpiresAt = null,
    ) {}

    public function via($notifiable): array
    {
        return ['database', 'mail'];
    }

    public function toMail($notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject("You left \"{$this->itemTitle}\" in your cart")
            ->greeting("Hi {$notifiable->name},")
            ->line("You started enrolling in **{$this->itemTitle}** but didn't finish checking out.");

        if ($this->couponCode) {
            $mail->line("Here's **{$this->discountPct}% off** to help you finish — use code **{$this->couponCode}** at checkout.")
                 ->line('Expires ' . $this->couponExpiresAt->format('M j, Y') . ', so it won\'t sit around forever.');
        } else {
            $mail->line("Pick up right where you left off — it only takes a minute to complete.");
        }

        return $mail->action('Finish enrolling', url($this->resumeUrl))
                     ->line("If you changed your mind, no action needed — you won't be charged for anything you didn't complete.");
    }

    public function toArray($notifiable): array
    {
        return [
            'type'    => 'checkout_reminder',
            'title'   => 'Pick up where you left off',
            'message' => $this->couponCode
                ? "You left \"{$this->itemTitle}\" in your cart — use {$this->couponCode} for {$this->discountPct}% off."
                : "You left \"{$this->itemTitle}\" in your cart.",
            'url'  => $this->resumeUrl,
            'icon' => 'shopping-cart',
        ];
    }
}
