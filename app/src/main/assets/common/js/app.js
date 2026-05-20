// Main App - 主入口/路由
const app = {
    // 一级菜单配置（4大模块）
    TOP_CATEGORIES: [
        { id: 'qingkuang', name: '请款', icon: '💰' },
        { id: 'weibao', name: '维保', icon: '🔧' },
        { id: 'nenghao', name: '能耗', icon: '📊' },
        { id: 'developing', name: '待开发', icon: '🚧' }
    ],

    // 二级菜单配置（各分类下的项目）
    CATEGORY_CONFIG: [
        {
            id: 'strong-power',
            name: '强电维保',
            icon: '⚡',
            topId: 'weibao',  // 属于维保一级分类
            items: [
                { id: 'strong-power-plan', name: '强电维保计划', icon: '📅' },
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
            topId: 'weibao',
            items: []
        },
        {
            id: 'weak-power',
            name: '弱电维保',
            icon: '📡',
            topId: 'weibao',
            items: []
        },
        {
            id: 'air-condition',
            name: '空调维保',
            icon: '❄️',
            topId: 'weibao',
            items: []
        },
        {
            id: 'water-drainage',
            name: '给排水维保',
            icon: '💧',
            topId: 'weibao',
            items: []
        }
    ],
    currentView: 'main',
    currentCategory: null,
    currentTopCategory: 'weibao',  // 默认显示维保
    init() {
        this.renderTopTabBar();
        this.renderMainMenu();
    },
    // 渲染顶部Tab栏
    renderTopTabBar() {
        const nav = document.getElementById('top-tab-bar');
        if (!nav) return;
        let html = '';
        this.TOP_CATEGORIES.forEach((tab) => {
            const active = tab.id === this.currentTopCategory ? ' active' : '';
            html += `<div class="top-tab${active}" onclick="app.switchTopTab('${tab.id}')">${tab.icon}<span>${tab.name}</span></div>`;
        });
        nav.innerHTML = html;
    },
    // 切换一级菜单Tab
    switchTopTab(topId) {
        this.currentTopCategory = topId;
        this.currentCategory = null;
        this.renderTopTabBar();
        // 非维保分类显示占位页面
        if (topId !== 'weibao') {
            this.showPlaceholder(topId);
        } else {
            this.renderMainMenu();
        }
    },
    // 显示占位页面（请款/能耗/待开发）
    showPlaceholder(topId) {
        const top = this.TOP_CATEGORIES.find(t => t.id === topId);
        const mainMenu = document.getElementById('main-menu');
        mainMenu.innerHTML = `
            <div class="placeholder-page">
                <div class="placeholder-icon">${top ? top.icon : '🚧'}</div>
                <div class="placeholder-title">${top ? top.name : ''}模块</div>
                <div class="placeholder-text">敬请期待</div>
                <div class="placeholder-sub">功能正在开发中，稍后上线</div>
            </div>
        `;
        mainMenu.classList.remove('hidden');
        document.getElementById('category-page').classList.add('hidden');
        document.getElementById('module-container').classList.add('hidden');
    },
    renderMainMenu() {
        const mainMenu = document.getElementById('main-menu');
        if (!mainMenu) return;
        // 渲染维保分类卡片
        const weibaoCategories = this.CATEGORY_CONFIG.filter(c => c.topId === 'weibao');
        let html = '<h2>📋 维保模块</h2><div class="category-grid">';
        weibaoCategories.forEach((category) => {
            const hasItems = category.items && category.items.length > 0;
            html += `<div class="category-card${hasItems ? '' : ' disabled'}" ${hasItems ? `onclick="app.goToCategory('${category.id}')"` : ''}><div class="category-icon">${category.icon}</div><div class="category-name">${category.name}</div>${!hasItems ? '<div style="font-size:10pt;color:#999">暂无模块</div>' : ''}</div>`;
        });
        html += '</div>';
        mainMenu.innerHTML = html;
        mainMenu.classList.remove('hidden');
        document.getElementById('category-page').classList.add('hidden');
        document.getElementById('module-container').classList.add('hidden');
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
        // 来自 iframe 的文件选择请求
        const callbackId = event.data.callbackId;
        const deviceId = event.data.deviceId;
        const fileInput = document.getElementById('parent-file-input');

        // 先清除之前的事件
        fileInput.onchange = null;

        fileInput.onchange = function(e) {
            const file = e.target.files[0];
            if (!file) {
                window.frames['module-iframe'].postMessage({ type: 'fileChooseResult', callbackId: callbackId, deviceId: deviceId, file: null }, '*');
                return;
            }

            const reader = new FileReader();
            reader.onload = function(ev) {
                const base64 = ev.target.result;
                window.frames['module-iframe'].postMessage({ type: 'fileChooseResult', callbackId: callbackId, deviceId: deviceId, file: base64 }, '*');
            };
            reader.readAsDataURL(file);

            // 重置 input 以便下次选择
            fileInput.value = '';
        };

        fileInput.click();
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

// 供 iframe 调用的文件选择函数（不压缩，适用于电池等需要原图的场景）
window.requestFileChooseRaw = function() {
    console.log('requestFileChooseRaw called, arguments:', arguments);
    var deviceId, extraData, callback;
    if (arguments.length >= 3) {
        deviceId = arguments[0];
        extraData = arguments[1];
        callback = arguments[2];
    } else {
        deviceId = arguments[0];
        callback = arguments[1];
    }

    var callbackId = 'raw_' + Date.now();
    window._fileChooseCallbacks = window._fileChooseCallbacks || {};
    window._fileChooseCallbacks[callbackId] = { deviceId: deviceId, extraData: extraData, callback: callback };

    console.log('Calling androidBridge.openCameraNoCompress...');
    window.androidBridge.openCameraNoCompress(callbackId);
    console.log('androidBridge.openCameraNoCompress called with callbackId:', callbackId);
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
            // base64 可能带有 data:image/...;base64, 前缀，需要去掉
            var cleanBase64 = base64;
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

// 保存文件到 Downloads 文件夹（Android WebView blob 下载）
window.saveFile = function(fileName, base64Data) {
    window.parent.androidBridge.saveFile(base64Data, fileName);
};