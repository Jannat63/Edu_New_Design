<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CourseController;
use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\LeaderboardController;
use App\Http\Controllers\Api\LessonController;
use App\Http\Controllers\Api\DoubtController;
use App\Http\Controllers\Api\ReferralController;
use App\Http\Controllers\Api\LessonVideoController;
use App\Http\Controllers\Api\GamificationController;
use App\Http\Controllers\Api\LiveClassController;
use App\Http\Controllers\Api\QuizController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\CertificateController;
use App\Http\Controllers\Api\BlogController;
use App\Http\Controllers\Api\ReviewController;
use App\Http\Controllers\Api\AdminController;
use App\Http\Controllers\Api\InstructorController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\AssignmentController;
use App\Http\Controllers\Api\DiscussionController;
use App\Http\Controllers\Api\WishlistController;
use App\Http\Controllers\Api\SearchController;
use App\Http\Controllers\Api\PayoutController;
use App\Http\Controllers\Api\Admin\CouponController;
use App\Http\Controllers\Api\Admin\QuizManagementController;
use App\Http\Controllers\Api\Admin\BundleController as AdminBundleController;
use App\Http\Controllers\Api\BundleController;
use App\Http\Controllers\Api\Admin\CourseCurriculumController;
use App\Http\Controllers\Api\Admin\SiteContentController;
use App\Http\Controllers\Api\Admin\PaymentMethodController;
use App\Http\Controllers\Api\Admin\MenuItemController;

/*
|─────────────────────────────────────────────────────────────────────────────
| EduBD REST API  —  /api/v1/
|─────────────────────────────────────────────────────────────────────────────
*/

