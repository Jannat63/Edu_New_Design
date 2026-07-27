<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>EduBD — Learn From Bangladesh's Best</title>
    <meta name="description" content="EduBD is Bangladesh's top online learning platform. Courses in Web Development, Design, Business and more.">
    @viteReactRefresh
    @vite(['resources/js/app.jsx'])

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    <style>
      :root {
        color-scheme: light;
        /* EduBD design tokens — see resources/js/lib/theme.js for the JS-side copy of these values */
        --rice: #FBF6EE; --rice-deep: #F3ECDE; --ink: #211D1A; --ink-soft: #5B564E;
        --indigo: #28305E; --indigo-deep: #1A2044; --red: #B23A2E; --red-deep: #8C2A21;
        --gold: #C98A2C; --green: #3A6B4C; --line: #E4DBC8;
      }
      [data-theme="dark"] {
        color-scheme: dark;
        --rice: #1C1A17; --rice-deep: #242220; --ink: #F3ECE0; --ink-soft: #B8AFA0;
        --indigo: #6B76C9; --indigo-deep: #8B95E0; --red: #E0685A; --red-deep: #F08B7F;
        --gold: #E0A94E; --green: #5FA378; --line: #3A362F;
      }
      [data-theme="dark"] body { background: var(--rice); color: var(--ink); }
      * { box-sizing: border-box; }
      body { margin: 0; background: var(--rice); color: var(--ink); font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    </style>
</head>
<body>
    <div id="root"></div>
</body>
</html>
