<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Bunny Stream integration (Phase 3 item 7). Handles the parts that must
 * happen server-side — creating the remote video record, signing a direct
 * browser-to-Bunny upload, checking processing status, and deleting videos.
 * The actual file bytes never pass through this Laravel app: they go
 * straight from the instructor's browser to Bunny over the TUS resumable
 * upload protocol (see resources/js/components/CurriculumModal.jsx), which
 * matters because course videos can be hundreds of MB to a few GB — well
 * past what a PHP request (upload_max_filesize, max_execution_time) should
 * ever try to proxy.
 *
 * Confidence note: the account/library/create/status/delete endpoints below
 * are Bunny's long-standing, stable Stream API surface. The exact numeric
 * status codes in isReady()/hasFailed() and the TUS signature header names
 * are the pieces most likely to drift over a long-lived Bunny account —
 * worth a quick check against video.bunnycdn.com's current docs before
 * relying on this in production, since this integration has not been
 * exercised against a real Bunny account (no credentials available in the
 * environment this was built in).
 */
class BunnyStreamService
{
    private const API_BASE = 'https://video.bunnycdn.com';
    private const TUS_ENDPOINT = 'https://video.bunnycdn.com/tusupload';

    public function __construct(
        private ?string $apiKey = null,
        private ?string $libraryId = null,
        private ?string $cdnHostname = null,
    ) {
        $this->apiKey ??= config('services.bunny.api_key');
        $this->libraryId ??= config('services.bunny.library_id');
        $this->cdnHostname ??= config('services.bunny.cdn_hostname');
    }

    public function isConfigured(): bool
    {
        return !empty($this->apiKey) && !empty($this->libraryId);
    }

    /**
     * Creates the remote video record Bunny expects to exist before any
     * bytes are uploaded to it.
     *
     * @throws \RuntimeException
     */
    public function createVideo(string $title): string
    {
        $response = Http::withHeaders(['AccessKey' => $this->apiKey])
            ->timeout(15)
            ->post(self::API_BASE . "/library/{$this->libraryId}/videos", ['title' => $title]);

        if (!$response->successful() || !$response->json('guid')) {
            Log::warning('BunnyStreamService: createVideo failed', ['status' => $response->status(), 'body' => $response->body()]);
            throw new \RuntimeException('Could not start the video upload. Please try again shortly.');
        }

        return $response->json('guid');
    }

    /**
     * Signs a direct-to-Bunny TUS upload so the browser can upload straight
     * to Bunny's edge without the API key ever reaching client code. Bunny
     * verifies AuthorizationSignature = sha256(libraryId + apiKey + expire + videoGuid).
     *
     * @return array{endpoint:string, expire:int, signature:string, library_id:string, video_guid:string}
     */
    public function signUpload(string $videoGuid): array
    {
        $expire = now()->addHours(2)->timestamp; // generous window for a large, possibly slow upload

        return [
            'endpoint'   => self::TUS_ENDPOINT,
            'expire'     => $expire,
            'signature'  => hash('sha256', $this->libraryId . $this->apiKey . $expire . $videoGuid),
            'library_id' => $this->libraryId,
            'video_guid' => $videoGuid,
        ];
    }

    /**
     * @return array{status:int, ready:bool, failed:bool, processing:bool, duration_seconds:int|null, playback_url:string|null, thumbnail_url:string|null}
     * @throws \RuntimeException
     */
    public function checkStatus(string $videoGuid): array
    {
        $response = Http::withHeaders(['AccessKey' => $this->apiKey])
            ->timeout(15)
            ->get(self::API_BASE . "/library/{$this->libraryId}/videos/{$videoGuid}");

        if (!$response->successful()) {
            throw new \RuntimeException('Could not check video processing status.');
        }

        $status = (int) $response->json('status', 0);

        return [
            'status'           => $status,
            'ready'            => $this->isReady($status),
            'failed'           => $this->hasFailed($status),
            'processing'       => !$this->isReady($status) && !$this->hasFailed($status),
            'duration_seconds' => $response->json('length'), // null until Bunny finishes analyzing
            'playback_url'     => $this->isReady($status) ? $this->playbackUrl($videoGuid) : null,
            'thumbnail_url'    => $this->thumbnailUrl($videoGuid),
        ];
    }

    public function deleteVideo(string $videoGuid): void
    {
        try {
            Http::withHeaders(['AccessKey' => $this->apiKey])
                ->timeout(15)
                ->delete(self::API_BASE . "/library/{$this->libraryId}/videos/{$videoGuid}");
        } catch (\Throwable $e) {
            // Best-effort — a failed remote cleanup shouldn't block deleting
            // the lesson locally; it just leaves an orphaned video in the
            // Bunny library, which is a storage-cost nuisance, not data loss.
            Log::warning('BunnyStreamService: deleteVideo failed', ['guid' => $videoGuid, 'error' => $e->getMessage()]);
        }
    }

    /**
     * Bunny's own iframe embed player, not a raw HLS/MP4 url. Deliberate
     * choice: Bunny serves adaptive-bitrate HLS, which plain <video src>
     * only plays natively in Safari — Chrome/Firefox/Edge need a JS HLS
     * player. Rather than add hls.js as a new dependency for this, this
     * reuses the exact pattern Learn.jsx's VideoPlayer already has for
     * YouTube (render an iframe), which is also Bunny's own recommended
     * embed method. Trade-off: like the existing YouTube path, this loses
     * the custom player's progress-tracking/resume-position — a real,
     * known gap, not fixed here (see UPGRADE_PLAN.md).
     */
    public function playbackUrl(string $videoGuid): string
    {
        return "https://iframe.mediadelivery.net/embed/{$this->libraryId}/{$videoGuid}?autoplay=false";
    }

    public function thumbnailUrl(string $videoGuid): string
    {
        return "https://{$this->cdnHostname}/{$videoGuid}/thumbnail.jpg";
    }

    private function isReady(int $status): bool
    {
        return $status === 4; // "Finished" in Bunny's processing pipeline
    }

    private function hasFailed(int $status): bool
    {
        return in_array($status, [5, 6], true); // "Error" / "UploadFailed"
    }
}
