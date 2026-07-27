<?php

namespace App\Console\Commands;

use App\Models\Coupon;
use App\Models\Enrollment;
use App\Models\Payment;
use App\Notifications\AbandonedCheckoutReminder;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class SendAbandonedCheckoutReminders extends Command
{
    protected $signature = 'checkout:send-reminders {--dry-run : List what would be sent without actually sending or writing anything}';
    protected $description = 'Email a one-time reminder (with a discount, for single-course purchases) to users who started checkout but never completed it';

    /** Don't remind too soon (still mid-checkout) or too late (price/course may be stale). */
    private const MIN_AGE_HOURS = 1;
    private const MAX_AGE_DAYS  = 7;

    private const DISCOUNT_PERCENT   = 10;
    private const COUPON_VALID_DAYS  = 3;

    public function handle(): int
    {
        $dryRun = (bool) $this->option('dry-run');

        $payments = Payment::query()
            ->where('status', 'pending')
            ->whereNull('reminder_sent_at')
            ->where('created_at', '<=', now()->subHours(self::MIN_AGE_HOURS))
            ->where('created_at', '>=', now()->subDays(self::MAX_AGE_DAYS))
            ->with(['user', 'course', 'bundle.courses:id'])
            ->get();

        if ($payments->isEmpty()) {
            $this->info('No abandoned checkouts to remind right now.');
            return self::SUCCESS;
        }

        $sent = 0;
        $skipped = 0;

        foreach ($payments as $payment) {
            try {
                if (!$payment->user) {
                    // Orphaned payment (user deleted since) — stop revisiting it.
                    $dryRun || $payment->update(['reminder_sent_at' => now()]);
                    continue;
                }

                if ($payment->bundle_id) {
                    $result = $this->handleBundlePayment($payment, $dryRun);
                } else {
                    $result = $this->handleCoursePayment($payment, $dryRun);
                }

                $result ? $sent++ : $skipped++;
            } catch (\Throwable $e) {
                // One bad row (missing relation, mail failure, etc.) shouldn't
                // abort the whole run — log it and keep going. It'll simply
                // be picked up again next run since reminder_sent_at wasn't set.
                $this->error("Payment #{$payment->id}: {$e->getMessage()}");
                Log::error('Abandoned checkout reminder failed', [
                    'payment_id' => $payment->id,
                    'error'      => $e->getMessage(),
                ]);
            }
        }

        $this->info(($dryRun ? '[dry run] ' : '') . "Sent {$sent}, skipped {$skipped} (already owned/no longer applicable).");
        return self::SUCCESS;
    }

    /** @return bool true if a reminder was (or would be) sent */
    private function handleCoursePayment(Payment $payment, bool $dryRun): bool
    {
        $course = $payment->course;
        if (!$course) {
            $dryRun || $payment->update(['reminder_sent_at' => now()]);
            return false;
        }

        $alreadyOwned = Enrollment::where('user_id', $payment->user_id)->where('course_id', $course->id)->exists();
        if ($alreadyOwned) {
            $this->line("Payment #{$payment->id}: already enrolled, skipping.");
            $dryRun || $payment->update(['reminder_sent_at' => now()]);
            return false;
        }

        $coupon = $dryRun ? null : $this->findOrCreateRecoveryCoupon($payment->user_id, $course->id);

        $this->line("Payment #{$payment->id}: reminding {$payment->user->email} about \"{$course->title}\"" . ($coupon ? " with code {$coupon->code}" : ''));

        if (!$dryRun) {
            $payment->user->notify(new AbandonedCheckoutReminder(
                itemTitle: $course->title,
                resumeUrl: "/course/{$course->slug}",
                couponCode: $coupon?->code,
                discountPct: $coupon ? self::DISCOUNT_PERCENT : null,
                couponExpiresAt: $coupon?->expires_at,
            ));
            $payment->update(['reminder_sent_at' => now()]);
        }

        return true;
    }

    /** @return bool true if a reminder was (or would be) sent */
    private function handleBundlePayment(Payment $payment, bool $dryRun): bool
    {
        $bundle = $payment->bundle;
        if (!$bundle || $bundle->courses->isEmpty()) {
            $dryRun || $payment->update(['reminder_sent_at' => now()]);
            return false;
        }

        $ownedCount = Enrollment::where('user_id', $payment->user_id)
            ->whereIn('course_id', $bundle->courses->pluck('id'))
            ->count();

        if ($ownedCount === $bundle->courses->count()) {
            $this->line("Payment #{$payment->id}: bundle fully owned already, skipping.");
            $dryRun || $payment->update(['reminder_sent_at' => now()]);
            return false;
        }

        // No coupon here — bundle checkout doesn't support coupon codes at
        // all (bundles already carry their own discounted price), so there's
        // nothing to offer beyond the nudge itself.
        $this->line("Payment #{$payment->id}: reminding {$payment->user->email} about bundle \"{$bundle->title}\"");

        if (!$dryRun) {
            $payment->user->notify(new AbandonedCheckoutReminder(
                itemTitle: $bundle->title,
                resumeUrl: "/bundle/{$bundle->id}",
            ));
            $payment->update(['reminder_sent_at' => now()]);
        }

        return true;
    }

    /**
     * Reuse an existing still-valid recovery coupon for this exact
     * user+course pair rather than issuing a new one each time they abandon
     * checkout for the same course — avoids stacking multiple codes.
     */
    private function findOrCreateRecoveryCoupon(int $userId, int $courseId): Coupon
    {
        $existing = Coupon::where('user_id', $userId)
            ->where('course_id', $courseId)
            ->where('is_active', true)
            ->whereColumn('used_count', '<', 'max_uses')
            ->where(fn($q) => $q->whereNull('expires_at')->orWhere('expires_at', '>', now()))
            ->first();

        if ($existing) {
            return $existing;
        }

        do {
            $code = 'BACK' . self::DISCOUNT_PERCENT . '-' . strtoupper(Str::random(6));
        } while (Coupon::where('code', $code)->exists());

        return Coupon::create([
            'code'       => $code,
            'type'       => 'percent',
            'value'      => self::DISCOUNT_PERCENT,
            'max_uses'   => 1,
            'used_count' => 0,
            'course_id'  => $courseId,
            'user_id'    => $userId,
            'is_active'  => true,
            'expires_at' => now()->addDays(self::COUPON_VALID_DAYS),
        ]);
    }
}
