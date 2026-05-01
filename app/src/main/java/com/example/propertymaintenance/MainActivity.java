package com.example.propertymaintenance;

import android.annotation.SuppressLint;
import android.content.ContentValues;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Matrix;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.provider.MediaStore;
import android.util.Base64;
import android.util.Log;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.net.URLDecoder;

public class MainActivity extends AppCompatActivity {
    private WebView webView;
    private ValueCallback<Uri[]> filePathCallback;
    private Handler mainHandler;
    private AssetServer assetServer;
    private String pendingCameraCallbackId;
    private Uri pendingCameraUri;
    private String pendingThermalCallbackId;
    private Uri pendingThermalUri;
    private Object pendingThermalObserver;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        mainHandler = new Handler(Looper.getMainLooper());

        // 启动 AssetServer（提供 Tesseract.js 字库等资源）
        assetServer = new AssetServer(getAssets());
        assetServer.start();

        webView = findViewById(R.id.webView);
        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setAllowFileAccess(true);
        webSettings.setAllowContentAccess(true);
        webSettings.setDomStorageEnabled(true);
        webSettings.setDatabaseEnabled(true);
        webSettings.setCacheMode(WebSettings.LOAD_DEFAULT);
        webSettings.setAllowFileAccessFromFileURLs(true);
        webSettings.setAllowUniversalAccessFromFileURLs(true);
        webSettings.setMediaPlaybackRequiresUserGesture(false);

        webView.addJavascriptInterface(new JsInterface(), "androidBridge");

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

                startActivityForResult(chooser, 100);
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
                startActivityForResult(android.content.Intent.createChooser(intent, "选择照片"), 100);
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

