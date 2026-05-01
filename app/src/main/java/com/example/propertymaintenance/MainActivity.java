package com.example.propertymaintenance;

import android.annotation.SuppressLint;
import android.content.ContentValues;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Log;
import android.widget.Toast;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.activity.OnBackPressedCallback;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.util.HashMap;
import java.util.Map;

public class MainActivity extends AppCompatActivity {
    private static final int REQUEST_FILECHOOSER = 100;
    private static final int REQUEST_CAMERA = 101;
    private static final int REQUEST_THERMAL_CAMERA = 102;
    private static final int REQUEST_GALLERY = 103;

    private WebView webView;
    private ValueCallback<Uri[]> filePathCallback;
    private Uri pendingCameraUri;
    // 相机/相册请求表：callbackId → 请求上下文
    private Map<String, CameraRequest> pendingRequests = new HashMap<>();
    // Android requestCode → callbackId 映射（用于 onActivityResult 找到对应请求）
    private Map<Integer, String> requestCodeToCallbackId = new HashMap<>();
    // 权限请求期间临时保存的 callbackId（用于 onRequestPermissionsResult）
    private String pendingPermissionCallbackId;
    private AssetServer assetServer;

    // 相机/相册请求上下文，每请求一份独立存储
    private static class CameraRequest {
        String callbackId;
        String extraData; // roomId 或 extraData
        Uri uri;
        CameraRequest(String callbackId, String extraData) {
            this.callbackId = callbackId;
            this.extraData = extraData;
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        webView = findViewById(R.id.webView);
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
        webSettings.setAllowFileAccessFromFileURLs(false);
        webSettings.setAllowUniversalAccessFromFileURLs(false);
        webSettings.setMediaPlaybackRequiresUserGesture(false);

        webView.addJavascriptInterface(new JsInterface(), "androidBridge");

        // 启动本地 HTTP 服务器（提供 asset 文件给 WebView Worker）
        assetServer = new AssetServer(getAssets());
        assetServer.start();

        // WebChromeClient 支持 <input type="file"> 唤起相机/相册 + 捕获 console.log
        webView.setWebChromeClient(new WebChromeClient() {
            // 捕获 JS console.log
            @Override
            public boolean onConsoleMessage(android.webkit.ConsoleMessage consoleMessage) {
                Log.d("JSConsole", consoleMessage.message());
                return super.onConsoleMessage(consoleMessage);
            }

            // Android 5.0+
            @SuppressLint("Override")
            public boolean onShowFileChooser(WebView webView, ValueCallback<Uri[]> uploadMsg,
                    android.content.Intent fileSelectionIntent) {
                Log.d("MainActivity", "onShowFileChooser called");
                filePathCallback = uploadMsg;

                android.content.Intent intent = new android.content.Intent(android.content.Intent.ACTION_GET_CONTENT);
                intent.addCategory(android.content.Intent.CATEGORY_OPENABLE);
                intent.setType("image/*");
                intent.putExtra(android.content.Intent.EXTRA_ALLOW_MULTIPLE, false);

                // 尝试添加相机选项
                android.content.Intent cameraIntent = new android.content.Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                File photoFile = null;
                if (cameraIntent.resolveActivity(getPackageManager()) != null) {
                    photoFile = createImageFile();
                    if (photoFile != null) {
                        cameraIntent.putExtra(MediaStore.EXTRA_OUTPUT, Uri.fromFile(photoFile));
                    }
                }

                android.content.Intent chooser = android.content.Intent.createChooser(intent, "选择照片");
                if (photoFile != null) {
                    android.content.Intent[] intents = new android.content.Intent[]{cameraIntent};
                    chooser.putExtra(android.content.Intent.EXTRA_INITIAL_INTENTS, intents);
                }

                startActivityForResult(chooser, REQUEST_FILECHOOSER);
                return true;
            }

            // Android 4.0 - 4.4 兼容
            @SuppressWarnings("unused")
            public void openFileChooser(ValueCallback<Uri> uploadMsg, String acceptType, String capture) {
                Log.d("MainActivity", "openFileChooser called (legacy)");
                filePathCallback = new ValueCallback<Uri[]>() {
                    @Override
                    public void onReceiveValue(Uri[] value) {
                        uploadMsg.onReceiveValue(value != null && value.length > 0 ? value[0] : null);
                    }
                };

                android.content.Intent intent = new android.content.Intent(android.content.Intent.ACTION_GET_CONTENT);
                intent.addCategory(android.content.Intent.CATEGORY_OPENABLE);
                intent.setType("image/*");
                startActivityForResult(android.content.Intent.createChooser(intent, "选择照片"), REQUEST_FILECHOOSER);
            }

            // Android 3.0
            @SuppressWarnings("unused")
            public void openFileChooser(ValueCallback<Uri> uploadMsg, String acceptType) {
                openFileChooser(uploadMsg, acceptType, null);
            }

            // Android < 3.0
            @SuppressWarnings("unused")
            public void openFileChooser(ValueCallback<Uri> uploadMsg) {
                openFileChooser(uploadMsg, null, null);
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, android.webkit.WebResourceRequest request) {
                return false;
            }
        });

        // 使用 OnBackPressedCallback 替代废弃的 onBackPressed()
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                webView.evaluateJavascript(
                    "if (typeof handleBack === 'function') { handleBack(); } else if (window.history.length > 1) { window.history.back(); } else if (typeof app !== 'undefined') { app.backToCategory(); }",
                    value -> {
                        if ("null".equals(value) || value == null) {
                            if (webView.canGoBack()) {
                                webView.goBack();
                            } else {
                                // 最后才真正退出
                                setEnabled(false);
                                getOnBackPressedDispatcher().onBackPressed();
                            }
                        }
                    }
                );
            }
        });

        webView.loadUrl("file:///android_asset/index.html");
    }

    private File createImageFile() {
        try {
            File cacheDir = getCacheDir();
            File imageFile = File.createTempFile("camera_photo_", ".jpg", cacheDir);
            return imageFile;
        } catch (Exception e) {
            Log.e("MainActivity", "createImageFile error: " + e.getMessage());
            return null;
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, android.content.Intent data) {
        super.onActivityResult(requestCode, resultCode, data);
        Log.d("MainActivity", "onActivityResult requestCode=" + requestCode + " resultCode=" + resultCode);

        if (requestCode == REQUEST_FILECHOOSER) {
            if (filePathCallback == null) {
                return;
            }

            Uri[] results = null;
            if (resultCode == RESULT_OK && data != null) {
                results = new Uri[]{data.getData()};
            } else if (resultCode == RESULT_OK) {
                // 相机拍照结果
                File[] cacheFiles = getCacheDir().listFiles((dir, name) -> name.startsWith("camera_photo_"));
                if (cacheFiles != null && cacheFiles.length > 0) {
                    results = new Uri[]{Uri.fromFile(cacheFiles[cacheFiles.length - 1])};
                }
            }

            filePathCallback.onReceiveValue(results);
            filePathCallback = null;
        } else if (requestCode == REQUEST_CAMERA) {
            Log.d("MainActivity", "Camera result: resultCode=" + resultCode + " pendingUri=" + pendingCameraUri);
            // 相机拍照结果：通过 requestCode 找到 callbackId，再从 pendingRequests 找到完整上下文
            String callbackId = requestCodeToCallbackId.get(requestCode);
            CameraRequest req = callbackId != null ? pendingRequests.get(callbackId) : null;
            if (req != null) {
                if (resultCode == RESULT_OK && pendingCameraUri != null) {
                    try {
                        byte[] originalBytes;
                        try (java.io.InputStream is = getContentResolver().openInputStream(pendingCameraUri)) {
                            originalBytes = new byte[is.available()];
                            is.read(originalBytes);
                        }
                        Log.d("MainActivity", "Camera photo read, original size: " + originalBytes.length);
                        byte[] compressedBytes = compressImage(originalBytes, 2000, 1024 * 1024);
                        String base64 = Base64.encodeToString(compressedBytes, Base64.NO_WRAP);
                        Log.d("MainActivity", "Camera photo compressed, final size: " + compressedBytes.length + ", base64 length: " + base64.length());
                        notifyCameraResult(req.callbackId, req.extraData, base64, null);
                    } catch (Exception e) {
                        Log.e("MainActivity", "Camera photo read error: " + e.getMessage());
                        notifyCameraResult(req.callbackId, req.extraData, null, e.getMessage());
                    }
                } else {
                    notifyCameraResult(req.callbackId, req.extraData, null, "Camera cancelled or failed");
                }
                pendingRequests.remove(callbackId);
                requestCodeToCallbackId.remove(requestCode);
                pendingCameraUri = null;
            }
        } else if (requestCode == REQUEST_THERMAL_CAMERA) {
            String callbackId = requestCodeToCallbackId.get(requestCode);
            CameraRequest req = callbackId != null ? pendingRequests.get(callbackId) : null;
            if (req != null && resultCode == RESULT_OK) {
                Log.d("MainActivity", "Thermal camera result via Intent: resultCode=" + resultCode);
                Uri thermalUri = data != null && data.getData() != null ? data.getData() : req.uri;
                if (thermalUri != null) {
                    try {
                        byte[] bytes;
                        try (java.io.InputStream is = getContentResolver().openInputStream(thermalUri)) {
                            bytes = toByteArray(is);
                        }
                        String base64 = Base64.encodeToString(bytes, Base64.NO_WRAP);
                        Log.d("MainActivity", "Thermal photo via Intent, size: " + bytes.length);
                        notifyCameraResult(req.callbackId, req.extraData, base64, null);
                    } catch (Exception e) {
                        Log.e("MainActivity", "Thermal photo via Intent error: " + e.getMessage());
                        notifyCameraResult(req.callbackId, req.extraData, null, e.getMessage());
                    }
                }
                pendingRequests.remove(callbackId);
                requestCodeToCallbackId.remove(requestCode);
            }
        } else if (requestCode == REQUEST_GALLERY) {
            // 相册选择图片结果
            Log.d("MainActivity", "Gallery result: resultCode=" + resultCode + " data=" + data);
            String callbackId = requestCodeToCallbackId.get(requestCode);
            CameraRequest req = callbackId != null ? pendingRequests.get(callbackId) : null;
            if (req != null) {
                if (resultCode == RESULT_OK && data != null && data.getData() != null) {
                    Uri galleryUri = data.getData();
                    try {
                        byte[] bytes;
                        try (java.io.InputStream is = getContentResolver().openInputStream(galleryUri)) {
                            bytes = toByteArray(is);
                        }
                        String base64 = Base64.encodeToString(bytes, Base64.NO_WRAP);
                        Log.d("MainActivity", "Gallery photo, size: " + bytes.length);
                        notifyCameraResult(req.callbackId, req.extraData, base64, null);
                    } catch (Exception e) {
                        Log.e("MainActivity", "Gallery photo error: " + e.getMessage());
                        notifyCameraResult(req.callbackId, req.extraData, null, e.getMessage());
                    }
                } else {
                    notifyCameraResult(req.callbackId, req.extraData, null, "Cancelled");
                }
                pendingRequests.remove(callbackId);
                requestCodeToCallbackId.remove(requestCode);
            }
        }
    }

    private class JsInterface {
        @JavascriptInterface
        public void goBackToCategory() {
            runOnUiThread(() -> {
                webView.evaluateJavascript(
                    "if (typeof app !== 'undefined') { app.backToCategory(); }",
                    value -> {}
                );
            });
        }

        @JavascriptInterface
        public void goBackToMain() {
            runOnUiThread(() -> {
                webView.evaluateJavascript(
                    "if (typeof app !== 'undefined') { app.backToMain(); }",
                    value -> {}
                );
            });
        }

        @JavascriptInterface
        public void saveFile(String base64Data, String fileName) {
            Log.d("MainActivity", "saveFile called: " + fileName);
            runOnUiThread(() -> {
                try {
                    String cleanBase64 = base64Data;
                    if (cleanBase64.contains(",")) {
                        cleanBase64 = cleanBase64.substring(cleanBase64.indexOf(",") + 1);
                    }
                    byte[] fileBytes = Base64.decode(cleanBase64, Base64.DEFAULT);
                    Log.d("MainActivity", "Base64 decoded, bytes length: " + fileBytes.length);

                    String mimeType = fileName.toLowerCase().endsWith(".pdf") ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                        ContentValues values = new ContentValues();
                        values.put(MediaStore.Downloads.DISPLAY_NAME, fileName);
                        values.put(MediaStore.Downloads.MIME_TYPE, mimeType);
                        values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS);

                        Uri uri = getContentResolver().insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, values);
                        if (uri != null) {
                            try (OutputStream os = getContentResolver().openOutputStream(uri)) {
                                if (os != null) {
                                    os.write(fileBytes);
                                    os.flush();
                                    Log.d("MainActivity", "File written successfully");
                                }
                            }
                        }
                    } else {
                        File dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
                        if (!dir.exists()) {
                            dir.mkdirs();
                        }
                        File file = new File(dir, fileName);
                        try (FileOutputStream fos = new FileOutputStream(file)) {
                            fos.write(fileBytes);
                            fos.flush();
                            Log.d("MainActivity", "File written to: " + file.getAbsolutePath());
                        }
                    }

                    notifyFileSaved(true, "");
                } catch (Exception e) {
                    Log.e("MainActivity", "saveFile error: " + e.getMessage(), e);
                    notifyFileSaved(false, e.getMessage());
                }
            });
        }

        @JavascriptInterface
        public void shareFile(String base64Data, String fileName) {
            Log.d("MainActivity", "shareFile called: " + fileName);
            runOnUiThread(() -> {
                try {
                    String cleanBase64 = base64Data;
                    if (cleanBase64.contains(",")) {
                        cleanBase64 = cleanBase64.substring(cleanBase64.indexOf(",") + 1);
                    }
                    byte[] fileBytes = Base64.decode(cleanBase64, Base64.DEFAULT);
                    Log.d("MainActivity", "shareFile: decoded " + fileBytes.length + " bytes");

                    String mimeType = fileName.toLowerCase().endsWith(".pdf") ? "application/pdf" : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

                    // 保存到 cache 目录（FileProvider 可访问）
                    File cacheDir = getCacheDir();
                    File file = new File(cacheDir, fileName);
                    try (FileOutputStream fos = new FileOutputStream(file)) {
                        fos.write(fileBytes);
                        fos.flush();
                    }

                    // 通过 FileProvider 获取 content URI
                    Uri contentUri = androidx.core.content.FileProvider.getUriForFile(
                            MainActivity.this, getPackageName() + ".fileprovider", file);

                    // 构建分享 Intent
                    android.content.Intent shareIntent = new android.content.Intent(android.content.Intent.ACTION_SEND);
                    shareIntent.setType(mimeType);
                    shareIntent.putExtra(android.content.Intent.EXTRA_STREAM, contentUri);
                    shareIntent.addFlags(android.content.Intent.FLAG_GRANT_READ_URI_PERMISSION);

                    // 使用 chooser 让用户选择目标应用
                    android.content.Intent chooser = android.content.Intent.createChooser(shareIntent, "分享文件");
                    startActivity(chooser);

                    Log.d("MainActivity", "Share intent launched");
                } catch (Exception e) {
                    Log.e("MainActivity", "shareFile error: " + e.getMessage(), e);
                    Toast.makeText(MainActivity.this, "分享失败: " + e.getMessage(), Toast.LENGTH_SHORT).show();
                }
            });
        }

        private void notifyFileSaved(boolean success, String errorMsg) {
            String escapedError = errorMsg != null ? errorMsg.replace("'", "\\'") : "";
            String js = "if(typeof window.onFileSaved==='function'){window.onFileSaved(" + success + ",'" + escapedError + "');}else{console.log('notifyFileSaved: no callback');}";
            Log.d("MainActivity", "notifyFileSaved evaluating: " + js);
            webView.evaluateJavascript(js, value -> Log.d("MainActivity", "notifyFileSaved result: " + value));
        }

        @JavascriptInterface
        public void openCamera(String callbackId) {
            Log.d("MainActivity", "openCamera called, callbackId: " + callbackId);
            runOnUiThread(() -> {
                CameraRequest req = new CameraRequest(callbackId, null);
                pendingRequests.put(callbackId, req);
                if (ContextCompat.checkSelfPermission(MainActivity.this, android.Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                    pendingPermissionCallbackId = callbackId;
                    ActivityCompat.requestPermissions(MainActivity.this, new String[]{android.Manifest.permission.CAMERA}, 200);
                    return;
                }
                launchCamera(callbackId);
            });
        }

        @JavascriptInterface
        public String getAssetServerUrl() {
            return assetServer != null ? assetServer.getUrl() : "";
        }

        @JavascriptInterface
        public void requestFileChoose(String roomId, String callbackId) {
            Log.d("MainActivity", "requestFileChoose called, roomId=" + roomId + ", callbackId=" + callbackId);
            CameraRequest req = new CameraRequest(callbackId, roomId);
            pendingRequests.put(callbackId, req);
            pendingPermissionCallbackId = callbackId;
            runOnUiThread(() -> {
                if (ContextCompat.checkSelfPermission(MainActivity.this, android.Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                    ActivityCompat.requestPermissions(MainActivity.this, new String[]{android.Manifest.permission.CAMERA}, 200);
                    return;
                }
                pendingPermissionCallbackId = null;
                launchCamera(callbackId);
            });
        }

        @JavascriptInterface
        public void requestThermalCamera(String extraData, String callbackId) {
            Log.d("MainActivity", "requestThermalCamera called, extraData=" + extraData + ", callbackId=" + callbackId);
            CameraRequest req = new CameraRequest(callbackId, extraData);
            pendingRequests.put(callbackId, req);
            requestCodeToCallbackId.put(REQUEST_GALLERY, callbackId);
            runOnUiThread(() -> {
                android.content.Intent intent = new android.content.Intent(android.content.Intent.ACTION_GET_CONTENT);
                intent.addCategory(android.content.Intent.CATEGORY_OPENABLE);
                intent.setType("image/*");
                startActivityForResult(intent, REQUEST_GALLERY);
            });
        }

        @JavascriptInterface
        public void openGallery(String callbackId) {
            Log.d("MainActivity", "openGallery called, callbackId: " + callbackId);
            CameraRequest req = new CameraRequest(callbackId, null);
            pendingRequests.put(callbackId, req);
            requestCodeToCallbackId.put(REQUEST_GALLERY, callbackId);
            android.content.Intent intent = new android.content.Intent(android.content.Intent.ACTION_GET_CONTENT);
            intent.addCategory(android.content.Intent.CATEGORY_OPENABLE);
            intent.setType("image/*");
            startActivityForResult(intent, REQUEST_GALLERY);
        }
    }

    private void launchCamera(String callbackId) {
        CameraRequest req = pendingRequests.get(callbackId);
        if (req == null) {
            Log.e("MainActivity", "launchCamera: request not found for callbackId: " + callbackId);
            notifyCameraResult(callbackId, null, null, "Request not found");
            return;
        }
        try {
            File photoFile = createImageFile();
            if (photoFile != null) {
                pendingCameraUri = androidx.core.content.FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", photoFile);
                requestCodeToCallbackId.put(REQUEST_CAMERA, callbackId);
                android.content.Intent cameraIntent = new android.content.Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                cameraIntent.putExtra(MediaStore.EXTRA_OUTPUT, pendingCameraUri);
                startActivityForResult(cameraIntent, REQUEST_CAMERA);
            } else {
                notifyCameraResult(callbackId, req.extraData, null, "Failed to create image file");
                pendingRequests.remove(callbackId);
            }
        } catch (Exception e) {
            Log.e("MainActivity", "openCamera error: " + e.getMessage(), e);
            notifyCameraResult(callbackId, req.extraData, null, e.getMessage());
            pendingRequests.remove(callbackId);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == 200) {
            String callbackId = pendingPermissionCallbackId;
            pendingPermissionCallbackId = null;
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                Log.d("MainActivity", "Camera permission granted, launching camera");
                if (callbackId != null) {
                    launchCamera(callbackId);
                }
            } else {
                Log.d("MainActivity", "Camera permission denied");
                if (callbackId != null) {
                    CameraRequest req = pendingRequests.get(callbackId);
                    String extraData = req != null ? req.extraData : null;
                    notifyCameraResult(callbackId, extraData, null, "Camera permission denied");
                    pendingRequests.remove(callbackId);
                }
            }
        }
    }

    private byte[] toByteArray(java.io.InputStream is) throws java.io.IOException {
        java.io.ByteArrayOutputStream buffer = new java.io.ByteArrayOutputStream();
        byte[] chunk = new byte[8192];
        int len;
        while ((len = is.read(chunk)) != -1) {
            buffer.write(chunk, 0, len);
        }
        return buffer.toByteArray();
    }
    
    // 压缩图片：缩小尺寸 + JPEG压缩
    private byte[] compressImage(byte[] originalBytes, int maxSize, int targetSize) {
        // 第一步：获取原始尺寸
        BitmapFactory.Options options = new BitmapFactory.Options();
        options.inJustDecodeBounds = true;
        BitmapFactory.decodeByteArray(originalBytes, 0, originalBytes.length, options);
        int originalWidth = options.outWidth;
        int originalHeight = options.outHeight;
        
        // 第二步：计算缩放比例
        int sampleSize = 1;
        while (originalWidth / sampleSize > maxSize * 2 || originalHeight / sampleSize > maxSize * 2) {
            sampleSize *= 2;
        }
        
        // 第三步：按缩放比例读取
        options.inJustDecodeBounds = false;
        options.inSampleSize = sampleSize;
        Bitmap bitmap = BitmapFactory.decodeByteArray(originalBytes, 0, originalBytes.length, options);
        
        if (bitmap == null) {
            // 解码失败，返回原图
            return originalBytes;
        }
        
        // 第四步：进一步缩小到maxSize
        int width = bitmap.getWidth();
        int height = bitmap.getHeight();
        float scale = 1.0f;
        if (width > maxSize || height > maxSize) {
            if (width > height) {
                scale = (float) maxSize / width;
            } else {
                scale = (float) maxSize / height;
            }
        }
        
        if (scale < 1.0f) {
            Matrix matrix = new Matrix();
            matrix.postScale(scale, scale);
            Bitmap resized = Bitmap.createBitmap(bitmap, 0, 0, width, height, matrix, false);
            if (resized != bitmap) {
                bitmap.recycle();
                bitmap = resized;
            }
        }
        
        // 第五步：JPEG压缩，逐步降低质量直到达到目标大小
        int quality = 92;
        java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
        bitmap.compress(Bitmap.CompressFormat.JPEG, quality, baos);
        while (baos.toByteArray().length > targetSize && quality > 30) {
            baos.reset();
            quality -= 5;
            bitmap.compress(Bitmap.CompressFormat.JPEG, quality, baos);
        }
        byte[] result = baos.toByteArray();
        bitmap.recycle();
        
        Log.d("MainActivity", "compressImage: original=" + originalBytes.length + " result=" + result.length + " quality=" + quality);
        return result;
    }

    private void notifyCameraResult(String callbackId, String extraData, String base64, String error) {
        // 使用 evaluateJavascript 传 base64 和 extraData
        String escapedError = error != null ? error.replace("'", "\\'") : "";
        String escapedBase64 = base64 != null ? base64.replace("'", "\\'") : "";
        String escapedExtra = extraData != null ? extraData.replace("'", "\\'") : "";
        Log.d("MainActivity", "notifyCameraResult: callbackId=" + callbackId + " extraData=" + extraData + " base64Len=" + (base64 != null ? base64.length() : 0) + " error=" + error);
        String js = "if(typeof window.onCameraResult==='function'){window.onCameraResult('" + callbackId + "','" + escapedExtra + "',String('" + escapedBase64 + "'),'" + escapedError + "');}else{console.log('notifyCameraResult: no callback');}";
        Log.d("MainActivity", "notifyCameraResult evaluating, base64 length: " + (base64 != null ? base64.length() : 0));
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.KITKAT) {
            webView.evaluateJavascript(js, value -> {
                // 空callback确保WebView释放JNI引用，防止弱引用表溢出
                Log.d("MainActivity", "notifyCameraResult done: " + value);
            });
        } else {
            webView.loadUrl("javascript:" + js);
        }
    }
}
