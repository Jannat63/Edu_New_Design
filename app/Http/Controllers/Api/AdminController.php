<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use App\Models\Course;
use App\Models\Enrollment;
use App\Models\Payment;
use App\Models\Certificate;
use App\Models\SiteSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rules\Password as PasswordRule;

class AdminController extends Controller
{
    // ════════════════════════════════════════════════════════════════════════
    //  ANALYTICS
    // ════════════════════════════════════════════════════════════════════════

    /** GET /api/v1/admin/analytics/overview */
    public function overview()
    {
        $totalRevenue   = Payment::paid()->sum('amount');
        $monthRevenue   = Payment::paid()->month()->sum('amount');
        $totalStudents  = User::whereHas('role', fn($q) => $q->where('slug', 'student'))->count();
        $totalInstructors = User::whereHas('role', fn($q) => $q->where('slug', 'instructor'))->count();
        $totalCourses   = Course::count();
        $publishedCourses = Course::published()->count();
        $totalEnrollments = Enrollment::count();
        $totalCertificates = Certificate::count();

        // Previous month for growth %
        $prevMonthRevenue = Payment::paid()
            ->whereMonth('paid_at', now()->subMonth()->month)
            ->whereYear('paid_at', now()->subMonth()->year)
            ->sum('amount');

        $growth = $prevMonthRevenue > 0
            ? round((($monthRevenue - $prevMonthRevenue) / $prevMonthRevenue) * 100, 1)
            : ($monthRevenue > 0 ? 100 : 0);

        return response()->json([
            'total_revenue'       => (float) $totalRevenue,
            'month_revenue'       => (float) $monthRevenue,
            'revenue_growth_pct'  => $growth,
            'total_students'      => $totalStudents,
            'total_instructors'   => $totalInstructors,
            'total_courses'       => $totalCourses,
            'published_courses'   => $publishedCourses,
            'draft_courses'       => $totalCourses - $publishedCourses,
            'total_enrollments'   => $totalEnrollments,
            'total_certificates'  => $totalCertificates,
        ]);
    }

    /** GET /api/v1/admin/analytics/revenue?months=6 */
    public function revenue(Request $request)
    {
        $months = (int) ($request->months ?? 6);

        $data = [];
        for ($i = $months - 1; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $revenue = Payment::paid()
                ->whereMonth('paid_at', $date->month)
                ->whereYear('paid_at', $date->year)
                ->sum('amount');

            $data[] = [
                'month'   => $date->format('M'),
                'year'    => $date->year,
                'revenue' => (float) $revenue,
            ];
        }

        // By gateway breakdown (all-time)
        $byGateway = Payment::paid()
            ->select('gateway', DB::raw('SUM(amount) as total'), DB::raw('COUNT(*) as count'))
            ->groupBy('gateway')
            ->get();

        return response()->json([
            'monthly'    => $data,
            'by_gateway' => $byGateway,
        ]);
    }

    /** GET /api/v1/admin/analytics/enrollments?months=6 */
    public function enrollments(Request $request)
    {
        $months = (int) ($request->months ?? 6);

        $data = [];
        for ($i = $months - 1; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $count = Enrollment::whereMonth('enrolled_at', $date->month)
                ->whereYear('enrolled_at', $date->year)
                ->count();

            $data[] = ['month' => $date->format('M'), 'year' => $date->year, 'enrollments' => $count];
        }

        $topCourses = Course::orderByDesc('total_students')
            ->take(5)
            ->get(['id','title','total_students','average_rating','price','discount_price']);

        return response()->json(['monthly' => $data, 'top_courses' => $topCourses]);
    }

    /** GET /api/v1/admin/analytics/users?months=6 */
    public function userStats(Request $request)
    {
        $months = (int) ($request->months ?? 6);

        $data = [];
        for ($i = $months - 1; $i >= 0; $i--) {
            $date = now()->subMonths($i);
            $count = User::whereMonth('created_at', $date->month)
                ->whereYear('created_at', $date->year)
                ->count();

            $data[] = ['month' => $date->format('M'), 'year' => $date->year, 'new_users' => $count];
        }

        $byRole = User::join('roles', 'roles.id', '=', 'users.role_id')
            ->select('roles.name as role', DB::raw('COUNT(*) as count'))
            ->groupBy('roles.name')
            ->get();

        return response()->json(['monthly' => $data, 'by_role' => $byRole]);
    }

