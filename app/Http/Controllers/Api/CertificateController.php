<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Certificate;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CertificateController extends Controller
{
    /** GET /api/v1/certificates — current user's certificates */
    public function index(Request $request)
    {
        $certs = Certificate::where('user_id', $request->user()->id)
            ->with('course:id,title,slug,thumbnail')
            ->orderByDesc('issued_at')
            ->get();

        return response()->json($certs->map(fn($c) => [
            'id'         => $c->id,
            'cert_code'  => $c->cert_code,
            'course'     => ['title' => $c->course?->title, 'slug' => $c->course?->slug],
            'issued_at'  => $c->issued_at->toDateString(),
            'pdf_url'    => $c->pdf_url,
            'verify_url' => url('/api/v1/verify/' . $c->cert_code),
        ]));
    }

    /**
     * GET /api/v1/certificates/{id}/download
     *
     * If a PDF has already been generated (pdf_path set), stream it.
     * Otherwise, generate one on the fly using DomPDF (if installed) and
     * store it for next time.
     *
     * Requires:  composer require barryvdh/laravel-dompdf
     * And a Blade view at resources/views/certificates/template.blade.php
     */
    public function download(int $id, Request $request)
    {
        $cert = Certificate::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->with(['user:id,name', 'course:id,title'])
            ->firstOrFail();

        // Already generated — stream existing file
        if ($cert->pdf_path && Storage::disk('public')->exists($cert->pdf_path)) {
            return Storage::disk('public')->download($cert->pdf_path, "certificate-{$cert->cert_code}.pdf");
        }

        // Generate on the fly
        if (!class_exists(\Barryvdh\DomPDF\Facade\Pdf::class)) {
            return response()->json([
                'message' => 'PDF generation requires the barryvdh/laravel-dompdf package. '
                            . 'Run: composer require barryvdh/laravel-dompdf',
                'cert_code'  => $cert->cert_code,
                'verify_url' => url('/api/v1/verify/' . $cert->cert_code),
            ], 501);
        }

        $pdf = \Barryvdh\DomPDF\Facade\Pdf::loadView('certificates.template', [
            'studentName' => $cert->user->name,
            'courseTitle' => $cert->course->title,
            'certCode'    => $cert->cert_code,
            'issuedAt'    => $cert->issued_at->format('F j, Y'),
            'verifyUrl'   => url('/verify/' . $cert->cert_code),
        ])->setPaper('a4', 'landscape');

        $path = "certificates/{$cert->cert_code}.pdf";
        Storage::disk('public')->put($path, $pdf->output());
        $cert->update(['pdf_path' => $path]);

        return Storage::disk('public')->download($path, "certificate-{$cert->cert_code}.pdf");
    }

    /**
     * GET /api/v1/verify/{code} — PUBLIC endpoint, no auth required.
     * Used by the "/verify/[code]" frontend page and by employers checking
     * certificate authenticity.
     */
    public function verify(string $code)
    {
        $cert = Certificate::where('cert_code', $code)
            ->with(['user:id,name', 'course:id,title,slug'])
            ->first();

        if (!$cert) {
            return response()->json([
                'valid'   => false,
                'message' => 'No certificate found with this code.',
            ], 404);
        }

        return response()->json([
            'valid'        => true,
            'cert_code'    => $cert->cert_code,
            'student_name' => $cert->user->name,
            'course_title' => $cert->course->title,
            'course_slug'  => $cert->course->slug,
            'issued_at'    => $cert->issued_at->format('F j, Y'),
            'issuer'       => config('app.name', 'EduBD'),
        ]);
    }
}
