package com.example.propertymaintenance;

import android.content.res.AssetManager;
import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URLDecoder;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * 简单的本地 HTTP 服务器，用于从 APK assets 目录提供文件。
 * 解决 Android WebView Worker 无法使用 file:// 协议的问题。
 * 
 * 监听地址: http://localhost:8765/
 * 访问 asset 文件: http://localhost:8765/tesseract/worker.min.js
 */
public class AssetServer extends Thread {
    private static final int PORT = 8765;
    private static final int MAX_THREADS = 4;
    private static final long MAX_UNCOMPRESSED_SIZE = 10 * 1024 * 1024; // 10MB
    private final AssetManager assetManager;
    private final AtomicBoolean running = new AtomicBoolean(false);
    private final ExecutorService executor = Executors.newFixedThreadPool(MAX_THREADS);
    private ServerSocket serverSocket;

    public AssetServer(AssetManager assetManager) {
        this.assetManager = assetManager;
        setDaemon(true);
        setName("AssetServer");
    }

    public String getUrl() {
        return "http://localhost:" + PORT;
    }

    public boolean isRunning() {
        return running.get();
    }

    @Override
    public void run() {
        try {
            serverSocket = new ServerSocket(PORT, 50, java.net.InetAddress.getLoopbackAddress());
            running.set(true);
            android.util.Log.d("AssetServer", "Started on loopback:" + PORT);

            while (running.get()) {
                try {
                    final Socket socket = serverSocket.accept();
                    // 使用线程池限制并发数
                    executor.submit(() -> handleRequest(socket));
                } catch (Exception e) {
                    if (running.get()) {
                        android.util.Log.e("AssetServer", "Accept error: " + e.getMessage());
                    }
                }
            }
        } catch (Exception e) {
            android.util.Log.e("AssetServer", "Server error: " + e.getMessage());
        } finally {
            running.set(false);
        }
    }

    private void handleRequest(Socket socket) {
        try {
            socket.setSoTimeout(5000);
            BufferedReader in = new BufferedReader(new InputStreamReader(socket.getInputStream()));
            OutputStream out = socket.getOutputStream();

            String requestLine = in.readLine();
            if (requestLine == null) {
                socket.close();
                return;
            }

            // 解析 GET 请求
            String method = "";
            String path = "";
            String[] parts = requestLine.split(" ");
            if (parts.length >= 2) {
                method = parts[0];
                path = parts[1];
            }

            // 跳过请求头
            while (in.ready()) {
                in.readLine();
            }

            if (!"GET".equalsIgnoreCase(method)) {
                socket.close();
                return;
            }

            // 去掉开头的 /
            String assetPath = path.startsWith("/") ? path.substring(1) : path;
            assetPath = URLDecoder.decode(assetPath, "UTF-8");

            android.util.Log.d("AssetServer", "GET " + assetPath);

            // Android build 会自动解压 .gz 文件，
            // 当请求 .gz 但文件不存在时，尝试同目录的未压缩版本
            byte[] data = readAsset(assetPath);
            if (data == null && assetPath.endsWith(".gz")) {
                String altPath = assetPath.substring(0, assetPath.length() - 3); // 去掉 .gz
                android.util.Log.d("AssetServer", "Trying alternate: " + altPath);
                data = readAsset(altPath);
                if (data != null) {
                    assetPath = altPath; // 使用映射后的路径来确定 Content-Type
                }
            }

            if (data != null) {
                String contentType = getContentType(assetPath);
                String response = "HTTP/1.1 200 OK\r\n" +
                        "Content-Type: " + contentType + "\r\n" +
                        "Content-Length: " + data.length + "\r\n" +
                        "Access-Control-Allow-Origin: *\r\n" +
                        "Connection: close\r\n" +
                        "\r\n";
                out.write(response.getBytes("UTF-8"));
                out.write(data);
                out.flush();
            } else {
                String response = "HTTP/1.1 404 Not Found\r\n" +
                        "Content-Type: text/plain\r\n" +
                        "Content-Length: 0\r\n" +
                        "Connection: close\r\n" +
                        "\r\n";
                out.write(response.getBytes("UTF-8"));
                out.flush();
            }

            socket.close();
        } catch (Exception e) {
            android.util.Log.e("AssetServer", "Handle error: " + e.getMessage());
            try { socket.close(); } catch (Exception ignored) {}
        }
    }

    private byte[] readAsset(String assetPath) {
        InputStream is = null;
        try {
            // 检查是否请求 .gz 文件，如果是则透明解压
            if (assetPath.endsWith(".gz")) {
                is = assetManager.open(assetPath);
                java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
                java.util.zip.GZIPInputStream gzis = new java.util.zip.GZIPInputStream(is);
                byte[] buffer = new byte[8192];
                int len;
                long totalRead = 0;
                while ((len = gzis.read(buffer)) != -1) {
                    totalRead += len;
                    if (totalRead > MAX_UNCOMPRESSED_SIZE) {
                        throw new java.io.IOException("Decompressed data exceeds " + MAX_UNCOMPRESSED_SIZE + " bytes");
                    }
                    baos.write(buffer, 0, len);
                }
                gzis.close();
                return baos.toByteArray();
            }

            // 普通文件直接读取
            is = assetManager.open(assetPath);
            byte[] buffer = new byte[8192];
            int len;
            java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
            while ((len = is.read(buffer)) != -1) {
                baos.write(buffer, 0, len);
            }
            return baos.toByteArray();
        } catch (Exception e) {
            android.util.Log.d("AssetServer", "Asset not found: " + assetPath + " - " + e.getMessage());
            return null;
        } finally {
            if (is != null) try { is.close(); } catch (Exception ignored) {}
        }
    }

    private String getContentType(String path) {
        String lower = path.toLowerCase();
        // .gz 文件内部已经是压缩数据，不设 Content-Encoding，由 Java 透明解压后直接返回原始类型
        if (lower.endsWith(".wasm")) return "application/wasm";
        if (lower.endsWith(".js")) return "application/javascript";
        if (lower.endsWith(".traineddata")) return "application/octet-stream";
        if (lower.endsWith(".html")) return "text/html";
        if (lower.endsWith(".css")) return "text/css";
        if (lower.endsWith(".json")) return "application/json";
        return "application/octet-stream";
    }

    public void stopServer() {
        running.set(false);
        executor.shutdown();
        if (serverSocket != null) {
            try { serverSocket.close(); } catch (Exception ignored) {}
        }
    }
}
