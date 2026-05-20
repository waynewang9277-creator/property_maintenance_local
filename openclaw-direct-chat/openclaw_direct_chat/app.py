#!/usr/bin/env python3
"""
OpenClaw 直接对话窗口 - Flask 服务器
支持 Windows 和 Linux 平台
"""
import subprocess
import os
import json
import platform
from flask import Flask, request, jsonify, Response

app = Flask(__name__)

# 自动检测平台
IS_WINDOWS = platform.system() == "Windows"

# OpenClaw 路径配置
if IS_WINDOWS:
    OPENCLAW_BIN = os.path.expandvars(r"%USERPROFILE%\.openclaw-node\bin\openclaw.cmd")
    NODE_PATH = os.path.expandvars(r"%USERPROFILE%\node-v*-win-x64\bin")
else:
    OPENCLAW_BIN = "/home/wayne/.openclaw-node/bin/openclaw"
    NODE_PATH = "/home/wayne/node-v22.14.0-linux-x64/bin"

AGENT_ID = "main"


def get_path_env():
    """构建 PATH 环境变量"""
    if IS_WINDOWS:
        # Windows 上需要包含 node 路径
        paths = [
            os.path.expandvars(r"%USERPROFILE%\.openclaw-node\bin"),
            os.path.expandvars(r"%USERPROFILE%\AppData\Roaming\npm"),
        ]
        # 查找 node-v* 目录
        import glob
        node_versions = glob.glob(os.path.expandvars(r"%USERPROFILE%\node-v*-win-x64\bin"))
        paths.extend(node_versions)
        paths.extend(os.environ.get("PATH", "").split(";"))
        return ";".join(p for p in paths if p)
    else:
        return "/home/wayne/.openclaw-node/bin:/home/wayne/node-v22.14.0-linux-x64/bin:/usr/bin:/bin"


def call_openclaw(message, session_id=None, timeout=120):
    """调用 openclaw agent 获取回复"""
    cmd = [
        OPENCLAW_BIN if not IS_WINDOWS else "openclaw",
        "agent",
        "--agent", AGENT_ID,
        "--message", message,
        "--json"
    ]
    if session_id:
        cmd.extend(["--session-id", session_id])

    env = os.environ.copy()
    env["PATH"] = get_path_env()

    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout,
            env=env,
            shell=IS_WINDOWS
        )
        return result.stdout, result.stderr, result.returncode
    except subprocess.TimeoutExpired:
        return "", "Timeout", -1
    except FileNotFoundError:
        return "", f"OpenClaw not found at: {OPENCLAW_BIN}", -1
    except Exception as e:
        return "", str(e), -1


@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.json
    message = data.get("message", "").strip()
    session_id = data.get("session_id", "default")

    if not message:
        return jsonify({"error": "消息不能为空"}), 400

    stdout, stderr, code = call_openclaw(message, session_id)

    if code != 0:
        return jsonify({"error": stderr or "调用失败", "session_id": session_id}), 500

    # 解析 JSON 响应，提取纯文本
    try:
        data = json.loads(stdout)
        result = data.get("result", {})
        payloads = result.get("payloads", [])
        if payloads:
            text = payloads[0].get("text", "")
        else:
            text = result.get("finalAssistantVisibleText", "")
    except (json.JSONDecodeError, KeyError):
        text = stdout

    return jsonify({
        "response": text.strip(),
        "session_id": session_id,
        "code": code
    })


@app.route("/api/health", methods=["GET"])
def health():
    try:
        env = os.environ.copy()
        env["PATH"] = get_path_env()
        result = subprocess.run(
            [OPENCLAW_BIN if not IS_WINDOWS else "openclaw", "--version"],
            capture_output=True,
            text=True,
            timeout=5,
            env=env,
            shell=IS_WINDOWS
        )
        return jsonify({"status": "ok", "version": result.stdout.strip()})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/")
def index():
    return app.send_static_file("chat.html")


if __name__ == "__main__":
    import os
    static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
    app.static_folder = static_dir
    app.static_url_path = "/static"

    print("=" * 50)
    print("  OpenClaw 直接对话窗口")
    print(f"  平台: {'Windows' if IS_WINDOWS else 'Linux'}")
    print("  访问地址: http://localhost:5002")
    print("=" * 50)

    app.run(host="0.0.0.0", port=5002, debug=False, threaded=True)
