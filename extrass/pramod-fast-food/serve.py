#!/usr/bin/env python3
"""
Simple HTTP server for Pramod Fast Food menu app.
Serves static files from the current directory.

Usage:
    python3 serve.py
    # or
    python3 serve.py --port 8080
"""

import http.server
import socketserver
import os
import sys
import argparse
import webbrowser
from urllib.parse import urlparse

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom handler with better logging and SPA support."""

    def end_headers(self):
        """Add cache-busting headers for development."""
        self.send_header('Cache-Control', 'no-store, no-cache, max-age=0')
        self.send_header('Access-Control-Allow-Origin', '*')
        super().end_headers()

    def log_message(self, format, *args):
        """Pretty-print requests."""
        sys.stderr.write(f"[{self.log_date_time_string()}] {format % args}\n")

    def do_GET(self):
        """Serve index.html for all routes (SPA support)."""
        path = urlparse(self.path).path

        # Try exact file first
        if os.path.isfile(self.translate_path(path)):
            return super().do_GET()

        # If it's not a file extension, serve index.html
        if '.' not in path.split('/')[-1]:
            self.path = '/index.html'

        return super().do_GET()

def main():
    parser = argparse.ArgumentParser(description='Serve Pramod Fast Food menu app')
    parser.add_argument('--port', '-p', type=int, default=3000, help='Port to listen on (default: 3000)')
    parser.add_argument('--host', '-H', default='localhost', help='Host to bind to (default: localhost)')
    parser.add_argument('--no-browser', action='store_true', help='Do not open browser automatically')
    args = parser.parse_args()

    host = args.host
    port = args.port
    url = f'http://{host}:{port}'

    # Change to app directory
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    with socketserver.TCPServer((host, port), MyHTTPRequestHandler) as httpd:
        print(f"🍜 Pramod Fast Food Server")
        print(f"📍 Serving at {url}")
        print(f"🌐 Press Ctrl+C to stop\n")

        if not args.no_browser:
            webbrowser.open(url)

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\n✌️  Server stopped")
            sys.exit(0)

if __name__ == '__main__':
    main()