    // ════════════════════════════════════════════════════════════════════════
    //  USER / TEACHER / STUDENT MANAGEMENT
    // ════════════════════════════════════════════════════════════════════════

    /**
     * GET /api/v1/admin/users
     * Query: role (student|instructor|admin), status (active|banned), search, per_page
     */
    public function users(Request $request)
    {
        $users = User::with('role')
            ->when($request->role, fn($q, $role) => $q->whereHas('role', fn($q) => $q->where('slug', $role)))
            ->when($request->status === 'banned', fn($q) => $q->where('is_banned', true))
            ->when($request->status === 'active', fn($q) => $q->where('is_banned', false))
            ->when($request->search, fn($q, $s) => $q->where(function ($q) use ($s) {
                $q->where('name', 'like', "%{$s}%")->orWhere('email', 'like', "%{$s}%");
            }))
            ->orderByDesc('created_at')
            ->paginate($request->per_page ?? 20)
            ->through(fn($u) => $this->userListPayload($u));

        return response()->json($users);
    }

    /** GET /api/v1/admin/users/{id} — full detail incl. enrollments / courses taught */
    public function user(int $id)
    {
        $user = User::with('role')->findOrFail($id);

        $payload = $this->userListPayload($user);

        if ($user->isInstructor()) {
            $payload['courses_taught'] = $user->instructorCourses()
                ->get(['id','title','slug','status','total_students','average_rating','price','discount_price']);
            // Enrollment.amount_paid (not Payment.amount) so bundle-driven
            // sales count too — bundle payments have course_id = null, so a
            // Payment-based query would silently miss all of that revenue.
            $payload['total_earnings'] = Enrollment::whereIn('course_id', $user->instructorCourses()->pluck('id'))
                ->sum('amount_paid');
        } else {
            $payload['enrollments'] = $user->enrollments()
                ->with('course:id,title,slug')
                ->get(['id','course_id','progress_pct','enrolled_at','completed_at']);
            $payload['certificates'] = Certificate::where('user_id', $user->id)->count();
            $payload['total_spent']  = Payment::where('user_id', $user->id)->paid()->sum('amount');
        }

        return response()->json($payload);
    }

    /**
     * POST /api/v1/admin/users
     * Admin creates a new account — student, instructor, or admin.
     * Body: { name, email, password, role (student|instructor|admin), phone?, city?, bio? }
     */
    public function createUser(Request $request)
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|max:255|unique:users,email',
            'password' => ['required', PasswordRule::min(8)],
            'role'     => 'required|in:student,instructor,admin',
            'phone'    => 'nullable|string|max:20',
            'city'     => 'nullable|string|max:100',
            'bio'      => 'nullable|string|max:1000',
        ]);

        $role = Role::where('slug', $data['role'])->firstOrFail();

        $user = User::create([
            'role_id'           => $role->id,
            'name'              => $data['name'],
            'email'             => $data['email'],
            'phone'             => $data['phone'] ?? null,
            'city'              => $data['city'] ?? null,
            'bio'               => $data['bio'] ?? null,
            'password'          => Hash::make($data['password']),
            'email_verified_at' => now(),
        ]);

        return response()->json([
            'message' => ucfirst($data['role']) . ' account created successfully.',
            'user'    => $this->userListPayload($user),
        ], 201);
    }

