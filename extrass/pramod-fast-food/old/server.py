#!/usr/bin/env python3
"""
Flask server for Pramod Fast Food with API routes ready for backend integration.

Requirements:
    pip install flask

Usage:
    python3 server.py
    # or
    python3 server.py --port 8080 --debug
"""

from flask import Flask, jsonify, request, send_from_directory
import os
import argparse
import webbrowser

app = Flask(__name__, static_folder='.', static_url_path='')

# ============ Static files ============

@app.route('/')
def index():
    """Serve index.html"""
    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def static_files(path):
    """Serve static files (CSS, JS, images, etc)"""
    if os.path.isfile(path):
        return send_from_directory('.', path)
    # SPA: if it's a route (no file extension), serve index.html
    if '.' not in path.split('/')[-1]:
        return send_from_directory('.', 'index.html')
    return 'Not Found', 404

# ============ API Routes (future integration) ============

@app.route('/api/menu', methods=['GET'])
def get_menu():
    """
    Future endpoint: replace with actual database fetch.
    Currently returns 404 — client falls back to hardcoded MenuData.
    """
    return jsonify({'error': 'API not yet implemented. Using client-side MenuData.'}), 404

@app.route('/api/checkout', methods=['POST'])
def checkout():
    """
    Future endpoint: validate cart and process WhatsApp order.
    """
    data = request.json
    # Validate, log, integrate with order system, etc.
    return jsonify({'status': 'success', 'message': 'Order placed'}), 200

@app.route('/api/health')
def health():
    """Health check endpoint for monitoring."""
    return jsonify({'status': 'ok'}), 200

# ============ Error handlers ============

@app.errorhandler(404)
def not_found(e):
    """Custom 404: serve index.html for SPA routing"""
    return send_from_directory('.', 'index.html'), 200

@app.errorhandler(500)
def server_error(e):
    """Custom 500 error response"""
    return jsonify({'error': 'Internal server error'}), 500

# ============ Middleware ============

@app.before_request
def log_request():
    """Log incoming requests (development)."""
    if not request.path.startswith('/api/'):
        return
    app.logger.info(f"{request.method} {request.path}")

# ============ CORS (for future external APIs) ============

@app.after_request
def add_cors_headers(response):
    """Allow CORS for development (restrict in production)."""
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

# ============ Main ============

def main():
    parser = argparse.ArgumentParser(description='Pramod Fast Food Flask server')
    parser.add_argument('--port', '-p', type=int, default=3000, help='Port to listen on')
    parser.add_argument('--host', '-H', default='127.0.0.1', help='Host to bind to')
    parser.add_argument('--debug', '-d', action='store_true', help='Enable debug mode')
    parser.add_argument('--no-browser', action='store_true', help='Do not open browser')
    args = parser.parse_args()

    url = f'http://{args.host}:{args.port}'
    print(f"🍜 Pramod Fast Food Flask Server")
    print(f"📍 Serving at {url}")
    print(f"🔧 Debug mode: {args.debug}")
    print(f"🌐 Press Ctrl+C to stop\n")

    if not args.no_browser:
        webbrowser.open(url)

    try:
        app.run(host=args.host, port=args.port, debug=args.debug)
    except KeyboardInterrupt:
        print("\n\n✌️  Server stopped")

if __name__ == '__main__':
    main()
