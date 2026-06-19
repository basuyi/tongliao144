import http.server
import socketserver
import socket
import os
import webbrowser

PORT = 8080
HTML_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'outputs', 'card-game.html')

class Handler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        # Serve the game for any path
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Cache-Control', 'no-cache')
        self.end_headers()
        with open(HTML_FILE, 'rb') as f:
            self.wfile.write(f.read())
    
    def log_message(self, format, *args):
        # Minimal logging
        print(f'  {args[0]}')

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        return s.getsockname()[0]
    except:
        return '127.0.0.1'
    finally:
        s.close()

if __name__ == '__main__':
    local_ip = get_local_ip()
    
    with socketserver.TCPServer(('', PORT), Handler) as httpd:
        print(f'\n{"="*50}')
        print(f'  144 Card Game Server')
        print(f'{"="*50}')
        print(f'\n  This computer: http://localhost:{PORT}')
        print(f'  Phone access:  http://{local_ip}:{PORT}')
        print(f'  Online mode:   http://{local_ip}:{PORT}?mode=online')
        print(f'\n  Press Ctrl+C to stop\n')
        print(f'{"="*50}\n')
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print('\nServer stopped.')
