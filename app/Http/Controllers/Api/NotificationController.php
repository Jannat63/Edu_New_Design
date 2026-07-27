<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Notifications\DatabaseNotification;

class NotificationController extends Controller
{
    /** GET /api/v1/notifications?per_page=20 */
    public function index(Request $request)
    {
        $notifications = $request->user()
            ->notifications()
            ->orderByDesc('created_at')
            ->paginate($request->per_page ?? 20)
            ->through(fn($n) => $this->payload($n));

        return response()->json($notifications);
    }

    /** GET /api/v1/notifications/unread-count */
    public function unreadCount(Request $request)
    {
        return response()->json([
            'count' => $request->user()->unreadNotifications()->count(),
        ]);
    }

    /** GET /api/v1/notifications/recent — last 10 for dropdown */
    public function recent(Request $request)
    {
        $items = $request->user()
            ->notifications()
            ->take(10)
            ->get()
            ->map(fn($n) => $this->payload($n));

        return response()->json([
            'notifications' => $items,
            'unread_count'  => $request->user()->unreadNotifications()->count(),
        ]);
    }

    /** PUT /api/v1/notifications/{id}/read */
    public function markRead(Request $request, string $id)
    {
        $notification = $request->user()->notifications()->findOrFail($id);
        $notification->markAsRead();

        return response()->json(['message' => 'Notification marked as read.']);
    }

    /** PUT /api/v1/notifications/read-all */
    public function markAllRead(Request $request)
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json(['message' => 'All notifications marked as read.']);
    }

    /** DELETE /api/v1/notifications/{id} */
    public function destroy(Request $request, string $id)
    {
        $request->user()->notifications()->findOrFail($id)->delete();

        return response()->json(['message' => 'Notification deleted.']);
    }

    /** DELETE /api/v1/notifications — clear all */
    public function destroyAll(Request $request)
    {
        $request->user()->notifications()->delete();

        return response()->json(['message' => 'All notifications cleared.']);
    }

    // ── HELPERS ───────────────────────────────────────────────────────────────
    private function payload(DatabaseNotification $n): array
    {
        return [
            'id'         => $n->id,
            'title'      => $n->data['title']   ?? 'Notification',
            'message'    => $n->data['message']  ?? '',
            'url'        => $n->data['url']      ?? null,
            'icon'       => $n->data['icon']     ?? 'bell',
            'type'       => $n->data['type']     ?? 'info',
            'is_read'    => !is_null($n->read_at),
            'read_at'    => $n->read_at?->diffForHumans(),
            'created_at' => $n->created_at->diffForHumans(),
        ];
    }
}