/**
     * PUT /api/v1/admin/users/{id}
     * Admin edits any user's profile fields including role, status and avatar.
     */
    public function updateUser(int $id, Request $request)
    {
        $user = User::findOrFail($id);

        $data = $request->validate([
            'name'      => 'sometimes|string|max:255',
            'email'     => 'sometimes|email|max:255|unique:users,email,' . $user->id,
            'phone'     => 'nullable|string|max:20',
            'city'      => 'nullable|string|max:100',
            'bio'       => 'nullable|string|max:1000',
            'password'  => ['nullable', PasswordRule::min(8)],
            'role'      => 'nullable|in:student,instructor,admin',
            'is_active' => 'nullable|boolean',
            'avatar'    => 'nullable|image|max:2048|mimes:jpg,jpeg,png,webp',
        ]);

        if (!empty($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        if (!empty($data['role'])) {
            $newRole = Role::where('slug', $data['role'])->firstOrFail();
            if ($user->isAdmin() && $data['role'] !== 'admin') {
                $adminCount = User::whereHas('role', fn($q) => $q->where('slug', 'admin'))->count();
                if ($adminCount <= 1) {
                    return response()->json(['message' => 'Cannot change role — at least one admin must remain.'], 422);
                }
            }
            $data['role_id'] = $newRole->id;
        }
        unset($data['role']);

        if ($request->hasFile('avatar')) {
            if ($user->avatar) Storage::disk('public')->delete($user->avatar);
            $data['avatar'] = $request->file('avatar')->store('avatars', 'public');
        }

        $user->update($data);

        return response()->json(['message' => 'User updated.', 'user' => $this->userListPayload($user->fresh()->load('role'))]);
    }

    /** DELETE /api/v1/admin/users/{id} — soft-deletes the account */
    public function deleteUser(int $id, Request $request)
    {
        $user = User::findOrFail($id);

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot delete your own account.'], 422);
        }

        if ($user->isAdmin()) {
            return response()->json(['message' => 'Cannot delete an admin account. Change their role first.'], 422);
        }

        // Revoke all active sessions/tokens
        $user->tokens()->delete();
        $user->delete();

        return response()->json(['message' => 'User account deleted.']);
    }

    /** PUT /api/v1/admin/users/{id}/ban — body: { reason? } */
    public function banUser(int $id, Request $request)
    {
        $user = User::findOrFail($id);

        if ($user->id === $request->user()->id) {
            return response()->json(['message' => 'You cannot ban your own account.'], 422);
        }
        if ($user->isAdmin()) {
            return response()->json(['message' => 'Cannot ban another admin.'], 422);
        }

        $user->update(['is_banned' => true]);
        // Revoke all active sessions immediately
        $user->tokens()->delete();

        return response()->json(['message' => "{$user->name}'s account has been suspended."]);
    }

    /** PUT /api/v1/admin/users/{id}/unban */
    public function unbanUser(int $id)
    {
        $user = User::findOrFail($id);
        $user->update(['is_banned' => false]);

        return response()->json(['message' => "{$user->name}'s account has been reinstated."]);
    }

    /**
     * PUT /api/v1/admin/users/{id}/role
     * Promote/demote between student ↔ instructor ↔ admin.
     * Body: { role: student|instructor|admin }
     */
    public function changeRole(int $id, Request $request)
    {
        $data = $request->validate(['role' => 'required|in:student,instructor,admin']);

        $user = User::findOrFail($id);
        $newRole = Role::where('slug', $data['role'])->firstOrFail();

        if ($user->id === $request->user()->id && $data['role'] !== 'admin') {
            return response()->json(['message' => 'You cannot change your own role away from admin.'], 422);
        }

        if ($user->role_id === $newRole->id) {
            return response()->json(['message' => "User is already a {$data['role']}."]);
        }

        // Guard: don't allow removing the last admin
        if ($user->isAdmin() && $data['role'] !== 'admin') {
            $adminCount = User::whereHas('role', fn($q) => $q->where('slug', 'admin'))->count();
            if ($adminCount <= 1) {
                return response()->json(['message' => 'Cannot change role — at least one admin must remain.'], 422);
            }
        }

        $user->update(['role_id' => $newRole->id]);

        return response()->json([
            'message' => "{$user->name} is now a " . $newRole->name . '.',
            'user'    => $this->userListPayload($user->fresh()->load('role')),
        ]);
    }

    /** POST /api/v1/admin/users/{id}/reset-password — admin force-resets a user's password */
    public function resetUserPassword(int $id, Request $request)
    {
        $data = $request->validate(['password' => ['required', PasswordRule::min(8)]]);

        $user = User::findOrFail($id);
        $user->update(['password' => Hash::make($data['password'])]);
        $user->tokens()->delete(); // force re-login everywhere

        return response()->json(['message' => "Password reset for {$user->name}. They have been logged out everywhere."]);
    }

    // ════════════════════════════════════════════════════════════════════════
    //  PAYMENTS
    // ════════════════════════════════════════════════════════════════════════

    /** GET /api/v1/admin/payments — query: status, gateway, search, per_page */
    public function payments(Request $request)
    {
        $payments = Payment::with(['user:id,name,email', 'course:id,title', 'bundle:id,title'])
            ->when($request->status,  fn($q, $s) => $q->where('status', $s))
            ->when($request->gateway, fn($q, $g) => $q->where('gateway', $g))
            ->when($request->search,  fn($q, $s) => $q->where(function ($q) use ($s) {
                $q->where('transaction_id', 'like', "%{$s}%")
                  ->orWhereHas('user', fn($q) => $q->where('name', 'like', "%{$s}%"));
            }))
            ->orderByDesc('created_at')
            ->paginate($request->per_page ?? 20)
            ->through(fn($p) => $this->paymentRow($p));

        return response()->json($payments);
    }

    /** GET /api/v1/admin/payments/export?format=csv — same filters as payments() above */
    public function exportPayments(Request $request): \Symfony\Component\HttpFoundation\StreamedResponse
    {
        $query = Payment::with(['user:id,name,email', 'course:id,title', 'bundle:id,title'])
            ->when($request->status,  fn($q, $s) => $q->where('status', $s))
            ->when($request->gateway, fn($q, $g) => $q->where('gateway', $g))
            ->when($request->search,  fn($q, $s) => $q->where(function ($q) use ($s) {
                $q->where('transaction_id', 'like', "%{$s}%")
                  ->orWhereHas('user', fn($q) => $q->where('name', 'like', "%{$s}%"));
            }))
            ->orderByDesc('created_at');

        $filename = 'edubd-transactions-' . now()->format('Y-m-d_His') . '.csv';

        // Plain CSV rather than a real .xlsx — it opens directly in Excel
        // (and Sheets, Numbers, etc.) with zero extra dependencies, and
        // streaming means this doesn't load the whole transaction table
        // into memory even if there end up being tens of thousands of rows.
        return response()->streamDownload(function () use ($query) {
            $out = fopen('php://output', 'w');
            fputcsv($out, ['Transaction ID', 'Date', 'Student Name', 'Student Email', 'Item', 'Type', 'Amount (BDT)', 'Gateway', 'Status']);

            $query->chunk(500, function ($chunk) use ($out) {
                foreach ($chunk as $p) {
                    fputcsv($out, [
                        $p->transaction_id,
                        $p->created_at->format('Y-m-d H:i'),
                        $p->user?->name ?? '(deleted user)',
                        $p->user?->email ?? '',
                        $p->course?->title ?? $p->bundle?->title ?? '(deleted item)',
                        $p->bundle_id ? 'Bundle' : 'Course',
                        number_format((float) $p->amount, 2, '.', ''),
                        strtoupper($p->gateway),
                        ucfirst($p->status),
                    ]);
                }
            });

            fclose($out);
        }, $filename, [
            'Content-Type' => 'text/csv',
        ]);
    }

    private function paymentRow(Payment $p): array
    {
        return [
            'id'             => $p->id,
            'user'           => ['id' => $p->user?->id, 'name' => $p->user?->name, 'email' => $p->user?->email],
            'course'         => $p->course?->title ?? ($p->bundle ? "{$p->bundle->title} (Bundle)" : null),
            'amount'         => (float) $p->amount,
            'gateway'        => $p->gateway,
            'transaction_id' => $p->transaction_id,
            'status'         => $p->status,
            'paid_at'        => $p->paid_at?->toDateString(),
            'created_at'     => $p->created_at->toDateString(),
        ];
    }

    /** POST /api/v1/admin/payments/{id}/refund — body: { reason? } */
    public function refundPayment(int $id, Request $request)
    {
        $payment = Payment::findOrFail($id);

        if ($payment->status !== 'paid') {
            return response()->json(['message' => 'Only paid transactions can be refunded.'], 422);
        }

        // NOTE: This marks the record as refunded. Actually returning funds to
        // the customer's bKash/Nagad/SSLCommerz account requires calling that
        // gateway's refund API separately with the stored gateway_ref.
        $payment->update(['status' => 'refunded', 'refunded_at' => now()]);

        // Revoke course access. Bundle payments have no course_id (only
        // bundle_id) and can grant enrollments across several courses, so we
        // look up exactly which enrollments this payment created via
        // payment_id rather than assuming a single course — this also avoids
        // revoking a course the student legitimately owns from a separate,
        // earlier purchase that happens to also be in this bundle.
        $enrollments = Enrollment::where('payment_id', $payment->id)->get();

        // Fallback for enrollments created before the payment_id column
        // existed. Only safe for single-course payments — for legacy bundle
        // payments there's no reliable way to identify the right rows, so we
        // deliberately leave access alone rather than guess.
        if ($enrollments->isEmpty() && $payment->course_id) {
            $enrollments = Enrollment::where('user_id', $payment->user_id)
                ->where('course_id', $payment->course_id)
                ->get();
        }

        foreach ($enrollments as $enrollment) {
            $enrollment->course?->decrement('total_students');
            $enrollment->delete();
        }

        $message = $enrollments->isEmpty()
            ? 'Payment marked as refunded. No matching enrollment was found to revoke — check course access manually.'
            : 'Payment marked as refunded and course access revoked.';

        return response()->json(['message' => $message]);
    }

    // ════════════════════════════════════════════════════════════════════════
    //  SITE SETTINGS
    // ════════════════════════════════════════════════════════════════════════

    /** GET /api/v1/admin/settings — all settings grouped */
    public function settings()
    {
        $settings = SiteSetting::all()->groupBy('group');

        return response()->json($settings->map(fn($group) => $group->map(fn($s) => [
            'key'         => $s->key,
            'value'       => $this->castValue($s),
            'type'        => $s->type,
            'label'       => $s->label,
            'description' => $s->description,
        ])));
    }

    /** GET /api/v1/admin/settings/{group} */
    public function settingsByGroup(string $group)
    {
        $settings = SiteSetting::where('group', $group)->get();

        return response()->json($settings->map(fn($s) => [
            'key'   => $s->key,
            'value' => $this->castValue($s),
            'type'  => $s->type,
            'label' => $s->label,
        ]));
    }

    /**
     * PUT /api/v1/admin/settings
     * Body: { settings: { key1: value1, key2: value2, ... } }
     */
    public function updateSettings(Request $request)
    {
        $data = $request->validate(['settings' => 'required|array']);

        foreach ($data['settings'] as $key => $value) {
            $setting = SiteSetting::where('key', $key)->first();

            // Self-healing: if this key was never seeded (e.g. seeder wasn't
            // run after an update), create it now instead of silently doing
            // nothing — a save that appears to succeed but has zero effect
            // is worse than a slightly-guessed default type.
            if (!$setting) {
                $type = is_bool($value) ? 'boolean' : (is_array($value) ? 'json' : 'string');
                $setting = SiteSetting::create([
                    'key' => $key, 'group' => 'general', 'type' => $type,
                    'label' => ucfirst(str_replace('_', ' ', $key)), 'value' => '',
                ]);
            }

            $stored = match ($setting->type) {
                'boolean' => $value ? '1' : '0',
                'json'    => is_array($value) ? json_encode($value) : $value,
                default   => (string) $value,
            };

            $setting->update(['value' => $stored]);
        }

        return response()->json(['message' => 'Settings updated successfully.']);
    }

    // ── HELPERS ───────────────────────────────────────────────────────────────
    private function userListPayload(User $u): array
    {
        return [
            'id'         => $u->id,
            'name'       => $u->name,
            'email'      => $u->email,
            'phone'      => $u->phone,
            'city'       => $u->city,
            'avatar'     => $u->avatar_url,
            'role'       => $u->role?->slug,
            'role_name'  => $u->role?->name,
            'is_banned'  => (bool) $u->is_banned,
            'verified'   => (bool) $u->email_verified_at,
            'joined'     => $u->created_at->toDateString(),
        ];
    }

    private function castValue(SiteSetting $s): mixed
    {
        return match ($s->type) {
            'boolean' => (bool) $s->value,
            'integer' => (int) $s->value,
            'json'    => json_decode($s->value, true),
            default   => $s->value,
        };
    }
}
