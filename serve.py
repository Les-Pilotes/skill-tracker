import http.server
import socketserver
import os

os.chdir('/home/claudeuser/skill-tracker/app')

class Handler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, fmt, *args):
        pass

with socketserver.TCPServer(('0.0.0.0', 8888), Handler) as httpd:
    print('Skill Tracker serving on port 8888', flush=True)
    httpd.serve_forever()