        if (requestCode == 100) {
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
        } else if (requestCode == 101) {
            Log.d("MainActivity", "Camera result: resultCode=" + resultCode + " pendingUri=" + pendingCameraUri);
            // 相机拍照结果 (直接拍照模式)
            if (pendingCameraCallbackId != null) {
                if (resultCode == RESULT_OK && pendingCameraUri != null) {
                    try {
                        // 读取原始图片
                        byte[] originalBytes;
                        try (java.io.InputStream is = getContentResolver().openInputStream(pendingCameraUri)) {
                            originalBytes = new byte[is.available()];
                            is.read(originalBytes);
                        }
                        Log.d("MainActivity", "Camera photo read, original size: " + originalBytes.length);
                        
                        // 压缩图片：缩小尺寸 + JPEG压缩到1MB左右
                        byte[] compressedBytes = compressImage(originalBytes, 2000, 1024 * 1024);
                        String base64 = Base64.encodeToString(compressedBytes, Base64.NO_WRAP);
                        Log.d("MainActivity", "Camera photo compressed, final size: " + compressedBytes.length + ", base64 length: " + base64.length());
                        notifyCameraResult(pendingCameraCallbackId, base64, null);
                    } catch (Exception e) {
                        Log.e("MainActivity", "Camera photo read error: " + e.getMessage());
                        notifyCameraResult(pendingCameraCallbackId, null, e.getMessage());
                    }
                } else {
                    notifyCameraResult(pendingCameraCallbackId, null, "Camera cancelled or failed");
                }
                pendingCameraCallbackId = null;
                pendingCameraUri = null;
            }
        } else if (requestCode == 102) {
            // 热成像相机返回结果（仅处理通过Intent直接返回的情况）
            // 其他情况（RESULT_CANCELED等）由ContentObserver异步监听MediaStore处理
            if (pendingThermalCallbackId != null && resultCode == RESULT_OK) {
                Log.d("MainActivity", "Thermal camera result via Intent: resultCode=" + resultCode);
                Uri thermalUri = null;
                if (data != null && data.getData() != null) {
                    thermalUri = data.getData();
                } else if (pendingThermalUri != null) {
                    thermalUri = pendingThermalUri;
                }
                if (thermalUri != null) {
                    try {
                        byte[] bytes;
                        try (java.io.InputStream is = getContentResolver().openInputStream(thermalUri)) {
                            bytes = toByteArray(is);
                        }
                        String base64 = Base64.encodeToString(bytes, Base64.NO_WRAP);
                        Log.d("MainActivity", "Thermal photo via Intent, size: " + bytes.length);
                        notifyCameraResult(pendingThermalCallbackId, base64, null);
                    } catch (Exception e) {
                        Log.e("MainActivity", "Thermal photo via Intent error: " + e.getMessage());
                        notifyCameraResult(pendingThermalCallbackId, null, e.getMessage());
                    }
                }
                pendingThermalCallbackId = null;
                pendingThermalUri = null;
            }
        } else if (requestCode == 103) {
            // 相册选择图片结果
            Log.d("MainActivity", "Gallery result: resultCode=" + resultCode + " data=" + data);
            if (pendingThermalCallbackId != null) {
                if (resultCode == RESULT_OK && data != null && data.getData() != null) {
                    Uri galleryUri = data.getData();
                    try {
                        byte[] bytes;
                        try (java.io.InputStream is = getContentResolver().openInputStream(galleryUri)) {
                            bytes = toByteArray(is);
                        }
                        String base64 = Base64.encodeToString(bytes, Base64.NO_WRAP);
                        Log.d("MainActivity", "Gallery photo, size: " + bytes.length);
                        notifyCameraResult(pendingThermalCallbackId, base64, null);
                    } catch (Exception e) {
                        Log.e("MainActivity", "Gallery photo error: " + e.getMessage());
                        notifyCameraResult(pendingThermalCallbackId, null, e.getMessage());
                    }
                } else {
                    notifyCameraResult(pendingThermalCallbackId, null, "Cancelled");
                }
                pendingThermalCallbackId = null;
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
        public void shareFile(String base64Data, String fileName, String mimeType) {
            Log.d("MainActivity", "shareFile called: " + fileName + " mime:" + mimeType);
            runOnUiThread(() -> {
                try {
                    String cleanBase64 = base64Data;
                    if (cleanBase64.contains(",")) {
                        cleanBase64 = cleanBase64.substring(cleanBase64.indexOf(",") + 1);
                    }
                    byte[] fileBytes = Base64.decode(cleanBase64, Base64.DEFAULT);
                    Log.d("MainActivity", "shareFile decoded " + fileBytes.length + " bytes");

                    // 保存到 cache 目录
                    File cacheDir = getCacheDir();
                    File shareFile = new File(cacheDir, fileName);
                    try (FileOutputStream fos = new FileOutputStream(shareFile)) {
                        fos.write(fileBytes);
                        fos.flush();
                    }

                    // 通过 FileProvider 获取 content URI
                    android.content.Context ctx = MainActivity.this;
                    Uri contentUri = androidx.core.content.FileProvider.getUriForFile(
                            ctx,
                            ctx.getPackageName() + ".fileprovider",
                            shareFile);

                    // 构建 ACTION_SEND intent
                    Intent shareIntent = new Intent(Intent.ACTION_SEND);
                    shareIntent.setType(mimeType.isEmpty() ? "*/*" : mimeType);
                    shareIntent.putExtra(Intent.EXTRA_STREAM, contentUri);
                    shareIntent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);

                    // 启动分享选择器
                    Intent chooser = Intent.createChooser(shareIntent, "分享报告");
                    startActivity(chooser);

                    Log.d("MainActivity", "shareFile: share intent launched for " + fileName);
                } catch (Exception e) {
                    Log.e("MainActivity", "shareFile error: " + e.getMessage(), e);
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
                // 检查相机权限
                if (ContextCompat.checkSelfPermission(MainActivity.this, android.Manifest.permission.CAMERA) != PackageManager.PERMISSION_GRANTED) {
                    pendingCameraCallbackId = callbackId;
                    // 请求相机权限
                    ActivityCompat.requestPermissions(MainActivity.this, new String[]{android.Manifest.permission.CAMERA}, 200);
                    return;
                }
                launchCamera(callbackId);
            });
        }

        @JavascriptInterface
        public void openGallery(String callbackId) {
            Log.d("MainActivity", "openGallery called, callbackId: " + callbackId);
            runOnUiThread(() -> {
                pendingThermalCallbackId = callbackId;

                android.content.Intent intent = new android.content.Intent(android.content.Intent.ACTION_GET_CONTENT);
                intent.addCategory(android.content.Intent.CATEGORY_OPENABLE);
                intent.setType("image/*");
                startActivityForResult(intent, 103);
            });
        }

        @JavascriptInterface
        public String getAssetServerUrl() {
            return assetServer != null ? assetServer.getUrl() : "";
        }
    }

    private void launchCamera(String callbackId) {
        try {
            File photoFile = createImageFile();
            if (photoFile != null) {
                pendingCameraCallbackId = callbackId;
                pendingCameraUri = androidx.core.content.FileProvider.getUriForFile(this, getPackageName() + ".fileprovider", photoFile);
                android.content.Intent cameraIntent = new android.content.Intent(MediaStore.ACTION_IMAGE_CAPTURE);
                cameraIntent.putExtra(MediaStore.EXTRA_OUTPUT, pendingCameraUri);
                startActivityForResult(cameraIntent, 101);
            } else {
                notifyCameraResult(callbackId, null, "Failed to create image file");
            }
        } catch (Exception e) {
            Log.e("MainActivity", "openCamera error: " + e.getMessage(), e);
            notifyCameraResult(callbackId, null, e.getMessage());
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == 200) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                Log.d("MainActivity", "Camera permission granted, launching camera");
                // 权限授予后，启动相机
                if (pendingCameraCallbackId != null) {
                    launchCamera(pendingCameraCallbackId);
                }
            } else {
                Log.d("MainActivity", "Camera permission denied");
                if (pendingCameraCallbackId != null) {
                    notifyCameraResult(pendingCameraCallbackId, null, "Camera permission denied");
                    pendingCameraCallbackId = null;
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

    private void notifyCameraResult(String callbackId, String base64, String error) {
        // 使用 evaluateJavascript 传 base64
        String escapedError = error != null ? error.replace("'", "\\'") : "";
        String escapedBase64 = base64 != null ? base64.replace("'", "\\'") : "";
        Log.d("MainActivity", "notifyCameraResult: callbackId=" + callbackId + " base64Len=" + (base64 != null ? base64.length() : 0) + " error=" + error);
        String js = "if(typeof window.onCameraResult==='function'){window.onCameraResult('" + callbackId + "',String('" + escapedBase64 + "'),'" + escapedError + "');}else{console.log('notifyCameraResult: no callback');}";
        Log.d("MainActivity", "notifyCameraResult evaluating, base64 length: " + (base64 != null ? base64.length() : 0));
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.KITKAT) {
            webView.evaluateJavascript(js, value -> {
                // 空callback确保WebView释放JNI引用，防止弱引用表溢出
                Log.d("MainActivity", "notifyCameraResult done: " + value);
            });
        } else {
            webView.loadUrl("javascript:" + js);
        }
        // 触发GC释放native引用
        System.gc();
    }

    @Override
    public void onBackPressed() {
        webView.evaluateJavascript(
            "if (typeof handleBack === 'function') { handleBack(); } else if (window.history.length > 1) { window.history.back(); } else if (typeof app !== 'undefined') { app.backToCategory(); }",
            value -> {
                if ("null".equals(value) || value == null) {
                    if (webView.canGoBack()) {
                        webView.goBack();
                    } else {
                        MainActivity.super.onBackPressed();
                    }
                }
            }
        );
    }
}
