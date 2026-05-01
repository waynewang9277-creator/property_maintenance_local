// Main App - 主入口/路由
const app = {
    CATEGORY_CONFIG: [
        {
            id: 'strong-power',
            name: '强电维保',
            icon: '⚡',
            items: [
                { id: 'battery-test', name: '应急装置电池放电测试', icon: '🔋' },
                { id: 'generator', name: '发电机组维护性运转记录', icon: '⚙️' },
                { id: 'ats', name: 'ATS维护保养记录', icon: '🔌' },
                { id: 'capacitor-check', name: '电容检查及测温', icon: '🔌' },
                { id: 'busbar-check', name: '供电母排检查及测温', icon: '⚡' },
                { id: 'power-room-monthly', name: '强电间月度巡检', icon: '📋' },
                { id: 'elevator-escape', name: '电梯逃生门检查', icon: '🚪' },
                { id: 'elevator-handrail-fault', name: '电梯扶手梯故障报告', icon: '🛗' }
            ]
        },
        {
            id: 'comprehensive',
            name: '综合维修维保',
            icon: '🔧',
            items: []
        },
        {
            id: 'weak-power',
            name: '弱电维保',
            icon: '📡',
            items: []
        },
        {
            id: 'air-condition',
            name: '空调维保',
            icon: '❄️',
            items: []
        },
        {
            id: 'water-drainage',
            name: '给排水维保',
            icon: '💧',
            items: []
        },
        {
            id: 'developing',
            name: '开发中',
            icon: '🚧',
            items: [
                { id: 'placeholder', name: '功能开发中', icon: '🔨' }
            ]
        }
    ],
    currentView: 'main',
    currentCategory: null,
    init() {
        this.renderMainMenu();
    },
    renderMainMenu() {
        const mainMenu = document.getElementById('main-menu');
        if (!mainMenu) return;
        let html = '';
        this.CATEGORY_CONFIG.forEach((category) => {
            html += `<div class="category-card" onclick="app.goToCategory('${category.id}')"><div class="category-icon">${category.icon}</div><div class="category-name">${category.name}</div></div>`;
        });
        mainMenu.querySelector('.category-grid').innerHTML = html;
        this.showView('main');
    },
    goToCategory(categoryId) {
        const category = this.CATEGORY_CONFIG.find(c => c.id === categoryId);
        if (!category) return;
        this.currentCategory = category;
        this.renderCategoryPage();
        this.showView('category');
    },
    renderCategoryPage() {
        const categoryPage = document.getElementById('category-page');
        if (!categoryPage) return;
        document.getElementById('category-title').textContent = this.currentCategory.name;
        let html = '';
        if (this.currentCategory.items.length === 0) {
            html = '<p style="text-align:center;padding:20px;color:#666;">该分类暂无模块</p>';
        } else {
            this.currentCategory.items.forEach((item) => {
                html += `<div class="item-card" onclick="app.goToItem('${item.id}')"><div class="item-icon">${item.icon}</div><div class="item-name">${item.name}</div></div>`;
            });
        }
        categoryPage.querySelector('.item-list').innerHTML = html;
    },
    goToItem(itemId) {
        const iframe = document.getElementById('module-iframe');
        if (!iframe) return;
        iframe.src = `modules/${itemId}/index.html`;
        iframe.style.display = 'block';
        this.showView('item');
    },
    backToMain() {
        this.currentCategory = null;
        this.renderMainMenu();
    },
    backToCategory() {
        if (!this.currentCategory) { this.backToMain(); return; }
        this.renderCategoryPage();
        this.showView('category');
    },
    showView(view) {
        document.getElementById('main-menu').classList.toggle('hidden', view !== 'main');
        document.getElementById('category-page').classList.toggle('hidden', view !== 'category');
        document.getElementById('module-container').classList.toggle('hidden', view !== 'item');
    }
};
document.addEventListener('DOMContentLoaded', () => { app.init(); });
window.app = app;

