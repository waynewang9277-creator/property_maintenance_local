// Elevator Escape Door Check Module - 电梯逃生门检查模块
// moduleId: item-16

const EscapeModule = {
    // 电梯逃生门检查项
    CHECK_ITEMS: [
        { id: 'door_lock', name: '层门锁钩', desc: '检查层门锁钩是否灵活、可靠' },
        { id: 'emergency_unlock', name: '紧急开锁装置', desc: '检查层门紧急开锁装置是否正常' },
        { id: 'door_sensor', name: '门光幕', desc: '检查门光幕是否灵敏有效' },
        { id: 'door_closer', name: '层门闭门器', desc: '检查层门闭门器是否正常' },
        { id: 'escape_sign', name: '逃生标识', desc: '检查逃生门标识是否清晰完整' },
        { id: 'escape_route', name: '逃生通道', desc: '检查逃生通道是否畅通' },
        { id: 'emergency_lighting', name: '应急照明', desc: '检查应急照明是否正常' },
        { id: 'communication', name: '轿厢紧急通话', desc: '检查轿厢紧急通话装置是否正常' }
    ],
    
    // 存储检查数据
    data: {},
    STORAGE_KEY: 'elevator_escape_check_data',
    expandedItem: null,
    
    // 初始化
    init: function() {
        window.EscapeModule = this;
        this.loadData();
        this.renderList();
        this.setDefaultDate();
    },
    
    // 设置默认日期为今天
    setDefaultDate: function() {
        var today = new Date();
        var dateStr = today.toISOString().split('T')[0];
        var dateInput = document.getElementById('check-date');
        if (dateInput && !dateInput.value) {
            dateInput.value = dateStr;
        }
    },
    
    // 加载本地数据
    loadData: function() {
        try {
            var stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                this.data = JSON.parse(stored);
            }
        } catch (e) {
            console.error('加载数据失败:', e);
            this.data = {};
        }
    },
    
    // 保存数据到本地
    saveData: function() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
        } catch (e) {
            console.error('保存数据失败:', e);
        }
    },
    
    // 渲染检查项列表
    renderList: function() {
        var container = document.getElementById('check-list');
        if (!container) return;
        
        var html = '';
        for (var i = 0; i < this.CHECK_ITEMS.length; i++) {
            var item = this.CHECK_ITEMS[i];
            var itemData = this.data[item.id] || {};
            var isExpanded = this.expandedItem === item.id;
            var hasResult = itemData.result && itemData.result !== '';
            var resultIcon = '';
            if (itemData.result === 'pass') {
                resultIcon = '✓';
            } else if (itemData.result === 'fail') {
                resultIcon = '✗';
            }
            
            html += '<div class="check-item' + (isExpanded ? ' expanded' : '') + '" data-id="' + item.id + '">';
            html += '<div class="check-item-header" onclick="EscapeModule.toggleItem(\'' + item.id + '\')">';
            html += '<span class="check-item-name">' + (i + 1) + '. ' + item.name + '</span>';
            html += '<span class="check-item-status" style="color:' + (hasResult ? (itemData.result === 'pass' ? '#4CAF50' : '#F44336') : '#ccc') + ';">' + resultIcon + '</span>';
            html += '</div>';
            html += '<div class="check-item-detail">';
            html += '<p style="color:#666;font-size:11pt;margin-bottom:12px;">' + item.desc + '</p>';
            
            // 拍照区域
            html += '<div class="photo-area">';
            if (itemData.photo) {
                html += '<div class="photo-preview"><img src="' + itemData.photo + '" onclick="EscapeModule.previewPhoto(\'' + item.id + '\')"></div>';
            }
            html += '<button class="btn-take-photo" onclick="EscapeModule.takePhoto(\'' + item.id + '\')">📷 拍照</button>';
            html += '</div>';
            
            // 检查结果
            html += '<div class="check-result">';
            html += '<div class="result-btn' + (itemData.result === 'pass' ? ' pass selected' : '') + '" onclick="EscapeModule.setResult(\'' + item.id + '\', \'pass\')">✓ 合格</div>';
            html += '<div class="result-btn' + (itemData.result === 'fail' ? ' fail selected' : '') + '" onclick="EscapeModule.setResult(\'' + item.id + '\', \'fail\')">✗ 不合格</div>';
            html += '</div>';
            
            // 备注
            html += '<div class="remark-area">';
            html += '<textarea class="remark-input" placeholder="备注说明..." onchange="EscapeModule.setRemark(\'' + item.id + '\', this.value)">' + (itemData.remark || '') + '</textarea>';
            html += '</div>';
            
            html += '</div></div>';
        }
        
        container.innerHTML = html;
    },
    
    // 展开/收起检查项
    toggleItem: function(itemId) {
        this.expandedItem = (this.expandedItem === itemId) ? null : itemId;
        this.renderList();
    },
    
    // 拍照
    takePhoto: function(itemId) {
        var self = this;
        if (typeof Android !== 'undefined' && Android.takePhoto) {
            Android.takePhoto(itemId);
        } else if (navigator.camera) {
            navigator.camera.getPicture(function(imageData) {
                self.data[itemId] = self.data[itemId] || {};
                self.data[itemId].photo = 'data:image/jpeg;base64,' + imageData;
                self.saveData();
                self.renderList();
            }, function(msg) {
                console.error('拍照失败:', msg);
            }, {
                quality: 80,
                destinationType: Camera.DestinationType.DATA_URL
            });
        } else {
            // 模拟拍照（用于测试）
            var canvas = document.createElement('canvas');
            canvas.width = 320;
            canvas.height = 240;
            var ctx = canvas.getContext('2d');
            ctx.fillStyle = '#f0f0f0';
            ctx.fillRect(0, 0, 320, 240);
            ctx.fillStyle = '#666';
            ctx.font = '14px Microsoft YaHei';
            ctx.textAlign = 'center';
            ctx.fillText('模拟照片', 160, 120);
            ctx.fillText(itemId, 160, 150);
            
            self.data[itemId] = self.data[itemId] || {};
            self.data[itemId].photo = canvas.toDataURL('image/jpeg', 0.8);
            self.saveData();
            self.renderList();
        }
    },
    
    // 预览照片
    previewPhoto: function(itemId) {
        var photo = this.data[itemId] && this.data[itemId].photo;
        if (photo) {
            window.open(photo, '_blank');
        }
    },
    
    // 设置检查结果
    setResult: function(itemId, result) {
        this.data[itemId] = this.data[itemId] || {};
        this.data[itemId].result = result;
        this.saveData();
        this.renderList();
    },
    
    // 设置备注
    setRemark: function(itemId, remark) {
        this.data[itemId] = this.data[itemId] || {};
        this.data[itemId].remark = remark;
        this.saveData();
    },
    
    // 清空所有数据
    clearAll: function() {
        if (confirm('确定要清空所有检查数据吗？')) {
            this.data = {};
            this.expandedItem = null;
            this.saveData();
            this.renderList();
        }
    },
    
    // 导出Excel
    exportExcel: function() {
        var dateInput = document.getElementById('check-date');
        var checkDate = dateInput ? dateInput.value : '';
        
        if (!checkDate) {
            alert('请输入检查日期');
            return;
        }
        
        this.showLoading('正在生成Excel报告...');
        
        var self = this;
        var JSZip = window.JSZip;
        if (!JSZip) {
            this.hideLoading();
            alert('JSZip库未加载');
            return;
        }
        
        // 创建Excel数据
        var wb = {
            SheetNames: ['检查记录'],
            Sheets: {
                '检查记录': {
                    '!ref': 'A1:F' + (this.CHECK_ITEMS.length + 2),
                    'A1': { v: '电梯逃生门检查记录表', t: 's' },
                    'A2': { v: '检查日期', t: 's' },
                    'B2': { v: checkDate, t: 's' }
                }
            }
        };
        
        // 表头
        var headers = ['序号', '检查项目', '检查结果', '备注', '照片'];
        for (var col = 0; col < headers.length; col++) {
            var cellRef = String.fromCharCode(65 + col) + '3';
            wb.Sheets['检查记录'][cellRef] = { v: headers[col], t: 's' };
        }
        
        // 数据行
        for (var i = 0; i < this.CHECK_ITEMS.length; i++) {
            var item = this.CHECK_ITEMS[i];
            var itemData = this.data[item.id] || {};
            var row = i + 4;
            
            wb.Sheets['检查记录']['A' + row] = { v: i + 1, t: 'n' };
            wb.Sheets['检查记录']['B' + row] = { v: item.name, t: 's' };
            wb.Sheets['检查记录']['C' + row] = { v: itemData.result === 'pass' ? '合格' : (itemData.result === 'fail' ? '不合格' : ''), t: 's' };
            wb.Sheets['检查记录']['D' + row] = { v: itemData.remark || '', t: 's' };
            wb.Sheets['检查记录']['E' + row] = { v: itemData.photo ? '有' : '', t: 's' };
        }
        
        // 生成并下载
        var filename = '电梯逃生门检查_' + checkDate + '.xlsx';
        if (typeof XLSX !== 'undefined') {
            var wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
            var blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            
            if (typeof Android !== 'undefined' && Android.saveFile) {
                Android.saveFile(filename, URL.createObjectURL(blob));
            } else {
                var link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = filename;
                link.click();
            }
        }
        
        this.hideLoading();
        alert('Excel报告已生成');
    },
    
    // 上传报告到服务器
    uploadExcel: function() {
        var dateInput = document.getElementById('check-date');
        var checkDate = dateInput ? dateInput.value : '';
        
        if (!checkDate) {
            alert('请输入检查日期');
            return;
        }
        
        this.showLoading('正在上传报告...');
        
        var self = this;
        var JSZip = window.JSZip;
        
        // 收集照片
        var photos = [];
        for (var itemId in this.data) {
            var itemData = this.data[itemId];
            if (itemData && itemData.photo) {
                photos.push({
                    itemId: itemId,
                    photo: itemData.photo
                });
            }
        }
        
        // 创建FormData
        var formData = new FormData();
        formData.append('category', 'elevator-escape');
        formData.append('content', '电梯逃生门检查报告 - ' + checkDate);
        formData.append('module_id', 'item-16');
        formData.append('check_date', checkDate);
        formData.append('executor', localStorage.getItem('operator_name') || '');
        formData.append('inspection_data', JSON.stringify(this.data));
        
        // 添加照片
        photos.forEach(function(p, idx) {
            if (p.photo.startsWith('data:')) {
                var blobPhoto = self.dataURLtoBlob(p.photo);
                formData.append('photos', blobPhoto, 'escape_' + p.itemId + '_' + idx + '.jpg');
            }
        });
        
        // 生成Excel文件
        var wb = {
            SheetNames: ['检查记录'],
            Sheets: {
                '检查记录': {
                    '!ref': 'A1:E' + (this.CHECK_ITEMS.length + 3)
                }
            }
        };
        
        wb.Sheets['检查记录']['A1'] = { v: '电梯逃生门检查记录表', t: 's' };
        wb.Sheets['检查记录']['A2'] = { v: '检查日期', t: 's' };
        wb.Sheets['检查记录']['B2'] = { v: checkDate, t: 's' };
        
        var headers = ['序号', '检查项目', '检查结果', '备注', '照片'];
        for (var col = 0; col < headers.length; col++) {
            var cellRef = String.fromCharCode(65 + col) + '3';
            wb.Sheets['检查记录'][cellRef] = { v: headers[col], t: 's' };
        }
        
        for (var i = 0; i < this.CHECK_ITEMS.length; i++) {
            var item = this.CHECK_ITEMS[i];
            var itemData = this.data[item.id] || {};
            var row = i + 4;
            
            wb.Sheets['检查记录']['A' + row] = { v: i + 1, t: 'n' };
            wb.Sheets['检查记录']['B' + row] = { v: item.name, t: 's' };
            wb.Sheets['检查记录']['C' + row] = { v: itemData.result === 'pass' ? '合格' : (itemData.result === 'fail' ? '不合格' : ''), t: 's' };
            wb.Sheets['检查记录']['D' + row] = { v: itemData.remark || '', t: 's' };
            wb.Sheets['检查记录']['E' + row] = { v: itemData.photo ? '有' : '', t: 's' };
        }
        
        var wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        var excelBlob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        formData.append('excel_file', excelBlob, '电梯逃生门检查_' + checkDate + '.xlsx');
        
        // 上传到服务器
        ApiClient.upload(API.postReports(), formData)
            .then(function(res) {
                self.hideLoading();
                if (res.success) {
                    alert('上传成功！报告ID: ' + (res.report_id || res.id || ''));
                } else {
                    alert('上传失败: ' + (res.message || '未知错误'));
                }
            })
            .catch(function(e) {
                self.hideLoading();
                console.error('Upload error:', e);
                alert('上传失败: ' + e.message);
            });
    },
    
    // 显示加载中
    showLoading: function(msg) {
        var overlay = document.getElementById('loading-overlay');
        var msgEl = document.getElementById('loading-msg');
        if (overlay) overlay.style.display = 'flex';
        if (msgEl) msgEl.textContent = msg || '正在处理...';
    },
    
    // 隐藏加载中
    hideLoading: function() {
        var overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.style.display = 'none';
    },
    
    // base64转Blob
    dataURLtoBlob: function(dataurl) {
        var arr = dataurl.split(',');
        var mime = arr[0].match(/:(.*?);/)[1];
        var bstr = atob(arr[1]);
        var n = bstr.length;
        var u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    }
};

// Android拍照回调
window.onEscapePhotoTaken = function(itemId, photoData) {
    if (window.EscapeModule) {
        EscapeModule.data[itemId] = EscapeModule.data[itemId] || {};
        EscapeModule.data[itemId].photo = 'data:image/jpeg;base64,' + photoData;
        EscapeModule.saveData();
        EscapeModule.renderList();
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    EscapeModule.init();
});