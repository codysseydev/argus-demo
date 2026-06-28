<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Sign in · Argus Demo</title>
    <style>
        :root { color-scheme: light dark; }
        * { box-sizing: border-box; }
        body {
            margin: 0; min-height: 100vh; display: grid; place-items: center;
            font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
            background: #0f172a; color: #e2e8f0;
        }
        .card {
            width: 100%; max-width: 360px; padding: 2rem;
            background: #1e293b; border: 1px solid #334155; border-radius: 12px;
        }
        h1 { margin: 0 0 .25rem; font-size: 1.25rem; }
        p.sub { margin: 0 0 1.5rem; color: #94a3b8; font-size: .875rem; }
        label { display: block; font-size: .8rem; margin: 1rem 0 .35rem; color: #cbd5e1; }
        input[type=email], input[type=password] {
            width: 100%; padding: .6rem .7rem; border-radius: 8px;
            border: 1px solid #475569; background: #0f172a; color: #e2e8f0; font-size: .95rem;
        }
        .remember { display: flex; align-items: center; gap: .5rem; margin-top: 1rem; font-size: .85rem; color: #cbd5e1; }
        button {
            margin-top: 1.5rem; width: 100%; padding: .65rem; border: 0; border-radius: 8px;
            background: #6366f1; color: white; font-size: .95rem; font-weight: 600; cursor: pointer;
        }
        button:hover { background: #4f46e5; }
        .error { margin-top: 1rem; padding: .6rem .7rem; border-radius: 8px;
            background: #7f1d1d; color: #fecaca; font-size: .85rem; }
        .hint { margin-top: 1.5rem; padding-top: 1rem; border-top: 1px solid #334155;
            color: #94a3b8; font-size: .8rem; line-height: 1.5; }
        code { color: #e2e8f0; }
    </style>
</head>
<body>
    <form class="card" method="POST" action="/login">
        @csrf
        <h1>Argus</h1>
        <p class="sub">Queue observability dashboard</p>

        @if ($errors->any())
            <div class="error">{{ $errors->first() }}</div>
        @endif

        <label for="email">Email</label>
        <input id="email" name="email" type="email" value="{{ old('email', 'demo@argus.test') }}" required autofocus>

        <label for="password">Password</label>
        <input id="password" name="password" type="password" value="password" required>

        <label class="remember"><input type="checkbox" name="remember" value="1"> Remember me</label>

        <button type="submit">Sign in</button>

        <p class="hint">Demo credentials are pre-filled:<br>
            <code>demo@argus.test</code> / <code>password</code></p>
    </form>
</body>
</html>
