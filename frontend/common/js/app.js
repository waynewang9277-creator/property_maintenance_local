// Main App - 主入口/路由
const app = {
    CATEGORY_CONFIG: [
        {
            id: 'strong-power',
            name: '强电维保',
            icon: '⚡',
            items: [
                { id: 'maintenance-plan', name: '维保计划', icon: '📅' },
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
            items: [
                { id: 'maintenance-plan', name: '维保计划', icon: '📅' }
            ]
        },
        {
            id: 'weak-power',
            name: '弱电维保',
            icon: '📡',
            items: [
                { id: 'maintenance-plan', name: '维保计划', icon: '📅' }
            ]
        },
        {
            id: 'air-condition',
            name: '空调维保',
            icon: '❄️',
            items: [
                { id: 'maintenance-plan', name: '维保计划', icon: '📅' }
            ]
        },
        {
            id: 'water-drainage',
            name: '给排水维保',
            icon: '💧',
            items: [
                { id: 'maintenance-plan', name: '维保计划', icon: '📅' }
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