// 监听 iframe 发来的消息
window.addEventListener('message', (event) => {
    if (event.data === 'goBackToCategory') {
        app.backToCategory();
        // 清除 iframe src，防止嵌套
        const iframe = document.getElementById('module-iframe');
        if (iframe) { iframe.src = ''; iframe.style.display = 'none'; }
    } else if (event.data === 'goBackToMain') {
        app.backToMain();
        const iframe = document.getElementById('module-iframe');
        if (iframe) { iframe.src = ''; iframe.style.display = 'none'; }
    } else if (event.data && event.data.type === 'requestFileChoose') {
        // 来自 iframe 的文件选择请求（拍照）
        // event.data = { type: 'requestFileChoose', roomId: xxx, callbackId: xxx }
        var roomId = event.data.roomId;
        var callbackId = event.data.callbackId;
        console.log('[App] postMessage requestFileChoose, roomId:', roomId, 'callbackId:', callbackId);

        // 存储回调上下文，用于 onCameraResult 后通过 postMessage 通知 iframe
        window._fileChooseCallbacks = window._fileChooseCallbacks || {};
        window._fileChooseCallbacks[callbackId] = {
            deviceId: roomId,
            extraData: null,
            callback: function(deviceId, extraData, base64) {
                // 通过 postMessage 发送结果回 iframe
                try {
                    var resultMsg = { type: 'fileChooseResult', callbackId: callbackId, roomId: deviceId, base64: base64 || null };
                    window.frames['module-iframe'].postMessage(resultMsg, '*');
                } catch(e) {
                    console.error('[App] postMessage to iframe error:', e);
                }
            }
        };

        // 调用 native 桥
        console.log('[App] calling androidBridge.openCamera:', callbackId);
        try {
            window.androidBridge.openCamera(callbackId);
        } catch(e) {
            console.error('[App] androidBridge.openCamera error:', e);
        }
    } else if (event.data && event.data.type === 'requestThermalCamera') {
        // 来自 iframe 的相册选图请求
        var extraData = event.data.extraData;
        var callbackId = event.data.callbackId;
        console.log('[App] postMessage requestThermalCamera, extraData:', extraData, 'callbackId:', callbackId);

        window._fileChooseCallbacks = window._fileChooseCallbacks || {};
        window._fileChooseCallbacks[callbackId] = {
            deviceId: extraData,
            extraData: null,
            callback: function(deviceId, extraData, base64) {
                try {
                    var resultMsg = { type: 'thermalCameraResult', callbackId: callbackId, extraData: deviceId, base64: base64 || null };
                    window.frames['module-iframe'].postMessage(resultMsg, '*');
                } catch(e) {
                    console.error('[App] postMessage to iframe error:', e);
                }
            }
        };

        console.log('[App] calling androidBridge.openGallery:', callbackId);
        try {
            window.androidBridge.openGallery(callbackId);
        } catch(e) {
            console.error('[App] androidBridge.openGallery error:', e);
        }
    } else if (event.data && event.data.type === 'fileChooseResult') {
        // 此分支已废弃，结果通过 iframe 内部的 message 事件处理
    } else if (event.data && event.data.type === 'shareFile') {
        // 来自 iframe 的分享请求
        console.log('[App] postMessage shareFile, fileName:', event.data.fileName);
        try {
            window.androidBridge.shareFile(event.data.base64Data, event.data.fileName);
        } catch(e) {
            console.error('[App] androidBridge.shareFile error:', e);
        }
    } else if (event.data && event.data.type === 'saveFile') {
        // 来自 iframe 的保存文件请求
        console.log('[App] postMessage saveFile, fileName:', event.data.fileName);
        try {
            window.androidBridge.saveFile(event.data.base64Data, event.data.fileName);
        } catch(e) {
            console.error('[App] androidBridge.saveFile error:', e);
        }
    }
});

