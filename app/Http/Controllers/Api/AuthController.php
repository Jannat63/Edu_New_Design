<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Role;
use App\Models\Enrollment;
use App\Models\Certificate;
use App\Models\Payment;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password as PasswordRule;

class AuthController extends Controller
{
    // ── REGISTER ──────────────────────────────────────────────────────────────
    /** POST /api/v1/auth/register */
    public function register(Request $request)
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|max:255|unique:users,email',
            'phone'    => 'nullable|string|max:20',
            'city'     => 'nullable|string|max:100',
            'password' => ['required', 'confirmed', PasswordRule::min(8)],
        ]);

        $studentRole = Role::where('slug', 'student')->first();

        // Auto-verify outside production so local/dev/testing doesn't require
        // digging a verification link out of the mail log for every test
        // account. In production, leave it null and actually send the
        // verification email below — this is what the previous version of
        // this comment already claimed happened, but the email was never
        // actually sent.
        $autoVerify = !app()->environment('production');

        $user = User::create([
            'role_id'  => $studentRole?->id ?? 2,
            'name'     => $data['name'],
            'email'    => $data['email'],
            'phone'    => $data['phone'] ?? null,
            'city'     => $data['city'] ?? null,
            'password' => Hash::make($data['password']),
            'email_verified_at' => $autoVerify ? now() : null,
        ]);

        if (!$autoVerify) {
            $user->notify(new \App\Notifications\VerifyEmailNotification());
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Account created successfully.',
            'user'    => $this->formatUser($user),
            'token'   => $token,
        ], 201);
    }

    // ── LOGIN ─────────────────────────────────────────────────────────────────
    /** POST /api/v1/auth/login */
    public function login(Request $request)
    {
        $data = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Invalid email or password.'], 401);
        }

        if ($user->is_banned || !$user->is_active) {
            return response()->json(['message' => 'Your account has been suspended. Contact support.'], 403);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Logged in successfully.',
            'user'    => $this->formatUser($user),
            'token'   => $token,
        ]);
    }

    // ── LOGOUT ────────────────────────────────────────────────────────────────
    /** POST /api/v1/auth/logout */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully.']);
    }

    // ── ME ────────────────────────────────────────────────────────────────────
    /** GET /api/v1/auth/me */
    public function me(Request $request)
    {
        return response()->json(['user' => $this->formatUser($request->user())]);
    }

    /** PUT /api/v1/auth/me */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $data = $request->validate([
            'name'  => 'sometimes|string|max:255',
            'phone' => 'nullable|string|max:20',
            'city'  => 'nullable|string|max:100',
            'bio'   => 'nullable|string|max:1000',
        ]);

        $user->update($data);

        return response()->json(['message' => 'Profile updated.', 'user' => $this->formatUser($user->fresh())]);
    }

    /** POST /api/v1/auth/me/avatar */
    public function uploadAvatar(Request $request)
    {
        $request->validate(['avatar' => 'required|image|max:2048']);

        $user = $request->user();

        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
        }

        $path = $request->file('avatar')->store('avatars', 'public');
        $user->update(['avatar' => $path]);

        return response()->json([
            'message'    => 'Avatar updated.',
            'avatar_url' => $user->fresh()->avatar_url,
        ]);
    }

    /** DELETE /api/v1/auth/me/avatar */
    public function deleteAvatar(Request $request)
    {
        $user = $request->user();
        if ($user->avatar) {
            Storage::disk('public')->delete($user->avatar);
            $user->update(['avatar' => null]);
        }
        return response()->json([
            'message'    => 'Avatar removed.',
            'avatar_url' => $user->fresh()->avatar_url,
        ]);
    }

    /** PUT /api/v1/auth/me/password */
    public function changePassword(Request $request)
    {
        $data = $request->validate([
            'current_password' => 'required|string',
            'password'         => ['required', 'confirmed', PasswordRule::min(8)],
        ]);

        $user = $request->user();

        if (!Hash::check($data['current_password'], $user->password)) {
            return response()->json(['message' => 'Current password is incorrect.'], 422);
        }

        $user->update(['password' => Hash::make($data['password'])]);

        return response()->json(['message' => 'Password changed successfully.']);
    }

    // ── PASSWORD RESET ────────────────────────────────────────────────────────
    /** POST /api/v1/auth/forgot-password */
    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        $status = Password::sendResetLink($request->only('email'));

        return $status === Password::RESET_LINK_SENT
            ? response()->json(['message' => 'Password reset link sent to your email.'])
            : response()->json(['message' => 'Unable to send reset link.'], 422);
    }

    /** POST /api/v1/auth/reset-password */
    public function resetPassword(Request $request)
    {
        $data = $request->validate([
            'token'    => 'required',
            'email'    => 'required|email',
            'password' => ['required', 'confirmed', PasswordRule::min(8)],
        ]);

        $status = Password::reset($data, function (User $user, string $password) {
            $user->forceFill(['password' => Hash::make($password)])->save();
        });

        return $status === Password::PASSWORD_RESET
            ? response()->json(['message' => 'Password has been reset successfully.'])
            : response()->json(['message' => 'Invalid or expired reset token.'], 422);
    }

    /** GET /api/v1/auth/verify-email/{id}/{hash} */
    public function verifyEmail(Request $request, int $id, string $hash)
    {
        // Validate the cryptographic signature Illuminate\Support\Facades\URL
        // embeds in the link. A tampered or expired URL is rejected here.
        if (! $request->hasValidSignature()) {
            return response()->json(['message' => 'Invalid or expired verification link.'], 403);
        }

        $user = User::find($id);

        if (! $user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        // Verify the hash matches the user's actual email address so an
        // old link can't verify a new email after the address changes.
        if (! hash_equals(sha1($user->email), $hash)) {
            return response()->json(['message' => 'Invalid verification link.'], 403);
        }

        if ($user->email_verified_at) {
            return response()->json(['message' => 'Email already verified.']);
        }

        $user->update(['email_verified_at' => now()]);

        return response()->json(['message' => 'Email verified successfully.']);
    }

    /**
     * Generate a signed verification URL for a given user.
     * Call this from your registration notification / email.
     *
     * Example usage in a Notification / Mailable:
     *   $url = app(AuthController::class)->verificationUrl($user);
     */
    public function verificationUrl(User $user): string
    {
        return URL::temporarySignedRoute(
            'auth.verify-email',          // route name — register in api.php
            now()->addHours(24),
            ['id' => $user->id, 'hash' => sha1($user->email)],
        );
    }

    // ── DASHBOARD OVERVIEW (student) ──────────────────────────────────────────
    /** GET /api/v1/dashboard/overview */
    public function dashboardOverview(Request $request)
    {
        $user = $request->user();

        $enrollments = Enrollment::where('user_id', $user->id)->with('course:id,title,slug,thumbnail')->get();

        $totalSpent  = Payment::where('user_id', $user->id)->where('status', 'paid')->sum('amount');
        $certCount   = Certificate::where('user_id', $user->id)->count();
        $completedCt = $enrollments->where('progress_pct', 100)->count();

        return response()->json([
            'stats' => [
                'enrolled_courses'  => $enrollments->count(),
                'completed_courses' => $completedCt,
                'certificates'      => $certCount,
                'total_spent'       => (float) $totalSpent,
            ],
            'continue_learning' => $enrollments
                ->where('progress_pct', '<', 100)
                ->sortByDesc('updated_at')
                ->take(3)
                ->values()
                ->map(fn($e) => [
                    'course_id'    => $e->course_id,
                    'title'        => $e->course?->title,
                    'slug'         => $e->course?->slug,
                    'thumbnail'    => $e->course?->thumbnail ? asset('storage/'.$e->course->thumbnail) : null,
                    'progress_pct' => $e->progress_pct,
                ]),
        ]);
    }

    /** GET /api/v1/dashboard/instructor-overview — for logged-in instructors */
    public function instructorOverview(Request $request)
    {
        $user = $request->user();

        if (!$user->isInstructor()) {
            return response()->json(['message' => 'This account is not an instructor.'], 403);
        }

        $courses = $user->instructorCourses()
            ->withCount('enrollments as students_count')
            ->get(['id','title','slug','status','total_students','average_rating','price','discount_price','thumbnail']);

        $courseIds = $courses->pluck('id');

        // Enrollment.amount_paid, not Payment.amount — bundle payments have
        // course_id = null so a Payment-based sum misses all bundle revenue.
        $totalEarnings = Enrollment::whereIn('course_id', $courseIds)->sum('amount_paid');
        $totalStudents = Enrollment::whereIn('course_id', $courseIds)->count();
        $recentReviews = Review::whereIn('course_id', $courseIds)
            ->with(['user:id,name,avatar', 'course:id,title'])
            ->orderByDesc('created_at')
            ->take(5)
            ->get(['id','course_id','user_id','rating','body','created_at']);

        return response()->json([
            'stats' => [
                'total_courses'  => $courses->count(),
                'total_students' => $totalStudents,
                'total_earnings' => (float) $totalEarnings,
                'average_rating' => $courses->count() ? round($courses->avg('average_rating'), 1) : 0,
            ],
            'courses' => $courses->map(fn($c) => [
                'id'             => $c->id,
                'title'          => $c->title,
                'slug'           => $c->slug,
                'status'         => $c->status,
                'students_count' => $c->students_count,
                'average_rating' => (float) $c->average_rating,
                'price'          => (float) $c->price,
                'thumbnail'      => $c->thumbnail ? asset('storage/'.$c->thumbnail) : null,
            ]),
            'recent_reviews' => $recentReviews->map(fn($r) => [
                'id'           => $r->id,
                'course_title' => $r->course?->title,
                'student_name' => $r->user?->name,
                'rating'       => $r->rating,
                'comment'      => $r->body,
                'created_at'   => $r->created_at->toDateString(),
            ]),
        ]);
    }

    // ── HELPER ────────────────────────────────────────────────────────────────
    private function formatUser(User $user): array
    {
        $user->load('role');

        return [
            'id'         => $user->id,
            'name'       => $user->name,
            'email'      => $user->email,
            'phone'      => $user->phone,
            'city'       => $user->city,
            'bio'        => $user->bio,
            'avatar'     => $user->avatar_url,
            'role'       => $user->role?->slug,
            'is_admin'       => $user->isAdmin(),
            'is_instructor'  => $user->isInstructor(),
            'email_verified' => (bool) $user->email_verified_at,
            'created_at' => $user->created_at?->toDateString(),
        ];
    }
}
