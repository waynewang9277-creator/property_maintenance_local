with open('E:/openclaw_workspace/property_maintenance_local/frontend/modules/elevator-handrail-fault/module.js', 'r', encoding='utf-8') as f:
    content = f.read()

old_init = '''    init() {
        window.FaultModule = this;
        this.renderOfficeMallTab();
        this.renderDateGrid();
        this.bindEvents();
    },'''

new_init = '''    init() {
        window.FaultModule = this;
        this.populateMonthSelector();
        this.renderOfficeMallTab();
        this.renderDateGrid();
        this.bindEvents();
    },

    populateMonthSelector() {
        const sel = document.getElementById('month-selector');
        if (!sel) return;
        const now = new Date();
        for (let m = 1; m <= 12; m++) {
            const d = new Date(now.getFullYear(), m - 1, 1);
            const y = d.getFullYear();
            const label = str(y) + '年' + str(m) + '月';
            const opt = document.createElement('option');
            opt.value = str(y) + '-' + str(m).zfill(2);
            opt.textContent = label;
            sel.appendChild(opt);
        }
    },

    clearAll() {
        this.records = {};
        this.remarks = {};
        this.expandedDates = [];
        this.selectedDate = null;
        this.selectedDevice = null;
        this.renderDateGrid();
        this.updateSummary();
    },

    updateSummary() {
        const countEl = document.getElementById('record-count');
        const devicesEl = document.getElementById('record-devices');
        let count = 0;
        let devices = new Set();
        for (const k in this.records) {
            if (this.records[k]) {
                count++;
                const dev = k.split('_')[1];
                devices.add(dev);
            }
        }
        if (countEl) countEl.textContent = '已记录 ' + count + ' 条故障';
        if (devicesEl) devicesEl.textContent = '涉及 ' + devices.size + ' 台设备';
    },'''

content = content.replace(old_init, new_init)

# Also fix renderDeviceList to call updateSummary
old_toggle = '''    toggleFault(date, deviceId, code) {
        const key = `${date}_${deviceId}`;
        let current = this.records[key] || '';
        // 如果已选则取消
        if (current.includes(code)) {
            current = current.split('/').filter(c => c !== code).join('/');
        } else {
            // 追加
            if (current) current += '/';
            current += code;
        }
        this.records[key] = current;
        this.renderDeviceList(date);
        this.renderDateGrid();
    },'''

new_toggle = '''    toggleFault(date, deviceId, code) {
        const key = date + '_' + deviceId;
        let current = this.records[key] || '';
        if (current.includes(code)) {
            current = current.split('/').filter(c => c !== code).join('/');
        } else {
            if (current) current += '/';
            current += code;
        }
        this.records[key] = current;
        this.renderDeviceList(date);
        this.renderDateGrid();
        this.updateSummary();
    },'''

content = content.replace(old_toggle, new_toggle)

with open('E:/openclaw_workspace/property_maintenance_local/frontend/modules/elevator-handrail-fault/module.js', 'w', encoding='utf-8') as f:
    f.write(content)
print('done')