// 供 iframe 调用的文件选择函数
window.requestFileChoose = function() {
    console.log('requestFileChoose called, arguments:', arguments);
    // 支持两种调用方式：
    // 1. requestFileChoose(deviceId, callback) - 简单场景
    // 2. requestFileChoose(deviceId, extraData, callback) - 复杂场景（如多个参数）
    var deviceId, extraData, callback;
    if (arguments.length >= 3) {
        deviceId = arguments[0];
        extraData = arguments[1];
        callback = arguments[2];
    } else {
        deviceId = arguments[0];
        callback = arguments[1];
    }

    console.log('deviceId:', deviceId, 'callback:', callback);

    var callbackId = 'cb_' + Date.now();
    window._fileChooseCallbacks = window._fileChooseCallbacks || {};
    window._fileChooseCallbacks[callbackId] = { deviceId: deviceId, extraData: extraData, callback: callback };

    // 使用 androidBridge.openCamera 代替 fileInput.click()
    // 因为设备上没有 ACTION_GET_CONTENT 的 Activity
    console.log('Calling androidBridge.openCamera...');
    window.androidBridge.openCamera(callbackId);
    console.log('androidBridge.openCamera called with callbackId:', callbackId);
};

// 供 iframe 调用的相册选图函数（上传热成像照片）
window.requestThermalCamera = function() {
    console.log('requestThermalCamera called, arguments:', arguments);
    var deviceId, extraData, callback;
    if (arguments.length >= 3) {
        deviceId = arguments[0];
        extraData = arguments[1];
        callback = arguments[2];
    } else {
        deviceId = arguments[0];
        callback = arguments[1];
    }

    var callbackId = 'th_' + Date.now();
    window._fileChooseCallbacks = window._fileChooseCallbacks || {};
    window._fileChooseCallbacks[callbackId] = { deviceId: deviceId, extraData: extraData, callback: callback };

    console.log('Calling androidBridge.openGallery...');
    window.androidBridge.openGallery(callbackId);
    console.log('androidBridge.openGallery called with callbackId:', callbackId);
};

// 处理 openCamera 返回的结果
window.onCameraResult = function(callbackId, base64, error) {
    console.log('[App] onCameraResult called, callbackId:', callbackId, 'base64:', base64 ? base64.length : 'null', 'error:', error);
    var stored = window._fileChooseCallbacks[callbackId];
    if (!stored) {
        console.log('onCameraResult: callback not found for', callbackId);
        return;
    }
    delete window._fileChooseCallbacks[callbackId];

    try {
        if (error) {
            if (stored.extraData !== undefined) {
                stored.callback(stored.deviceId, stored.extraData, null);
            } else {
                stored.callback(stored.deviceId, null);
            }
        } else {
            // 确保 base64 有 data:image 前缀，canvas.toDataURL 需要正确格式才能画出图像
            var cleanBase64 = base64;
            if (!cleanBase64.match(/^data:image\//)) {
                cleanBase64 = 'data:image/jpeg;base64,' + cleanBase64;
            }
            if (stored.extraData !== undefined) {
                stored.callback(stored.deviceId, stored.extraData, cleanBase64);
            } else {
                stored.callback(stored.deviceId, cleanBase64);
            }
        }
    } catch (e) {
        console.log('[App] onCameraResult callback error:', e.message, e.stack);
    }
};

// 供 iframe 通过 postMessage 调用的文件选择函数（替代 window.parent.requestFileChoose 跨 frame 调用）
// 模块通过 postMessage({ type: 'requestFileChoose', roomId: xxx, callback: xxx }) 调用
window.saveFile = function(fileName, base64Data) {
    try {
        window.androidBridge.saveFile(base64Data, fileName);
    } catch(e) {
        console.error('saveFile error:', e);
    }
};

// 分享文件到其他应用（Android 分享面板）
window.shareFile = function(fileName, base64Data) {
    try {
        window.androidBridge.shareFile(base64Data, fileName);
    } catch(e) {
        console.error('shareFile error:', e);
    }
};