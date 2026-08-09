<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Daily.co integration (Phase 3 item 6). Chosen over Zoom/Agora for the
 * simplest possible integration surface: a plain Bearer-token REST API (no
 * OAuth flow, no client SDK required), and every room is itself a complete,
 * functional call UI at its own URL — so the frontend embeds it as a plain
 * iframe, the same pattern already used for YouTube and Bunny Stream
 * playback, rather than pulling in @daily-co/daily-js as a new dependency.
 * Verified against Daily's current REST API docs (api.daily.co/v1, Bearer
 * auth, POST /rooms, POST /meeting-tokens) before writing this, not just
 * training-data recall.
 */
class DailyCoService
{
    private const API_BASE = 'https://api.daily.co/v1';

    public function __construct(private ?string $apiKey = null)
    {
        $this->apiKey ??= config('services.daily.api_key');
    }

    public function isConfigured(): bool
    {
        return !empty($this->apiKey);
    }

    /**
     * @throws \RuntimeException
     */
    public function createRoom(string $roomName, \DateTimeInterface $expiresAt): void
    {
        $response = $this->client()->post(self::API_BASE . '/rooms', [
            'name'       => $roomName,
            'privacy'    => 'private', // access only via a signed meeting token, not a guessable public link
            'properties' => [
                'exp'                       => $expiresAt->getTimestamp(),
                'eject_at_room_exp'         => true, // auto-kick everyone when the class's scheduled window ends
                'enable_chat'               => true,
                'enable_screenshare'        => true,
                'start_video_off'           => true, // instructor/student join with camera off, not put on the spot immediately
            ],
        ]);

        if (!$response->successful()) {
            Log::warning('DailyCoService: createRoom failed', ['status' => $response->status(), 'body' => $response->body()]);
            throw new \RuntimeException('Could not schedule the live class. Please try again.');
        }
    }

    /**
     * @throws \RuntimeException
     */
    public function createMeetingToken(string $roomName, string $userName, bool $isOwner, \DateTimeInterface $expiresAt): string
    {
        $response = $this->client()->post(self::API_BASE . '/meeting-tokens', [
            'properties' => [
                'room_name'          => $roomName, // scopes the token to this one room — never omit this
                'user_name'          => $userName,
                'is_owner'           => $isOwner,  // instructor gets moderator controls (mute others, etc.)
                'exp'                => $expiresAt->getTimestamp(),
                'eject_at_token_exp' => true,
            ],
        ]);

        if (!$response->successful() || !$response->json('token')) {
            Log::warning('DailyCoService: createMeetingToken failed', ['status' => $response->status(), 'body' => $response->body()]);
            throw new \RuntimeException('Could not create a join link for this class. Please try again.');
        }

        return $response->json('token');
    }

    public function deleteRoom(string $roomName): void
    {
        try {
            $this->client()->delete(self::API_BASE . "/rooms/{$roomName}");
        } catch (\Throwable $e) {
            // Best-effort — rooms are also created with `exp` set, so an
            // undeleted room self-cleans on Daily's side regardless.
            Log::warning('DailyCoService: deleteRoom failed', ['room' => $roomName, 'error' => $e->getMessage()]);
        }
    }

    /** Builds the embeddable join URL for a room + token — this is what goes in the iframe src. */
    public function joinUrl(string $roomName, string $token): string
    {
        $domain = config('services.daily.domain');
        return "https://{$domain}.daily.co/{$roomName}?t={$token}";
    }

    private function client()
    {
        return Http::withToken($this->apiKey)->timeout(15);
    }
}
