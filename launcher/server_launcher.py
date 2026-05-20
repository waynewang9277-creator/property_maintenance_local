"""
kelong 启动器 - PyInstaller 打包版本
双击运行，自动启动HTTP服务器并打开浏览器
"""
import http.server
import socketserver
import webbrowser
import threading
import os
import sys
import time

PORT = 8080


def get_base_dir():
    """获取程序根目录（兼容PyInstaller打包）"""
    if getattr(sys, 'frozen', False):
        # PyInstaller 打包后的 exe
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.abspath(__file__))


def start_server(base_dir):
    """启动HTTP服务器"""
    os.chdir(base_dir)
    handler = http.server.SimpleHTTPRequestHandler
    handler.extensions_map.update({
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
    })
    with socketserver.TCPServer(("", PORT), handler) as httpd:
        httpd.serve_forever()


def open_browser():
    """延迟打开浏览器"""
    time.sleep(0.5)
    webbrowser.open(f"http://localhost:{PORT}")


if __name__ == "__main__":
    base_dir = get_base_dir()

    # 启动服务器线程
    server_thread = threading.Thread(target=start_server, args=(base_dir,), daemon=True)
    server_thread.start()

    # 打开浏览器
    open_browser()

    print(f"=================================")
    print(f"  物业维保管理系统")
    print(f"=================================")
    print(f"本地服务器已启动: http://localhost:{PORT}")
    print(f"按 Ctrl+C 停止服务器")
    print()

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n服务器已停止")
        sys.exit(0)
