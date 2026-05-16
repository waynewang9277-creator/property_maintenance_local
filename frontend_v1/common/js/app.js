// Main App - 主入口/路由
const app = {
    // 模块配置列表
    MODULE_CONFIG: [
        {
            id: 'battery-test',
            name: '应急电池放电测试',
            icon: '🔋',
            description: '应急装置电池放电测试记录'
        }
    ],

    // 当前模块
    currentModule: null,

    // 初始化
    init() {
        this.renderMainMenu();
    },

    // 渲染主菜单
    renderMainMenu() {
        const mainMenu = document.getElementById('main-menu');
        if (!mainMenu) return;

        let html = '';
        this.MODULE_CONFIG.forEach((module, index) => {
            html += `
                <div class="module-card" onclick="app.goToModule('${module.id}')">
                    <div class="module-icon">${module.icon}</div>
                    <div class="module-name">${module.name}</div>
                </div>
            `;
        });
        mainMenu.querySelector('.module-grid').innerHTML = html;
    },

    // 跳转到模块
    goToModule(moduleId) {
        const iframe = document.getElementById('module-iframe');
        if (!iframe) return;

        iframe.src = `modules/${moduleId}/index.html`;
        iframe.style.display = 'block';
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('module-container').classList.remove('hidden');
    },

    // 返回主菜单
    backToMain() {
        const iframe = document.getElementById('module-iframe');
        if (iframe) {
            iframe.src = '';
            iframe.style.display = 'none';
        }
        document.getElementById('module-container').classList.add('hidden');
        document.getElementById('main-menu').classList.remove('hidden');
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// 导出给全局使用
window.app = app;
