// Data Manager - 本地数据存储管理
const DataManager = {
    STORAGE_KEY: 'modules_battery_test_records',
    OPERATOR_KEY: 'modules_battery_test_operator',

    // 获取所有记录
    getAllRecords() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Failed to get records:', e);
            return [];
        }
    },

    // 保存记录
    saveRecords(records) {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(records));
            return true;
        } catch (e) {
            console.error('Failed to save records:', e);
            return false;
        }
    },

    // 添加新记录
    addRecord(record) {
        const records = this.getAllRecords();
        records.unshift(record);
        return this.saveRecords(records);
    },

    // 更新记录
    updateRecord(index, record) {
        const records = this.getAllRecords();
        if (index >= 0 && index < records.length) {
            records[index] = record;
            return this.saveRecords(records);
        }
        return false;
    },

    // 删除记录
    deleteRecord(index) {
        const records = this.getAllRecords();
        if (index >= 0 && index < records.length) {
            records.splice(index, 1);
            return this.saveRecords(records);
        }
        return false;
    },

    // 清除所有记录
    clearAll() {
        return this.saveRecords([]);
    },

    // 获取操作员姓名
    getOperatorName() {
        return localStorage.getItem(this.OPERATOR_KEY) || '';
    },

    // 设置操作员姓名
    setOperatorName(name) {
        localStorage.setItem(this.OPERATOR_KEY, name);
    }
};

// 导出给全局使用
window.DataManager = DataManager;
