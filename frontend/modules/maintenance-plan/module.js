// 维保计划模块
const plan = {
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth(),
    selectedDate: null,
    selectedPlans: [],

    // 维保项目配置（从各模块获取）
    MODULE_OPTIONS: [
        { id: 'battery-test', name: '应急电池放电测试', icon: '🔋' },
        { id: 'generator', name: '发电机组维护性运转记录', icon: '⚙️' },
        { id: 'ats', name: 'ATS维护保养记录', icon: '🔌' },
        { id: 'capacitor-check', name: '电容检查及测温', icon: '🔌' },
        { id: 'busbar-check', name: '供电母排检查及测温', icon: '⚡' },
        { id: 'power-room-monthly', name: '强电间月度巡检', icon: '📋' },
        { id: 'elevator-escape', name: '电梯逃生门检查', icon: '🚪' },
        { id: 'elevator-handrail-fault', name: '电梯扶手梯故障报告', icon: '🛗' }
    ],

    STORAGE_KEY: 'maintenance_plan',

    init() {
        this.selectedDate = this.formatDate(new Date());
        this.renderCalendar();
        this.renderPlanList();
    },

    // 格式化日期为 YYYY-MM-DD
    formatDate(date) {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    },

    // 获取某月的第一天是星期几
    getFirstDayOfMonth(year, month) {
        return new Date(year, month, 1).getDay();
    },

    // 获取某月的天数
    getDaysInMonth(year, month) {
        return new Date(year, month + 1, 0).getDate();
    },

    // 获取某天的计划
    getPlans(dateStr) {
        const data = DataManager.get(this.STORAGE_KEY) || {};
        return data[dateStr] || [];
    },

    // 保存计划
    savePlans(dateStr, plans) {
        const data = DataManager.get(this.STORAGE_KEY) || {};
        if (plans.length === 0) {
            delete data[dateStr];
        } else {
            data[dateStr] = plans;
        }
        DataManager.set(this.STORAGE_KEY, data);
    },

    // 切换月份
    changeMonth(delta) {
        this.currentMonth += delta;
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        } else if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        this.renderCalendar();
    },

    // 渲染日历
    renderCalendar() {
        const grid = document.getElementById('calendar-grid');
        const title = document.getElementById('calendar-title');
        
        if (!grid || !title) {
            console.error('日历元素未找到');
            return;
        }
        
        // 显示标题
        title.textContent = `${this.currentYear}年${this.currentMonth + 1}月`;

        // 清空网格
        grid.innerHTML = '';

        // 添加星期标题
        const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
        let html = '';
        weekdays.forEach(day => {
            html += `<div class="calendar-weekday">${day}</div>`;
        });

        // 获取当月数据
        const data = DataManager.get(this.STORAGE_KEY) || {};
        const today = this.formatDate(new Date());

        // 计算第一天前的空格子数
        const firstDay = this.getFirstDayOfMonth(this.currentYear, this.currentMonth);
        for (let i = 0; i < firstDay; i++) {
            html += '<div class="calendar-day" style="background:transparent;"></div>';
        }

        // 填充日期
        const daysInMonth = this.getDaysInMonth(this.currentYear, this.currentMonth);
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${this.currentYear}-${String(this.currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const isToday = dateStr === today;
            const hasPlan = data[dateStr] && data[dateStr].length > 0;
            const isSelected = dateStr === this.selectedDate;

            let classes = 'calendar-day';
            if (isToday) classes += ' today';
            if (hasPlan) classes += ' has-plan';
            if (isSelected) classes += ' selected';

            html += `<div class="${classes}" onclick="plan.selectDate('${dateStr}')">${day}</div>`;
        }

        grid.innerHTML = html;
        console.log('日历渲染完成，天数：', daysInMonth);
    },

    // 选择日期
    selectDate(dateStr) {
        this.selectedDate = dateStr;
        this.renderCalendar();
        this.renderPlanList();
    },

    // 渲染计划列表
    renderPlanList() {
        const container = document.getElementById('plan-items');
        const title = document.getElementById('plan-list-title');
        
        // 解析日期显示
        const date = new Date(this.selectedDate);
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const weekday = ['日', '一', '二', '三', '四', '五', '六'][date.getDay()];
        
        title.textContent = `${month}月${day}日 周${weekday} 计划`;

        const plans = this.getPlans(this.selectedDate);

        if (plans.length === 0) {
            container.innerHTML = '<div class="no-plan">暂无计划<br><br><button class="btn btn-primary" onclick="plan.openModal()">➕ 添加维保项目</button></div>';
            return;
        }

        let html = '';
        plans.forEach((p, index) => {
            const module = this.MODULE_OPTIONS.find(m => m.id === p.moduleId) || { icon: '📋', name: p.moduleId };
            html += `
                <div class="plan-item ${p.checked ? 'checked' : ''}">
                    <div class="plan-item-left" onclick="plan.togglePlan(${index})">
                        <span class="plan-icon">${p.checked ? '✅' : '⬜'}</span>
                        <span class="plan-name">${module.icon} ${module.name}</span>
                    </div>
                    <button class="btn-delete-plan" onclick="plan.deletePlan(${index})">×</button>
                </div>
            `;
        });

        container.innerHTML = html + '<button class="btn btn-primary" style="width:100%;margin-top:10px;" onclick="plan.openModal()">➕ 添加更多项目</button>';
    },

    // 打开弹窗
    openModal() {
        document.getElementById('modal-date').textContent = this.selectedDate;
        
        const container = document.getElementById('module-options');
        const currentPlans = this.getPlans(this.selectedDate);
        const existingIds = currentPlans.map(p => p.moduleId);

        let html = '';
        this.MODULE_OPTIONS.forEach(m => {
            const isSelected = existingIds.includes(m.id);
            html += `
                <div class="module-option ${isSelected ? 'selected' : ''}" onclick="plan.toggleOption('${m.id}', this)" data-id="${m.id}">
                    <span class="module-option-icon">${m.icon}</span>
                    <span class="module-option-name">${m.name}</span>
                    ${isSelected ? '<span style="color:#1890ff;margin-left:auto;">已添加 ✓</span>' : ''}
                </div>
            `;
        });
        container.innerHTML = html;

        document.getElementById('modal-add-plan').classList.add('show');
    },

    // 切换选项
    toggleOption(moduleId, el) {
        const existing = this.selectedPlans.find(p => p.moduleId === moduleId);
        if (existing) {
            this.selectedPlans = this.selectedPlans.filter(p => p.moduleId !== moduleId);
            el.classList.remove('selected');
            el.querySelector('span:last-child')?.remove();
            el.innerHTML += '<span style="color:#1890ff;margin-left:auto;">已添加 ✓</span>';
        } else {
            this.selectedPlans.push({ moduleId, checked: false });
            el.classList.add('selected');
            el.querySelector('span:last-child')?.remove();
            el.innerHTML += '<span style="color:#1890ff;margin-left:auto;">✓</span>';
        }
    },

    // 关闭弹窗
    closeModal() {
        document.getElementById('modal-add-plan').classList.remove('show');
        this.selectedPlans = [];
    },

    // 添加计划
    addPlan() {
        if (this.selectedPlans.length === 0) {
            alert('请选择要添加的维保项目');
            return;
        }

        const currentPlans = this.getPlans(this.selectedDate);
        const existingIds = currentPlans.map(p => p.moduleId);
        
        // 添加不重复的项目
        this.selectedPlans.forEach(newPlan => {
            if (!existingIds.includes(newPlan.moduleId)) {
                currentPlans.push(newPlan);
            }
        });

        this.savePlans(this.selectedDate, currentPlans);
        this.closeModal();
        this.renderCalendar();
        this.renderPlanList();
    },

    // 删除计划项
    deletePlan(index) {
        const plans = this.getPlans(this.selectedDate);
        plans.splice(index, 1);
        this.savePlans(this.selectedDate, plans);
        this.renderCalendar();
        this.renderPlanList();
    },

    // 勾选/取消计划
    togglePlan(index) {
        const plans = this.getPlans(this.selectedDate);
        plans[index].checked = !plans[index].checked;
        this.savePlans(this.selectedDate, plans);
        this.renderPlanList();
    }
};

// 初始化
document.addEventListener('DOMContentLoaded', () => { plan.init(); });