"""Loopback-only mobile preview with automatic reload; no build dependencies."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import hashlib
import json
import sys
from urllib.parse import unquote, urlsplit

DEV = Path(__file__).resolve().parent
ROOT = DEV.parent


def version():
    entries = []
    for item in ROOT.rglob('*'):
        if item.is_file() and item.suffix in {'.js', '.css', '.html', '.png', '.jpg', '.svg'}:
            stat = item.stat()
            entries.append(f'{item.relative_to(ROOT)}:{stat.st_mtime_ns}:{stat.st_size}')
    for item in [DEV / 'runtime.js', DEV / 'preview.html']:
        stat = item.stat()
        entries.append(f'{item.name}:{stat.st_mtime_ns}:{stat.st_size}')
    return hashlib.sha256('\n'.join(sorted(entries)).encode()).hexdigest()


RELOAD = """<script>
(() => {
    let version;
    let pending = false;
    setInterval(async () => {
        if (pending) return;
        pending = true;
        try {
            const response = await fetch('/__preview_version', {cache: 'no-store'});
            if (!response.ok) return;
            const next = await response.json();
            if (version && version !== next.version) location.reload();
            version = next.version;
        } catch (_) {} finally { pending = false; }
    }, 700);
})();
</script>"""


class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()

    def do_GET(self):
        route = unquote(urlsplit(self.path).path)
        if route.startswith(('/.git', '/.env', '/supabase/', '/tests/', '/api/', '/dev/')):
            self.send_error(404, 'Server-only resources are not exposed by the preview')
        elif route == '/preview.html':
            self.send_bytes((DEV / 'preview.html').read_bytes(), 'text/html; charset=utf-8')
        elif route == '/__dev/runtime.js':
            self.send_bytes((DEV / 'runtime.js').read_bytes(), 'text/javascript; charset=utf-8')
        elif route == '/__preview_version':
            self.send_bytes(json.dumps({'version': version()}).encode(), 'application/json')
        elif route == '/' or route == '/index.html':
            content = (ROOT / 'index.html').read_text(encoding='utf-8')
            content = content.replace('<script src="https://telegram.org/js/telegram-web-app.js"></script>', '<script src="/__dev/runtime.js"></script>')
            content = content.replace('</body>', RELOAD + '</body>')
            self.send_bytes(content.encode(), 'text/html; charset=utf-8')
        elif route.startswith('/api/'):
            self.send_error(404, 'Production APIs are disabled in local preview')
        else:
            super().do_GET()

    def send_bytes(self, data, content_type):
        self.send_response(200)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', str(len(data)))
        self.end_headers()
        self.wfile.write(data)


if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8081
    server = ThreadingHTTPServer(('127.0.0.1', port), partial(Handler, directory=str(ROOT)))
    print(f'Mobile live preview: http://127.0.0.1:{port}/preview.html', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()
