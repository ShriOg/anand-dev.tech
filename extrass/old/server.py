#!/usr/bin/env python3

from flask import Flask, jsonify, request, send_from_directory
import os
import argparse
import webbrowser

app = Flask(__name__, static_folder='.', static_url_path='')

@app.route('/')
def index():

    return send_from_directory('.', 'index.html')

@app.route('/<path:path>')
def static_files(path):

    if os.path.isfile(path):
        return send_from_directory('.', path)

    if '.' not in path.split('/')[-1]:
        return send_from_directory('.', 'index.html')
    return 'Not Found', 404

@app.route('/api/menu', methods=['GET'])
def get_menu():

    return jsonify({'error': 'API not yet implemented. Using client-side MenuData.'}), 404

@app.route('/api/checkout', methods=['POST'])
def checkout():

    data = request.json

    return jsonify({'status': 'success', 'message': 'Order placed'}), 200

@app.route('/api/health')
def health():

    return jsonify({'status': 'ok'}), 200

@app.errorhandler(404)
def not_found(e):

    return send_from_directory('.', 'index.html'), 200

@app.errorhandler(500)
def server_error(e):

    return jsonify({'error': 'Internal server error'}), 500

@app.before_request
def log_request():

    if not request.path.startswith('/api/'):
        return
    app.logger.info(f"{request.method} {request.path}")

@app.after_request
def add_cors_headers(response):

    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
    return response

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
