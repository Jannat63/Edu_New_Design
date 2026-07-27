<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\SiteSetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SiteContentController extends Controller
{
    // ── PUBLIC ────────────────────────────────────────────────────────────────

    /** GET /api/v1/site-content — all active settings as flat key→value map */
    public function publicAll()
    {
        $settings = SiteSetting::all()->mapWithKeys(fn($s) => [$s->key => $this->castValue($s)]);
        return response()->json($settings);
    }

    /** GET /api/v1/site-content/{group} — settings for one group */
    public function publicGroup(string $group)
    {
        $settings = SiteSetting::where('group', $group)->get()
            ->mapWithKeys(fn($s) => [$s->key => $this->castValue($s)]);

        return response()->json($settings);
    }

    // ── ADMIN ─────────────────────────────────────────────────────────────────

    /** GET /api/v1/admin/cms — all settings grouped with metadata */
    public function index()
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

    /** GET /api/v1/admin/cms/{group} */
    public function show(string $group)
    {
        $settings = SiteSetting::where('group', $group)->get()->map(fn($s) => [
            'key'         => $s->key,
            'value'       => $this->castValue($s),
            'type'        => $s->type,
            'label'       => $s->label,
            'description' => $s->description,
        ]);

        return response()->json($settings);
    }

    /**
     * POST /api/v1/admin/cms/{group}
     * Accepts multipart/form-data.
     * Text fields go into 'settings[key]' = value.
     * Image fields go into 'images[key]' = file.
     */
    public function update(string $group, Request $request)
    {
        $request->validate([
            'settings'        => 'sometimes|array',
            'images.*'        => 'nullable|image|max:3072|mimes:jpg,jpeg,png,webp',
        ]);

        // ── Save text / json settings ─────────────────────────────────────────
        foreach ($request->input('settings', []) as $key => $value) {
            $existing = SiteSetting::firstOrNew(['key' => $key]);
            $type     = $existing->type ?? 'string';

            $stored = match ($type) {
                'boolean' => $value ? '1' : '0',
                'json'    => (is_array($value) ? json_encode($value) : $value),
                default   => (string) $value,
            };

            $existing->fill([
                'key'   => $key,
                'value' => $stored,
                'group' => $group,
                'type'  => $type,
            ])->save();
        }

        // ── Save image uploads ────────────────────────────────────────────────
        foreach ($request->file('images', []) as $key => $file) {
            $existing = SiteSetting::firstOrNew(['key' => $key]);

            // Remove old file
            if ($existing->type === 'string' && $existing->value && Storage::disk('public')->exists($existing->value)) {
                Storage::disk('public')->delete($existing->value);
            }

            $path = $file->store("cms/{$group}", 'public');

            $existing->fill([
                'key'   => $key,
                'value' => $path,
                'group' => $group,
                'type'  => 'string',
            ])->save();
        }

        return response()->json(['message' => ucfirst($group) . ' content saved.']);
    }

    /** DELETE /api/v1/admin/cms/image/{key} — remove an image setting */
    public function deleteImage(string $key)
    {
        $setting = SiteSetting::where('key', $key)->first();

        if ($setting && $setting->value && Storage::disk('public')->exists($setting->value)) {
            Storage::disk('public')->delete($setting->value);
            $setting->update(['value' => null]);
        }

        return response()->json(['message' => 'Image removed.']);
    }

    // ── HELPERS ───────────────────────────────────────────────────────────────
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
