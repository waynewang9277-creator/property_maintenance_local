// Elevator Escape Module - 电梯逃生门检查
const EscapeModule = {
    STORAGE_KEY: 'elevator_escape_data',
    DATA_VERSION: '1.0',

    // 上下文信息
    context: {
        date: null,
        region: null,
        category: 'strong-power'
    },

    // 8个检查项
    CHECK_ITEMS: [
        { id: 'door_lock', name: '层门锁钩', icon: '🔐' },
        { id: 'emergency_unlock', name: '紧急开锁装置', icon: '🔓' },
        { id: 'door_curtain', name: '门光幕', icon: '🚧' },
        { id: 'door_closer', name: '层门闭门器', icon: '🚪' },
        { id: 'escape_sign', name: '逃生标识', icon: '🪧' },
        { id: 'escape_passage', name: '逃生通道', icon: '📍' },
        { id: 'emergency_light', name: '应急照明', icon: '💡' },
        { id: 'emergency_phone', name: '轿厢紧急通话', icon: '📞' }
    ],

    data: {},

    init() {
        this.parseUrlParams();
        this.loadData();
        this.render();
    },

    parseUrlParams() {
        var params = new URLSearchParams(window.location.search);
        var date = params.get('date');
        var region = params.get('region');
        if (date) this.context.date = date;
        if (region) this.context.region = region;
        console.log('EscapeModule context:', this.context);
    },

    loadData() {
        var stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            try {
                var parsed = JSON.parse(stored);
                if (parsed.version === this.DATA_VERSION) {
                    this.data = parsed.data || {};
                }
            } catch(e) {}
        }
    },

    saveData() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
                version: this.DATA_VERSION,
                data: this.data
            }));
        } catch(e) {
            console.error('Save error:', e);
        }
    },

    render() {
        var container = document.getElementById('items-container');
        if (!container) return;

        var html = '<div class="check-items-grid">';
        this.CHECK_ITEMS.forEach(function(item) {
            var itemData = this.data[item.id] || { photos: [], result: '' };
            var resultClass = itemData.result === 'pass' ? 'pass' : (itemData.result === 'fail' ? 'fail' : '');
            html += '<div class="check-item-card ' + resultClass + '" onclick="EscapeModule.toggleItem(\'' + item.id + '\')">';
            html += '<div class="item-icon">' + item.icon + '</div>';
            html += '<div class="item-name">' + item.name + '</div>';
            html += '<div class="item-status">' + (itemData.result === 'pass' ? '✅ 合格' : (itemData.result === 'fail' ? '❌ 不合格' : '⭕ 待检查')) + '</div>';
            html += '<div class="item-photos">' + (itemData.photos ? itemData.photos.length : 0) + ' 张照片</div>';
            html += '</div>';
        }, this);
        html += '</div>';

        // 检查结果选择
        html += '<div class="result-section">';
        html += '<div class="section-title">📋 检查结果</div>';
        html += '<div class="result-buttons">';
        html += '<button class="btn btn-success" onclick="EscapeModule.setResult(\'pass\')">✅ 全部合格</button>';
        html += '<button class="btn btn-danger" onclick="EscapeModule.setResult(\'fail\')">❌ 存在不合格项</button>';
        html += '</div>';
        html += '</div>';

        // 备注
        html += '<div class="remark-section">';
        html += '<div class="section-title">📝 备注</div>';
        html += '<textarea id="remark-input" class="remark-input" placeholder="请输入备注信息...">' + (this.data.remark || '') + '</textarea>';
        html += '</div>';

        // 操作按钮
        html += '<div class="action-buttons">';
        html += '<button class="btn btn-primary" onclick="EscapeModule.generateExcel()">📊 生成Excel报告</button>';
        html += '<button class="btn btn-outline" onclick="EscapeModule.clearAll()">🗑 清空数据</button>';
        html += '</div>';

        container.innerHTML = html;
    },

    toggleItem(itemId) {
        var modal = document.getElementById('item-modal');
        var modalTitle = document.getElementById('modal-title');
        var photoContainer = document.getElementById('modal-photos');

        this.currentItem = itemId;
        var itemInfo = this.CHECK_ITEMS.find(function(i) { return i.id === itemId; });

        modalTitle.textContent = itemInfo.icon + ' ' + itemInfo.name;
        photoContainer.innerHTML = '';

        var itemData = this.data[itemId] || { photos: [], result: '' };

        // 添加已有照片
        if (itemData.photos && itemData.photos.length > 0) {
            itemData.photos.forEach(function(photo, idx) {
                var photoDiv = document.createElement('div');
                photoDiv.className = 'photo-thumb';
                photoDiv.innerHTML = '<img src="' + photo + '" onclick="EscapeModule.previewPhoto(\'' + photo + '\')"><button class="btn-remove" onclick="EscapeModule.removePhoto(' + idx + ')">×</button>';
                photoContainer.appendChild(photoDiv);
            }, this);
        }

        // 添加拍照按钮
        var addBtn = document.createElement('div');
        addBtn.className = 'photo-add-btn';
        addBtn.innerHTML = '+';
        addBtn.onclick = function() { EscapeModule.takePhoto(); };
        photoContainer.appendChild(addBtn);

        // 结果选择
        var resultBtns = document.getElementById('modal-result-buttons');
        resultBtns.innerHTML = '<button class="btn ' + (itemData.result === 'pass' ? 'btn-success' : '') + '" onclick="EscapeModule.setItemResult(\'pass\')">✅ 合格</button>' +
                                '<button class="btn ' + (itemData.result === 'fail' ? 'btn-danger' : '') + '" onclick="EscapeModule.setItemResult(\'fail\')">❌ 不合格</button>';

        modal.style.display = 'block';
    },

    takePhoto() {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        input.onchange = function(e) {
            var file = e.target.files[0];
            if (!file) return;

            var reader = new FileReader();
            reader.onload = function(ev) {
                var base64 = ev.target.result;
                if (!EscapeModule.data[EscapeModule.currentItem]) {
                    EscapeModule.data[EscapeModule.currentItem] = { photos: [], result: '' };
                }
                EscapeModule.data[EscapeModule.currentItem].photos.push(base64);
                EscapeModule.saveData();
                EscapeModule.toggleItem(EscapeModule.currentItem);
            };
            reader.readAsDataURL(file);
        };
        input.click();
    },

    removePhoto(idx) {
        if (this.data[this.currentItem] && this.data[this.currentItem].photos) {
            this.data[this.currentItem].photos.splice(idx, 1);
            this.saveData();
            this.toggleItem(this.currentItem);
        }
    },

    setItemResult(result) {
        if (!this.data[this.currentItem]) {
            this.data[this.currentItem] = { photos: [], result: '' };
        }
        this.data[this.currentItem].result = result;
        this.saveData();
        this.render();
        document.getElementById('item-modal').style.display = 'none';
    },

    setResult(result) {
        this.CHECK_ITEMS.forEach(function(item) {
            if (!this.data[item.id]) {
                this.data[item.id] = { photos: [], result: '' };
            }
            this.data[item.id].result = result;
        }, this);
        this.saveData();
        this.render();
    },

    previewPhoto(base64) {
        var modal = document.getElementById('preview-modal');
        var img = document.getElementById('preview-image');
        img.src = base64;
        modal.style.display = 'block';
    },

    clearAll() {
        if (confirm('确定要清空所有数据吗？')) {
            this.data = {};
            this.saveData();
            this.render();
        }
    },

    formatDate(date) {
        var y = date.getFullYear();
        var m = ('0' + (date.getMonth() + 1)).slice(-2);
        var d = ('0' + date.getDate()).slice(-2);
        return y + '-' + m + '-' + d;
    },

    async generateExcel() {
        var hasData = false;
        this.CHECK_ITEMS.forEach(function(item) {
            if (this.data[item.id] && (this.data[item.id].photos.length > 0 || this.data[item.id].result)) {
                hasData = true;
            }
        }, this);

        if (!hasData) {
            alert('请先进行检查并拍照记录');
            return;
        }

        document.getElementById('loading-overlay').style.display = 'flex';
        document.getElementById('loading-text').textContent = '正在生成Excel报告...';

        try {
            var JSZip = window.JSZip;
            var buffer = await new Promise(function(resolve, reject) {
                var xhr = new XMLHttpRequest();
                xhr.open('GET', '../../templates/escape_check_template.xlsx', true);
                xhr.responseType = 'arraybuffer';
                xhr.onload = function() {
                    if (xhr.status === 200 || xhr.status === 0) resolve(xhr.response);
                    else reject(new Error('Failed to load template: ' + xhr.status));
                };
                xhr.onerror = function() { reject(new Error('Network error')); };
                xhr.send();
            });

            var zip = await JSZip.loadAsync(buffer);
            var ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';

            var sheetXml = await zip.file('xl/worksheets/sheet1.xml').async('string');
            var parser = new DOMParser();
            var xmlDoc = parser.parseFromString(sheetXml, 'text/xml');

            var setCellStr = function(doc, cellRef, value) {
                var cell = doc.querySelector('c[r="' + cellRef + '"]');
                if (!cell) return;
                cell.setAttribute('t', 'inlineStr');
                var is = doc.createElementNS(ns, 'is');
                var t = doc.createElementNS(ns, 't');
                t.textContent = value;
                is.appendChild(t);
                var existing = cell.querySelector('v');
                if (existing) cell.removeChild(existing);
                var existingIs = cell.querySelector('is');
                if (existingIs) cell.removeChild(existingIs);
                cell.appendChild(is);
            };

            var setCellValue = function(doc, cellRef, value) {
                var cell = doc.querySelector('c[r="' + cellRef + '"]');
                if (!cell) return;
                cell.removeAttribute('t');
                var v = cell.querySelector('v');
                if (!v) { v = doc.createElementNS(ns, 'v'); cell.appendChild(v); }
                v.textContent = value;
            };

            // 填入日期
            var checkDate = this.context.date || this.formatDate(new Date());
            setCellStr(xmlDoc, 'B2', checkDate);

            // 填入检查项结果
            var row = 5;
            this.CHECK_ITEMS.forEach(function(item) {
                var itemData = this.data[item.id] || { photos: [], result: '' };
                setCellStr(xmlDoc, 'A' + row, item.name);
                setCellStr(xmlDoc, 'B' + row, itemData.result === 'pass' ? '合格' : (itemData.result === 'fail' ? '不合格' : '未检查'));
                row++;
            }, this);

            // 备注
            setCellStr(xmlDoc, 'A14', this.data.remark || '');

            var serializer = new XMLSerializer();
            zip.file('xl/worksheets/sheet1.xml', serializer.serializeToString(xmlDoc));

            var excelBuffer = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
            var fileName = '电梯逃生门检查_' + checkDate + '.xlsx';

            var reader = new FileReader();
            var selfRef = this;
            reader.onload = async function() {
                var base64 = reader.result;
                window.parent.saveFile(fileName, base64);
                window.androidBridge.shareFile(base64, fileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

                document.getElementById('loading-overlay').style.display = 'none';

                // 上传到服务器
                if (selfRef.context.date) {
                    try {
                        var reportData = {
                            category: selfRef.context.category,
                            content: '电梯逃生门检查 - ' + selfRef.context.date,
                            executor: '',
                            completedDate: new Date().toISOString().slice(0,10),
                            date: selfRef.context.date,
                            region: selfRef.context.region,
                            moduleId: 'item-16',
                            fileBase64: base64
                        };
                        var result = await ApiClient.submitReport(reportData);
                        console.log('Report upload result:', result);
                        if (result.success) {
                            var completeData = {
                                category: selfRef.context.category,
                                date: selfRef.context.date,
                                moduleId: 'item-16',
                                region: selfRef.context.region,
                                completedDate: new Date().toISOString().slice(0,10)
                            };
                            await ApiClient.completeReport(completeData);
                            alert('Excel已保存到手机\n报告已上传到服务器\n计划已标记完成');
                        } else {
                            alert('Excel已保存到手机\n报告上传失败');
                        }
                    } catch(e) {
                        console.error('Upload error:', e);
                        alert('Excel已保存到手机\n上传失败: ' + e.message);
                    }
                } else {
                    alert('Excel已保存到手机');
                }
            };
            reader.readAsDataURL(excelBuffer);

        } catch(error) {
            console.error('生成失败:', error);
            document.getElementById('loading-overlay').style.display = 'none';
            alert('生成失败: ' + error.message);
        }
    }
};

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    EscapeModule.init();

    // 关闭弹窗事件
    var modal = document.getElementById('item-modal');
    var previewModal = document.getElementById('preview-modal');

    document.querySelector('.modal-close')?.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    document.querySelector('.preview-close')?.addEventListener('click', function() {
        previewModal.style.display = 'none';
    });
});

window.EscapeModule = EscapeModule;
