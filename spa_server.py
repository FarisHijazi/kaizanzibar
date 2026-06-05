#!/usr/bin/env python3
"""Tiny localhost-only static server with SPA fallback for the kaizanzibar mirror."""
import http.server
import socketserver
import os
import sys

DOCROOT = sys.argv[1] if len(sys.argv) > 1 else "."
PORT = int(sys.argv[2]) if len(sys.argv) > 2 else 8088
os.chdir(DOCROOT)


class SPAHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split("?")[0]
        fs = self.translate_path(self.path)
        # If the path isn't a real file and looks like a client-side route, serve index.html
        if not os.path.exists(fs) and "." not in os.path.basename(path):
            self.path = "/index.html"
        return super().do_GET()


with socketserver.TCPServer(("127.0.0.1", PORT), SPAHandler) as httpd:
    print(f"Serving {DOCROOT} at http://127.0.0.1:{PORT}")
    httpd.serve_forever()
