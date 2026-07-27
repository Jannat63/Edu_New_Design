<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
    @page { margin: 0; }
    body {
        margin: 0;
        font-family: 'Helvetica', 'Arial', sans-serif;
        background: #ffffff;
    }
    .border-outer {
        border: 14px solid #4F46E5;
        padding: 10px;
        height: 555px;
    }
    .border-inner {
        border: 2px solid #C7D2FE;
        height: 100%;
        padding: 40px 60px;
        text-align: center;
    }
    .brand {
        font-size: 22px;
        font-weight: bold;
        color: #4F46E5;
        letter-spacing: 1px;
        margin-bottom: 4px;
    }
    .brand .accent { color: #7C3AED; }
    .label {
        font-size: 13px;
        color: #94A3B8;
        text-transform: uppercase;
        letter-spacing: 3px;
        margin-top: 18px;
    }
    .title {
        font-size: 34px;
        font-weight: bold;
        color: #0F172A;
        margin: 8px 0 22px;
    }
    .presented {
        font-size: 13px;
        color: #475569;
    }
    .student-name {
        font-size: 30px;
        font-weight: bold;
        color: #3730A3;
        margin: 14px 0 22px;
        border-bottom: 2px solid #C7D2FE;
        display: inline-block;
        padding-bottom: 10px;
        min-width: 380px;
    }
    .completion-text {
        font-size: 13px;
        color: #475569;
        line-height: 1.7;
        max-width: 480px;
        margin: 0 auto;
    }
    .course-title {
        font-size: 19px;
        font-weight: bold;
        color: #0F172A;
        margin: 6px 0;
    }
    .footer-row {
        margin-top: 40px;
        width: 100%;
    }
    .footer-cell {
        display: inline-block;
        width: 45%;
        text-align: center;
        font-size: 11px;
        color: #94A3B8;
        vertical-align: top;
    }
    .footer-value {
        font-size: 13px;
        font-weight: bold;
        color: #0F172A;
        margin-bottom: 2px;
    }
    .cert-code {
        margin-top: 30px;
        font-size: 10px;
        color: #94A3B8;
        letter-spacing: 1px;
    }
</style>
</head>
<body>
    <div class="border-outer">
        <div class="border-inner">

            <div class="brand">Edu<span class="accent">BD</span></div>

            <div class="label">Certificate of Completion</div>
            <div class="title">★ ★ ★</div>

            <div class="presented">This certificate is proudly presented to</div>
            <div class="student-name">{{ $studentName }}</div>

            <div class="completion-text">
                for successfully completing all course requirements of
            </div>
            <div class="course-title">{{ $courseTitle }}</div>

            <div class="footer-row">
                <div class="footer-cell">
                    <div class="footer-value">{{ $issuedAt }}</div>
                    Date Issued
                </div>
                <div class="footer-cell">
                    <div class="footer-value">{{ $certCode }}</div>
                    Certificate ID
                </div>
            </div>

            <div class="cert-code">
                Verify this certificate at {{ $verifyUrl }}
            </div>

        </div>
    </div>
</body>
</html>