Route::prefix('v1')->group(function () {

    // ── AUTH ─────────────────────────────────────────────────────────────────
    Route::prefix('auth')->group(function () {
        // Throttled: max 5 attempts/minute per IP — blocks brute-force login
        // attempts and prevents someone spamming password-reset emails.
        Route::middleware('throttle:5,1')->group(function () {
            Route::post('register',          [AuthController::class, 'register']);
            Route::post('login',             [AuthController::class, 'login']);
            Route::post('forgot-password',   [AuthController::class, 'forgotPassword']);
            Route::post('reset-password',    [AuthController::class, 'resetPassword']);
        });
        Route::get('verify-email/{id}/{hash}', [AuthController::class, 'verifyEmail'])->name('auth.verify-email');

        // Protected
        Route::middleware('auth:sanctum')->group(function () {
            Route::post('logout',        [AuthController::class, 'logout']);
            Route::get('me',             [AuthController::class, 'me']);
            Route::put('me',             [AuthController::class, 'updateProfile']);
            Route::post('me/avatar',     [AuthController::class, 'uploadAvatar']);
            Route::delete('me/avatar',   [AuthController::class, 'deleteAvatar']);
            Route::put('me/password',    [AuthController::class, 'changePassword']);
        });
    });

    // ── COURSES (public) ──────────────────────────────────────────────────────
    Route::prefix('courses')->group(function () {
        Route::get('/',                  [CourseController::class, 'index']);        // list with filters
        // These two personalize their response (is_enrolled, video_url,
        // locked) for a logged-in visitor while staying open to guests —
        // needs optional.auth or $request->user() silently never resolves.
        Route::middleware('optional.auth')->group(function () {
            Route::get('/{slug}',            [CourseController::class, 'show']);         // detail
            Route::get('/{slug}/lessons',    [CourseController::class, 'lessons']);      // curriculum
        });
        Route::get('/{slug}/reviews',    [ReviewController::class, 'index']);        // reviews
        Route::get('/category/{slug}',   [CourseController::class, 'byCategory']);   // by category

        // Protected
        Route::middleware('auth:sanctum')->group(function () {
            Route::post('/{slug}/enroll',    [CourseController::class, 'enroll']);
            Route::post('/{slug}/review',    [ReviewController::class, 'store']);
            Route::put('/{slug}/review',     [ReviewController::class, 'update']);
            Route::delete('/{slug}/review',  [ReviewController::class, 'destroy']);
            // Real student names + activity ranked against each other —
            // enrolled-only, not something to expose to anonymous visitors.
            Route::get('/{id}/leaderboard',  [LeaderboardController::class, 'course'])->where('id', '[0-9]+');
        });
    });

    // ── LESSONS ───────────────────────────────────────────────────────────────
    Route::middleware('auth:sanctum')->prefix('lessons')->group(function () {
        Route::get('/{id}',              [LessonController::class, 'show']);
        Route::post('/{id}/progress',    [LessonController::class, 'updateProgress']);
        Route::post('/{id}/complete',    [LessonController::class, 'markComplete']);
        Route::get('/{id}/resources',    [LessonController::class, 'resources']);
        // AI doubt-solving assistant (Phase 2 item 3) — throttled per-minute
        // here as a burst guard; DoubtController enforces the real per-day
        // cost cap since throttle:X,1 alone resets every minute.
        Route::get('/{id}/doubts',       [DoubtController::class, 'show']);
        Route::post('/{id}/doubts',      [DoubtController::class, 'ask'])->middleware('throttle:20,1');
    });

    // ── QUIZZES ───────────────────────────────────────────────────────────────
    Route::middleware('auth:sanctum')->prefix('quizzes')->group(function () {
        Route::get('/{id}',              [QuizController::class, 'show']);
        Route::post('/{id}/start',       [QuizController::class, 'start']);
        Route::post('/{id}/submit',      [QuizController::class, 'submit']);
        Route::get('/{id}/result',       [QuizController::class, 'result']);
        Route::get('/{id}/results',      [QuizController::class, 'allResults']);
    });

    // ── PAYMENTS ──────────────────────────────────────────────────────────────
    Route::prefix('payments')->group(function () {
        // Gateway callbacks (no auth — called by gateway servers)
        Route::match(['get','post'], '/bkash/callback', [PaymentController::class, 'bkashCallback']);
        Route::match(['get','post'], '/nagad/callback', [PaymentController::class, 'nagadCallback']);
        Route::post('/ssl/success',      [PaymentController::class, 'sslSuccess']);
        Route::post('/ssl/fail',         [PaymentController::class, 'sslFail']);
        Route::post('/ssl/cancel',       [PaymentController::class, 'sslCancel']);

        // Protected
        Route::middleware('auth:sanctum')->group(function () {
            Route::post('/initiate',     [PaymentController::class, 'initiate']);
            Route::post('/initiate-cart',[PaymentController::class, 'initiateCart']);
            Route::get('/history',       [PaymentController::class, 'history']);
            Route::get('/{id}',          [PaymentController::class, 'show']);
        });
    });

    // ── CART (Phase 6 item 20, UPGRADE_PLAN.md) ────────────────────────────────
    Route::middleware('auth:sanctum')->prefix('cart')->group(function () {
        Route::get('/',               [CartController::class, 'index']);
        Route::post('/',              [CartController::class, 'store']);
        Route::delete('/{id}',        [CartController::class, 'destroy']);
        Route::delete('/',            [CartController::class, 'clear']);
    });

    // ── CERTIFICATES ──────────────────────────────────────────────────────────
    Route::get('/verify/{code}',         [CertificateController::class, 'verify']); // public verify

    Route::middleware('auth:sanctum')->prefix('certificates')->group(function () {
        Route::get('/',                  [CertificateController::class, 'index']);
        Route::get('/{id}/download',     [CertificateController::class, 'download']);
    });

    // ── BLOG (public) ─────────────────────────────────────────────────────────
    Route::prefix('blog')->group(function () {
        Route::get('/',                  [BlogController::class, 'index']);
        Route::get('/categories',        fn() => \App\Models\BlogCategory::withCount('posts')->get());
        Route::get('/{slug}',            [BlogController::class, 'show']);
    });

    // ── INSTRUCTORS (public profiles) ─────────────────────────────────────────
    Route::prefix('instructors')->group(function () {
        Route::get('/',                  [InstructorController::class, 'index']); // list all
        Route::get('/{id}',              [InstructorController::class, 'show']);    // public profile
        Route::get('/{id}/courses',      [InstructorController::class, 'courses']); // instructor's courses
    });

    // ── STUDENT DASHBOARD ─────────────────────────────────────────────────────
    Route::middleware('auth:sanctum')->prefix('dashboard')->group(function () {
        Route::get('/overview',          [AuthController::class, 'dashboardOverview']);
        Route::get('/instructor-overview', [AuthController::class, 'instructorOverview']);
        Route::get('/my-courses',        [CourseController::class, 'myCourses']);
        Route::get('/certificates',      [CertificateController::class, 'index']);
        Route::get('/payments',          [PaymentController::class, 'history']);
    });

    // ── WISHLIST ──────────────────────────────────────────────────────────────
    Route::middleware('auth:sanctum')->prefix('wishlist')->group(function () {
        Route::get('/',                  [WishlistController::class, 'index']);
        Route::post('/courses/{id}',     [WishlistController::class, 'toggle']);
        Route::get('/courses/{id}/check',[WishlistController::class, 'check']);
    });

    // ── REFERRALS (Phase 2 item 4) — open to any logged-in user, not just instructors ──
    Route::middleware('auth:sanctum')->prefix('referrals')->group(function () {
        Route::get('/summary',      [ReferralController::class, 'summary']);
        Route::get('/commissions',  [ReferralController::class, 'commissions']);
        Route::get('/payouts',      [ReferralController::class, 'myPayouts']);
        Route::post('/payouts',     [ReferralController::class, 'requestPayout']);
    });

    // ── GAMIFICATION (Phase 2 item 5) — streaks + badges ──────────────────────
    Route::middleware('auth:sanctum')->get('/gamification/me', [GamificationController::class, 'me']);

    // ── LIVE CLASSES (Phase 3 item 6) — join/list open to any enrolled user ──
    Route::middleware('auth:sanctum')->prefix('live-classes')->group(function () {
        Route::get('/upcoming',      [LiveClassController::class, 'upcoming']);
        Route::post('/{id}/join',    [LiveClassController::class, 'join']);
        Route::delete('/{id}',       [LiveClassController::class, 'destroy']);
    });

    // ── DISCUSSIONS ───────────────────────────────────────────────────────────
    Route::middleware('auth:sanctum')->group(function () {
        Route::get('/courses/{id}/discussions',  [DiscussionController::class, 'index']);
        Route::post('/courses/{id}/discussions', [DiscussionController::class, 'store']);
        Route::put('/discussions/{id}',          [DiscussionController::class, 'update']);
        Route::delete('/discussions/{id}',       [DiscussionController::class, 'destroy']);
        Route::put('/discussions/{id}/solve',    [DiscussionController::class, 'markSolved']);
        Route::put('/discussions/{id}/pin',      [DiscussionController::class, 'pin']);
        Route::post('/discussions/{id}/upvote',  [DiscussionController::class, 'upvote']);
    });

    // ── ASSIGNMENTS (student) ─────────────────────────────────────────────────
    Route::middleware('auth:sanctum')->prefix('assignments')->group(function () {
        Route::get('/{id}',              [AssignmentController::class, 'show']);
        Route::post('/{id}/submit',      [AssignmentController::class, 'submit']);
        Route::get('/submissions/{submissionId}/download', [AssignmentController::class, 'download']);
    });

    // ── NOTIFICATIONS ──────────────────────────────────────────────────────────
    Route::middleware('auth:sanctum')->prefix('notifications')->group(function () {
        Route::get('/',           [NotificationController::class, 'index']);
        Route::get('/unread-count', [NotificationController::class, 'unreadCount']);
        Route::get('/recent',     [NotificationController::class, 'recent']);
        Route::put('/read-all',   [NotificationController::class, 'markAllRead']);
        Route::delete('/',        [NotificationController::class, 'destroyAll']);
        Route::put('/{id}/read',  [NotificationController::class, 'markRead']);
        Route::delete('/{id}',    [NotificationController::class, 'destroy']);
    });

    // ── PUBLIC CONTENT ────────────────────────────────────────────────────────
    Route::get('/site-content',        [SiteContentController::class, 'publicAll']);
    Route::get('/site-content/{group}', [SiteContentController::class, 'publicGroup']);

    // ── PUBLIC PAYMENT METHODS ────────────────────────────────────────────────
    // Live search
    Route::get('/search', [SearchController::class, 'search']);

    // Public bundles listing + detail
    Route::get('/bundles', [BundleController::class, 'index']);
    Route::middleware('optional.auth')->get('/bundles/{id}', [BundleController::class, 'show']);

    // Coupon apply (public — validates before payment).
    // optional.auth: without it, $request->user() would silently resolve to
    // null for every caller (even ones sending a valid Bearer token), which
    // would make the user_id restriction check below reject a coupon's
    // legitimate owner along with everyone else.
    // throttle: this endpoint reveals whether a code is valid and its
    // discount value, so it's rate-limited against brute-force guessing —
    // looser than the 5/min auth throttle since legitimate users may
    // reasonably try a couple of mistyped codes.
    Route::middleware(['optional.auth', 'throttle:15,1'])->post('/coupons/apply', [CouponController::class, 'apply']);

    // Public platform statistics
    Route::get('/stats', fn() => [
        'students'    => \App\Models\User::whereHas('role', fn($q) => $q->where('slug','student'))->count() ?: 50000,
        'courses'     => \App\Models\Course::published()->count() ?: 500,
        'instructors' => \App\Models\User::whereHas('role', fn($q) => $q->where('slug','instructor'))->count() ?: 200,
        'certificates'=> \App\Models\Certificate::count() ?: 12000,
    ]);

    Route::get('/payment-methods',     fn() => \App\Models\PaymentMethod::active()->get()->map(fn($m) => [
        'id' => $m->id, 'type' => $m->type, 'name' => $m->name,
        'account_name' => $m->account_name, 'account_number' => $m->account_number,
        'logo_url' => $m->logo_url, 'instructions' => $m->instructions,
    ]));

    // ── PUBLIC MEGA MENU ──────────────────────────────────────────────────────
    Route::get('/menu',                fn() => \App\Models\MenuItem::active()->orderBy('sort_order')->get());

    // ── PUBLIC PAGE SEO LOOKUP (Phase 6 item 19, UPGRADE_PLAN.md) ─────────────
    // Separate from course/blog SEO, which is returned as part of those
    // models' own show() responses — this covers every page that isn't one
    // of those two.
    Route::get('/page-seo',            [\App\Http\Controllers\Api\Admin\PageSeoController::class, 'lookupByPath']);

    // ── ADMIN ─────────────────────────────────────────────────────────────────
    Route::middleware(['auth:sanctum', 'admin'])->prefix('admin')->group(function () {

        // Dashboard analytics
        Route::get('/analytics/overview',    [AdminController::class, 'overview']);
        Route::get('/analytics/revenue',     [AdminController::class, 'revenue']);
        Route::get('/analytics/enrollments', [AdminController::class, 'enrollments']);
        Route::get('/analytics/users',       [AdminController::class, 'userStats']);

        // Course management
        Route::apiResource('courses',        \App\Http\Controllers\Api\Admin\AdminCourseController::class);
        Route::post('/courses/{id}/publish', [\App\Http\Controllers\Api\Admin\AdminCourseController::class, 'publish']);

        // Course curriculum builder (admin + instructor via gate check in controller)
        Route::get('/courses/{id}/curriculum',              [CourseCurriculumController::class, 'show']);
        Route::post('/courses/{id}/sections',               [CourseCurriculumController::class, 'storeSection']);
        Route::post('/courses/{id}/sections/reorder',       [CourseCurriculumController::class, 'reorderSections']);
        Route::put('/sections/{id}',                        [CourseCurriculumController::class, 'updateSection']);
        Route::delete('/sections/{id}',                     [CourseCurriculumController::class, 'destroySection']);
        Route::post('/sections/{id}/lessons',               [CourseCurriculumController::class, 'storeLesson']);
        Route::post('/sections/{id}/lessons/reorder',       [CourseCurriculumController::class, 'reorderLessons']);
        Route::put('/lessons/{id}',                         [CourseCurriculumController::class, 'updateLesson']);
        Route::delete('/lessons/{id}',                      [CourseCurriculumController::class, 'destroyLesson']);
        Route::post('/lessons/{id}/video/init',              [LessonVideoController::class, 'init']);
        Route::get('/lessons/{id}/video/status',             [LessonVideoController::class, 'status']);

        // Live classes (Phase 3 item 6)
        Route::post('/courses/{courseId}/live-classes',      [LiveClassController::class, 'store']);
        Route::get('/courses/{courseId}/live-classes',       [LiveClassController::class, 'index']);

        // Quiz authoring (admin + instructor via gate inside controller)
        Route::get('/quizzes/{id}',                         [QuizManagementController::class, 'show']);
        Route::put('/quizzes/{id}',                         [QuizManagementController::class, 'update']);
        Route::post('/quizzes/{id}/questions',              [QuizManagementController::class, 'storeQuestion']);
        Route::post('/quizzes/{id}/questions/reorder',      [QuizManagementController::class, 'reorderQuestions']);
        Route::put('/questions/{id}',                       [QuizManagementController::class, 'updateQuestion']);
        Route::delete('/questions/{id}',                     [QuizManagementController::class, 'destroyQuestion']);

        // Assignment grading (admin + instructor)
        Route::get('/assignments/{id}/submissions',                    [AssignmentController::class, 'submissions']);
        Route::put('/assignments/{id}/submissions/{subId}/grade',      [AssignmentController::class, 'grade']);

        // User / Teacher / Student management
        Route::get('/users',                   [AdminController::class, 'users']);
        Route::post('/users',                  [AdminController::class, 'createUser']);          // admin creates student/instructor/admin
        Route::get('/users/{id}',              [AdminController::class, 'user']);
        Route::put('/users/{id}',              [AdminController::class, 'updateUser']);
        Route::delete('/users/{id}',           [AdminController::class, 'deleteUser']);
        Route::put('/users/{id}/ban',          [AdminController::class, 'banUser']);
        Route::put('/users/{id}/unban',        [AdminController::class, 'unbanUser']);
        Route::put('/users/{id}/role',         [AdminController::class, 'changeRole']);          // promote/demote student ↔ instructor ↔ admin
        Route::post('/users/{id}/reset-password', [AdminController::class, 'resetUserPassword']);

        // Payment management
        Route::get('/payments',              [AdminController::class, 'payments']);
        Route::get('/payments/export',       [AdminController::class, 'exportPayments']);
        Route::post('/payments/{id}/refund', [AdminController::class, 'refundPayment']);

        // Blog management (CRUD + SEO)
        Route::get('/blog',                  [BlogController::class, 'adminIndex']);
        Route::get('/blog/{id}',             [BlogController::class, 'adminShow']);
        Route::post('/blog',                 [BlogController::class, 'store']);
        Route::get('/blog/{id}',             fn($id) => \App\Models\BlogPost::with(['author','category'])->findOrFail($id));
        Route::put('/blog/{id}',             [BlogController::class, 'update']);
        Route::delete('/blog/{id}',          [BlogController::class, 'destroy']);
        Route::get('/blog/{id}/seo',         [BlogController::class, 'seoAnalysis']);
        Route::post('/blog/{id}/publish',    [BlogController::class, 'publish']);
        Route::post('/blog/{id}/unpublish',  [BlogController::class, 'unpublish']);

        // Blog categories
        Route::apiResource('blog-categories', \App\Http\Controllers\Api\Admin\BlogCategoryController::class);

        // Site settings
        Route::get('/settings',              [AdminController::class, 'settings']);
        Route::put('/settings',              [AdminController::class, 'updateSettings']);
        Route::get('/settings/{group}',      [AdminController::class, 'settingsByGroup']);

        // CMS — Website Content Management
        Route::get('/cms',                   [SiteContentController::class, 'index']);
        Route::get('/cms/{group}',           [SiteContentController::class, 'show']);
        Route::post('/cms/{group}',          [SiteContentController::class, 'update']);
        Route::delete('/cms/image/{key}',    [SiteContentController::class, 'deleteImage']);

        // Payment Methods (dynamic)
        Route::get('/payment-methods',           [PaymentMethodController::class, 'index']);
        Route::post('/payment-methods',          [PaymentMethodController::class, 'store']);
        Route::put('/payment-methods/{id}',      [PaymentMethodController::class, 'update']);
        Route::delete('/payment-methods/{id}',   [PaymentMethodController::class, 'destroy']);
        Route::post('/payment-methods/reorder',  [PaymentMethodController::class, 'reorder']);

        // Coupons
        Route::get('/coupons',           [CouponController::class, 'index']);
        Route::post('/coupons',          [CouponController::class, 'store']);
        Route::put('/coupons/{id}',      [CouponController::class, 'update']);
        Route::delete('/coupons/{id}',   [CouponController::class, 'destroy']);

        // Bundles
        Route::get('/bundles',           [AdminBundleController::class, 'index']);
        Route::post('/bundles',          [AdminBundleController::class, 'store']);
        Route::put('/bundles/{id}',      [AdminBundleController::class, 'update']);
        Route::delete('/bundles/{id}',   [AdminBundleController::class, 'destroy']);

        // Payouts admin
        Route::get('/payouts',           [PayoutController::class, 'adminIndex']);
        Route::put('/payouts/{id}',      [PayoutController::class, 'adminUpdate']);

        // Referral payouts admin (Phase 2 item 4)
        Route::get('/referral-payouts',      [ReferralController::class, 'adminIndex']);
        Route::put('/referral-payouts/{id}', [ReferralController::class, 'adminUpdate']);

        // Mega Menu
        Route::get('/menu',                  [MenuItemController::class, 'index']);
        Route::post('/menu',                 [MenuItemController::class, 'store']);
        Route::put('/menu/{id}',             [MenuItemController::class, 'update']);
        Route::delete('/menu/{id}',          [MenuItemController::class, 'destroy']);
        Route::post('/menu/reorder',         [MenuItemController::class, 'reorder']);

        // Site-wide page SEO — everything that isn't a course or blog post
        // (those manage their own SEO within their own admin sections).
        // Phase 6 item 19, UPGRADE_PLAN.md.
        Route::get('/page-seo',              [\App\Http\Controllers\Api\Admin\PageSeoController::class, 'index']);
        Route::post('/page-seo',             [\App\Http\Controllers\Api\Admin\PageSeoController::class, 'store']);
        Route::put('/page-seo/{id}',         [\App\Http\Controllers\Api\Admin\PageSeoController::class, 'update']);
        Route::delete('/page-seo/{id}',      [\App\Http\Controllers\Api\Admin\PageSeoController::class, 'destroy']);
    });
    // ── INSTRUCTOR CURRICULUM (reuses same controller — gate inside) ──────────
    Route::middleware('auth:sanctum')->prefix('instructor')->group(function () {
        // Course creation for instructors
        Route::post('/courses', [\App\Http\Controllers\Api\Admin\AdminCourseController::class, 'instructorStore']);
        Route::get('/courses/{id}/curriculum',              [CourseCurriculumController::class, 'show']);
        Route::post('/courses/{id}/sections',               [CourseCurriculumController::class, 'storeSection']);
        Route::post('/courses/{id}/sections/reorder',       [CourseCurriculumController::class, 'reorderSections']);
        Route::put('/sections/{id}',                        [CourseCurriculumController::class, 'updateSection']);
        Route::delete('/sections/{id}',                     [CourseCurriculumController::class, 'destroySection']);
        Route::post('/sections/{id}/lessons',               [CourseCurriculumController::class, 'storeLesson']);
        Route::post('/sections/{id}/lessons/reorder',       [CourseCurriculumController::class, 'reorderLessons']);
        Route::put('/lessons/{id}',                         [CourseCurriculumController::class, 'updateLesson']);
        Route::delete('/lessons/{id}',                      [CourseCurriculumController::class, 'destroyLesson']);
        Route::post('/lessons/{id}/video/init',              [LessonVideoController::class, 'init']);
        Route::get('/lessons/{id}/video/status',             [LessonVideoController::class, 'status']);

        Route::post('/courses/{courseId}/live-classes',      [LiveClassController::class, 'store']);
        Route::get('/courses/{courseId}/live-classes',       [LiveClassController::class, 'index']);

        // Quiz authoring
        Route::get('/quizzes/{id}',                         [QuizManagementController::class, 'show']);
        Route::put('/quizzes/{id}',                         [QuizManagementController::class, 'update']);
        Route::post('/quizzes/{id}/questions',              [QuizManagementController::class, 'storeQuestion']);
        Route::post('/quizzes/{id}/questions/reorder',      [QuizManagementController::class, 'reorderQuestions']);
        Route::put('/questions/{id}',                       [QuizManagementController::class, 'updateQuestion']);
        Route::delete('/questions/{id}',                     [QuizManagementController::class, 'destroyQuestion']);

        // Instructor payouts
        Route::get('/payouts',         [PayoutController::class, 'myPayouts']);
        Route::get('/payouts/balance', [PayoutController::class, 'balance']);
        Route::post('/payouts',        [PayoutController::class, 'request']);

        Route::get('/assignments/{id}/submissions',         [AssignmentController::class, 'submissions']);
        Route::put('/assignments/{id}/submissions/{subId}/grade', [AssignmentController::class, 'grade']);
    });
});
