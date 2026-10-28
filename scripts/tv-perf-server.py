"""Development only: receive the built-in smoothness test's numbers from the TV.
Writes .local/widgets-perf.js (so the next personal package runs the test and reports here),
waits for the results, saves them to .local/logs/tv-perf.json, then removes the test file.
Usage: python3 scripts/tv-perf-server.py <this computer's LAN address> [port]"""
import json, sys, time
from http.server import BaseHTTPRequestHandler, HTTPServer
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
args = [a for a in sys.argv[1:] if not a.startswith('--')]
host, port = args[0], int(args[1]) if len(args) > 1 else 8765
flag, out = ROOT / '.local/widgets-perf.js', ROOT / '.local/logs/tv-perf.json'
if sys.argv[-1] == '--arm':
    flag.write_text('window.FramePerf = { report: "http://%s:%d/" };\n' % (host, port))
    print('Test build armed for http://%s:%d/' % (host, port)); sys.exit(0)
if sys.argv[-1] == '--disarm':
    flag.unlink(missing_ok=True); print('Test build disarmed.'); sys.exit(0)


class Handler(BaseHTTPRequestHandler):
    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers.get('Content-Length') or 0)) or b'{}')
        self.send_response(204); self.send_header('Access-Control-Allow-Origin', '*'); self.end_headers()
        if body.get('done'):
            out.parent.mkdir(parents=True, exist_ok=True)
            out.write_text(json.dumps(body, indent=2))
            Handler.finished = True
        else:
            print('  medindo... %s de %s' % (body.get('progress'), body.get('of')), flush=True)

    def do_OPTIONS(self):
        self.send_response(204); self.send_header('Access-Control-Allow-Origin', '*'); self.send_header('Access-Control-Allow-Headers', 'Content-Type'); self.end_headers()

    def log_message(self, *args):
        pass


Handler.finished = False
server = HTTPServer(('0.0.0.0', port), Handler)
server.timeout = 2
deadline = time.time() + 600
print('Esperando os números da TV em http://%s:%d/ ...' % (host, port), flush=True)
while not Handler.finished and time.time() < deadline:
    server.handle_request()
if not Handler.finished:
    print('A TV não mandou os números em 10 minutos.'); sys.exit(1)
data = json.loads(out.read_text())
print('TV:', json.dumps(data['env']))
for r in data['runs']:
    print('%dms  %-26s %5s fps  p95 %sms  pior %sms  perdidos %s  tecla %s/%sms' % (r['gap'], r['name'], r['fps'], r['p95'], r['worst'], r['dropped'], r['keyMs'], r['keyWorst']))
for r in data['idle']:
    print('parado  %-26s atraso médio %sms  pior %sms' % (r['name'], r['lateAvg'], r['lateWorst']))
print('Salvo em', out)
