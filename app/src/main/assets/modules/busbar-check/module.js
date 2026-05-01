// BusbarModule - 供电母排检查测温模块
// 参照 battery-test 模块架构重写
// 照片仅存内存，不写 localStorage

const BusbarModule = {
    // 分组定义及设备列表
    GROUPS: [
        { name: '商四站', devices: [
            { id: 'Tx-RS5-1', location: 'B1商四站' },
            { id: 'Tx-RS6-1', location: 'B1商四站' }
        ]},
        { name: '商五站', devices: [
            { id: 'Tx-RS1-1', location: 'B1商五站' },
            { id: 'Tx-RS2-1', location: 'B1商五站' },
            { id: 'Tx-RS3-1', location: 'B1商五站' },
            { id: 'Tx-RS4-1', location: 'B1商五站' }
        ]},
        { name: '商六站', devices: [
            { id: 'Tx-RS7-1', location: 'B1商六站' },
            { id: 'Tx-RS8-1', location: 'B1商六站' }
        ]},
        { name: 'T18站', devices: [
            { id: 'Tx-01-1', location: 'B1 T18站' },
            { id: 'Tx-02-1', location: 'B1 T18站' },
            { id: 'Tx-03-1', location: 'B1 T18站' },
            { id: 'Tx-04-1', location: 'B1 T18站' }
        ]},
        { name: '办公楼低区', devices: [
            { id: '15-租户1-3', location: '15层' },
            { id: '15-租户4-6', location: '15层' },
            { id: '12-租户1-3', location: '12层' },
            { id: '12-租户4-6', location: '12层' },
            { id: '11-租户1-3', location: '11层' },
            { id: '11-租户4-6', location: '11层' },
            { id: '10-租户1-3', location: '10层' },
            { id: '10-租户4-6', location: '10层' },
            { id: '9-租户1-3', location: '9层' },
            { id: '9-租户4-6', location: '9层' },
            { id: '8-租户1-3', location: '8层' },
            { id: '8-租户4-6', location: '8层' },
            { id: '7-租户1-3', location: '7层' },
            { id: '7-租户4-6', location: '7层' },
            { id: '6-租户1-3', location: '6层' },
            { id: '6-租户4-6', location: '6层' },
            { id: '5-租户1-3', location: '5层' },
            { id: '5-租户4-6', location: '5层' }
        ]},
        { name: '办公楼高区', devices: [
            { id: '16-租户4-6', location: '16层' },
            { id: '17-租户4-6', location: '17层' },
            { id: '18-租户4-6', location: '18层' },
            { id: '19-租户4-6', location: '19层' },
            { id: '20-租户4-6', location: '20层' },
            { id: '21-租户4-6', location: '21层' },
            { id: '22-租户4-6', location: '22层' },
            { id: '23-租户4-6', location: '23层' },
            { id: '25-租户4-6', location: '25层' },
            { id: '26-租户4-6', location: '26层' },
            { id: '27-租户4-6', location: '27层' },
            { id: '28-租户4-6', location: '28层' },
            { id: '29-租户4-6', location: '29层' },
            { id: '30-租户4-6', location: '30层' }
        ]}
    ],

    // Excel 模板行列映射（设备ID → Excel位置）
    // 格式: { deviceId: { row, col } }
    DEVICE_EXCEL_POS: (function() {
        const map = {};
        const defs = [
            // 商四站 (Row 6)
            { id: 'Tx-RS5-1', row: 6, col: 2 },
            { id: 'Tx-RS6-1', row: 6, col: 6 },
            // T18站 (Rows 6-7)
            { id: 'Tx-01-1', row: 6, col: 10 },
            { id: 'Tx-02-1', row: 6, col: 14 },
            { id: 'Tx-03-1', row: 7, col: 2 },
            { id: 'Tx-04-1', row: 7, col: 6 },
            // 商六站 (Row 7)
            { id: 'Tx-RS7-1', row: 7, col: 10 },
            { id: 'Tx-RS8-1', row: 7, col: 14 },
            // 商五站 (Row 8)
            { id: 'Tx-RS1-1', row: 8, col: 2 },
            { id: 'Tx-RS2-1', row: 8, col: 6 },
            { id: 'Tx-RS3-1', row: 8, col: 10 },
            { id: 'Tx-RS4-1', row: 8, col: 14 },
            // 办公楼低区 (Rows 9-13) - 5~15层，每层租户1-3和租户4-6
            { id: '15-租户1-3', row: 9, col: 2 },
            { id: '15-租户4-6', row: 9, col: 6 },
            { id: '12-租户1-3', row: 9, col: 10 },
            { id: '12-租户4-6', row: 9, col: 14 },
            { id: '11-租户1-3', row: 10, col: 2 },
            { id: '11-租户4-6', row: 10, col: 6 },
            { id: '10-租户1-3', row: 10, col: 10 },
            { id: '10-租户4-6', row: 10, col: 14 },
            { id: '9-租户1-3', row: 11, col: 2 },
            { id: '9-租户4-6', row: 11, col: 6 },
            { id: '8-租户1-3', row: 11, col: 10 },
            { id: '8-租户4-6', row: 11, col: 14 },
            { id: '7-租户1-3', row: 12, col: 2 },
            { id: '7-租户4-6', row: 12, col: 6 },
            { id: '6-租户1-3', row: 12, col: 10 },
            { id: '6-租户4-6', row: 12, col: 14 },
            { id: '5-租户1-3', row: 13, col: 2 },
            { id: '5-租户4-6', row: 13, col: 6 },
            // 办公楼高区 (Rows 14-27) - 16~30层，每层只有租户4-6
            { id: '16-租户4-6', row: 14, col: 10 },
            { id: '17-租户4-6', row: 15, col: 10 },
            { id: '18-租户4-6', row: 16, col: 10 },
            { id: '19-租户4-6', row: 17, col: 10 },
            { id: '20-租户4-6', row: 18, col: 10 },
            { id: '21-租户4-6', row: 19, col: 10 },
            { id: '22-租户4-6', row: 20, col: 10 },
            { id: '23-租户4-6', row: 21, col: 10 },
            // 24层跳过
            { id: '25-租户4-6', row: 22, col: 10 },
            { id: '26-租户4-6', row: 23, col: 10 },
            { id: '27-租户4-6', row: 24, col: 10 },
            { id: '28-租户4-6', row: 25, col: 10 },
            { id: '29-租户4-6', row: 26, col: 10 },
            { id: '30-租户4-6', row: 27, col: 10 }
        ];
        defs.forEach(function(d) { map[d.id] = d; });
        return map;
    })(),

    // 所有测试表单（内存中）
    testForms: [],

    init: function() {
        this.bindEvents();
        this.renderAll();
        // 默认填今天日期
        var today = new Date().toISOString().slice(0, 10);
        document.getElementById('check-date').value = today;
    },

    // OCR 识别温度
    recognizeTemperature: function(photoData, callback) {
        console.log('[Busbar] recognizeTemperature called, photoData type:', typeof photoData, photoData ? photoData.length : 'null');

        if (typeof Tesseract === 'undefined') {
            console.log('[Busbar] Tesseract not loaded');
            callback(null);
            return;
        }

        // 尝试反色预处理（热成像照片白底黑字，反色后更易识别）
        var img = new Image();
        img.onload = function() {
            try {
                var canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                var ctx = canvas.getContext('2d');
                // 反色滤镜：白底黑字 -> 黑底白字
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.globalCompositeOperation = 'difference';
                ctx.drawImage(img, 0, 0);
                // 也可以加对比度增强
                var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                ctx.putImageData(imageData, 0, 0);

                var processedData = canvas.toDataURL('image/jpeg', 0.9);
                console.log('[Busbar] Processed image size:', processedData.length);

                Tesseract.recognize(processedData, 'eng').then(function(result) {
                    var text = result.data.text;
                    console.log('[Busbar] OCR raw text:', JSON.stringify(text));

                    var maxMatch = text.match(/Max[:\s]*(\d+\.?\d*)/i);
                    var minMatch = text.match(/Min[:\s]*(\d+\.?\d*)/i);
                    var avgMatch = text.match(/Avg[:\s]*(\d+\.?\d*)/i);

                    if (maxMatch || minMatch || avgMatch) {
                        callback({
                            max: maxMatch ? maxMatch[1] : '',
                            min: minMatch ? minMatch[1] : '',
                            avg: avgMatch ? avgMatch[1] : ''
                        });
                    } else {
                        var temps = text.match(/(\d{2}\.\d)/g);
                        if (temps && temps.length >= 3) {
                            callback({ max: temps[0] || '', min: temps[1] || '', avg: temps[2] || '' });
                        } else {
                            var nums = text.match(/(\d+\.?\d*)/g);
                            if (nums && nums.length >= 3) {
                                callback({ max: nums[0] || '', min: nums[1] || '', avg: nums[2] || '' });
                            } else {
                                console.log('[Busbar] OCR could not extract temps, raw:', text);
                                callback(null);
                            }
                        }
                    }
                }).catch(function(e) {
                    console.log('[Busbar] OCR recognize error:', e);
                    callback(null);
                });
            } catch(e2) {
                console.log('[Busbar] Image preprocessing error:', e2);
                // fallback: 直接用原图
                Tesseract.recognize(photoData, 'eng').then(function(result) {
                    console.log('[Busbar] OCR fallback text:', result.data.text);
                    callback(null);
                }).catch(function(e3) {
                    console.log('[Busbar] OCR fallback error:', e3);
                    callback(null);
                });
            }
        };
        img.onerror = function(e) {
            console.log('[Busbar] Image load error:', e);
            callback(null);
        };
        img.src = photoData;
    },

    bindEvents: function() {
        var self = this;
        document.getElementById('btn-new-group').addEventListener('click', function() {
            self.showGroupSelector();
        });
        document.getElementById('btn-new-group').addEventListener('click', function() {
            if (document.getElementById('group-selector-modal')) return;
            self.showGroupSelector();
        });
    },

    // 渲染所有内容
    renderAll: function() {
        this.renderRecords();
        this.renderForms();
    },

    // 显示分组选择弹窗
    showGroupSelector: function() {
        var self = this;
        // 已有数据的分组不能重复添加
        var usedGroups = this.testForms.map(function(f) { return f.groupName; });
        var available = this.GROUPS.filter(function(g) { return usedGroups.indexOf(g.name) === -1; });

        if (available.length === 0) {
            alert('所有分组已添加完毕');
            return;
        }

        var optionsHtml = available.map(function(g) {
            return '<option value="' + g.name + '">' + g.name + ' (' + g.devices.length + '个设备)</option>';
        }).join('');

        var modal = document.createElement('div');
        modal.id = 'group-selector-modal';
        modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.5);z-index:1000;display:flex;align-items:center;justify-content:center;';
        modal.innerHTML = '<div style="background:white;border-radius:8px;padding:20px;width:280px;">' +
            '<h3 style="margin:0 0 15px;font-size:14pt;color:#333;">选择分组</h3>' +
            '<select id="group-select" style="width:100%;padding:10px;font-size:12pt;margin-bottom:15px;border:1px solid #ccc;border-radius:4px;">' +
            optionsHtml + '</select>' +
            '<div style="display:flex;gap:10px;">' +
            '<button id="group-select-cancel" style="flex:1;padding:10px;background:#9e9e9e;color:white;border:none;border-radius:4px;font-size:12pt;">取消</button>' +
            '<button id="group-select-confirm" style="flex:1;padding:10px;background:#1565C0;color:white;border:none;border-radius:4px;font-size:12pt;">确定</button>' +
            '</div></div>';
        document.body.appendChild(modal);

        document.getElementById('group-select-cancel').addEventListener('click', function() {
            modal.remove();
        });
        document.getElementById('group-select-confirm').addEventListener('click', function() {
            var selected = document.getElementById('group-select').value;
            if (selected) {
                self.addGroupForm(selected);
                modal.remove();
            }
        });
        modal.addEventListener('click', function(e) {
            if (e.target === modal) modal.remove();
        });
    },

    // 添加一个分组表单
    addGroupForm: function(groupName) {
        var groupDef = this.GROUPS.find(function(g) { return g.name === groupName; });
        if (!groupDef) return;

        var formId = Date.now();
        var formData = {
            id: formId,
            groupName: groupName,
            collapsed: false,
            devices: groupDef.devices.map(function(d) {
                return { id: d.id, location: d.location, photo: '', temperature: null };
            })
        };

        this.testForms.push(formData);
        this.renderAll();
    },

    // 渲染历史记录列表
    renderRecords: function() {
        var container = document.getElementById('records-container');
        if (this.testForms.length === 0) {
            container.innerHTML = '';
            return;
        }

        var html = '';
        var self = this;
        this.testForms.forEach(function(form, idx) {
            var completedCount = form.devices.filter(function(d) { return d.photo; }).length;
            html += '<div class="record-item" onclick="busbarModule.expandForm(' + idx + ')">' +
                '<div class="record-info">' +
                '<span class="record-location">' + form.groupName + '</span>' +
                '<span class="record-date">检查日期: ' + (document.getElementById('check-date').value || '未填') + '</span>' +
                '<span class="record-count">' + completedCount + '/' + form.devices.length + ' 个设备已拍照</span>' +
                '</div>' +
                '<button class="btn-delete" onclick="event.stopPropagation();busbarModule.deleteForm(' + idx + ')">🗑</button>' +
                '</div>';
        });
        container.innerHTML = html;
    },

    // 渲染所有分组表单
    renderForms: function() {
        var container = document.getElementById('group-forms-container');
        var self = this;

        if (this.testForms.length === 0) {
            container.innerHTML = '<p class="empty-tip">暂无测试数据<br>点击下方「新建分组测试」开始</p>';
            return;
        }

        var html = '';
        this.testForms.forEach(function(form, formIdx) {
            html += self.createGroupFormHTML(form, formIdx);
        });
        container.innerHTML = html;
    },

    // 创建分组表单HTML
    createGroupFormHTML: function(form, formIdx) {
        var self = this;
        var completedCount = form.devices.filter(function(d) { return d.photo; }).length;

        var deviceHtml = '';
        form.devices.forEach(function(device, devIdx) {
            var isCompleted = !!device.photo;
            var tempHtml = '';
            if (device.temperature) {
                tempHtml = '<span class="temp-tag' + (parseFloat(device.temperature.max) > 50 ? ' high' : '') + '">Max:' + device.temperature.max + '°C</span>' +
                    '<span class="temp-tag">Min:' + device.temperature.min + '°C</span>' +
                    '<span class="temp-tag">Avg:' + device.temperature.avg + '°C</span>';
            }
            var photoIcon = isCompleted ? '✅' : '📷';
            var photoClass = isCompleted ? 'has-photo' : '';

            deviceHtml += '<div class="device-item' + (isCompleted ? ' completed' : '') + '">' +
                '<span class="device-name">' + device.id + '</span>' +
                '<span class="device-location">' + device.location + '</span>' +
                '<div class="device-temps">' + tempHtml + '</div>' +
                '<button class="btn-photo ' + photoClass + '" onclick="busbarModule.takePhoto(' + formIdx + ', ' + devIdx + ')" id="photo-btn-' + formIdx + '-' + devIdx + '">' +
                photoIcon + ' ' + (isCompleted ? '重新拍照' : '拍照') +
                '</button>' +
                '</div>';
        });

        return '<div class="test-form-card' + (form.collapsed ? ' collapsed' : '') + '" id="form-' + form.id + '">' +
            '<div class="form-header">' +
            '<span class="form-title">📁 ' + form.groupName + ' (' + completedCount + '/' + form.devices.length + ')</span>' +
            '<div class="form-header-actions">' +
            '<button class="btn-collapse" onclick="busbarModule.toggleCollapse(' + formIdx + ')">' + (form.collapsed ? '▶' : '▼') + '</button>' +
            '<button class="btn-remove" onclick="busbarModule.deleteForm(' + formIdx + ')">×</button>' +
            '</div>' +
            '</div>' +
            '<div class="device-list">' + deviceHtml + '</div>' +
            '</div>';
    },

    // 展开/折叠表单
    toggleCollapse: function(formIdx) {
        var form = this.testForms[formIdx];
        if (!form) return;
        form.collapsed = !form.collapsed;
        var card = document.getElementById('form-' + form.id);
        if (card) {
            if (form.collapsed) {
                card.classList.add('collapsed');
            } else {
                card.classList.remove('collapsed');
            }
            // Update collapse button icon
            var btn = card.querySelector('.btn-collapse');
            if (btn) btn.textContent = form.collapsed ? '▶' : '▼';
        }
    },

    // 展开/折叠表单（移动端用）
    expandForm: function(formIdx) {
        // 移动端暂时不做折叠，直接render
        this.renderForms();
    },

    // 删除表单
    deleteForm: function(formIdx) {
        if (confirm('确定删除该分组测试数据？')) {
            this.testForms.splice(formIdx, 1);
            this.renderAll();
        }
    },

    // 拍照 - 使用 3-arg 形式（与电池模块一致）
    takePhoto: function(formIdx, devIdx) {
        var self = this;
        var device = this.testForms[formIdx].devices[devIdx];
        console.log('[Busbar] takePhoto:', { formIdx: formIdx, devIdx: devIdx, deviceId: device.id });

        window.parent.requestThermalCamera(null, device.id, function(deviceId, extraData, base64) {
            console.log('[Busbar] requestFileChoose callback:', { deviceId: deviceId, extraData: extraData, base64Length: base64 ? base64.length : 0 });
            if (base64) {
                self.processPhoto(formIdx, devIdx, base64);
            }
        });
    },

    // 处理照片：存内存 + 启动 OCR
    processPhoto: function(formIdx, devIdx, base64) {
        var self = this;
        var device = this.testForms[formIdx].devices[devIdx];

        // 确保 base64 带 data:image 前缀
        var photoWithPrefix = (base64.indexOf('data:') === 0) ? base64 : 'data:image/jpeg;base64,' + base64;
        device.photo = photoWithPrefix;

        // 更新 UI
        var btn = document.getElementById('photo-btn-' + formIdx + '-' + devIdx);
        if (btn) {
            btn.className = 'btn-photo has-photo';
            btn.innerHTML = '✅ 重新拍照';
        }
        var item = btn ? btn.closest('.device-item') : null;
        if (item) item.classList.add('completed');

        // 更新分组计数
        this.updateGroupCount(formIdx);
        this.renderRecords();

        // OCR 识别温度（异步）
        var pureBase64 = (base64.indexOf('data:') === 0) ? base64.split(',')[1] : base64;
        this.recognizeTemperature('data:image/jpeg;base64,' + pureBase64, function(tempObj) {
            console.log('[Busbar] OCR result:', tempObj);
            if (tempObj) {
                device.temperature = tempObj;
                // 更新温度显示
                self.updateDeviceTempDisplay(formIdx, devIdx, tempObj);
                self.updateGroupCount(formIdx);
            }
        });
    },

    // 更新设备温度显示
    updateDeviceTempDisplay: function(formIdx, devIdx, tempObj) {
        var device = this.testForms[formIdx].devices[devIdx];
        var item = document.querySelector('#form-' + this.testForms[formIdx].id + ' .device-item:nth-child(' + (devIdx + 1) + ')');
        if (!item) return;

        var tempsEl = item.querySelector('.device-temps');
        if (tempsEl) {
            var isHigh = parseFloat(tempObj.max) > 50;
            tempsEl.innerHTML = '<span class="temp-tag' + (isHigh ? ' high' : '') + '">Max:' + tempObj.max + '°C</span>' +
                '<span class="temp-tag">Min:' + tempObj.min + '°C</span>' +
                '<span class="temp-tag">Avg:' + tempObj.avg + '°C</span>';
        }
    },

    // 更新分组完成计数
    updateGroupCount: function(formIdx) {
        var form = this.testForms[formIdx];
        if (!form) return;
        var completed = form.devices.filter(function(d) { return d.photo; }).length;
        var titleEl = document.querySelector('#form-' + form.id + ' .form-title');
        if (titleEl) {
            titleEl.textContent = '📁 ' + form.groupName + ' (' + completed + '/' + form.devices.length + ')';
        }
        this.renderRecords();
    },

    // OCR 识别温度（离线模式）
    recognizeTemperature: function(photoData, callback) {
        console.log('[Busbar] recognizeTemperature called');

        if (typeof Tesseract === 'undefined') {
            console.log('[Busbar] Tesseract not loaded');
            callback(null);
            return;
        }

        // 本地资源路径：通过本地 HTTP 服务器提供（解决 Worker 无法使用 file:// 的问题）
        // androidBridge 是 JsInterface 的注册名称
        // 注意：Android build 会自动解压 .gz 文件，所以实际请求未压缩的 .traineddata
        var assetServerUrl = (typeof androidBridge !== 'undefined' && androidBridge.getAssetServerUrl)
            ? androidBridge.getAssetServerUrl()
            : '';
        console.log('[Busbar] getAssetServerUrl =', JSON.stringify(assetServerUrl));
        var BASE = assetServerUrl
            ? assetServerUrl + '/tesseract/'
            : (typeof android !== 'undefined' && android.appInfo && android.appInfo.assetBaseUrl)
                ? android.appInfo.assetBaseUrl + 'tesseract/'
                : '../../tesseract/';
        console.log('[Busbar] BASE =', BASE);
        var LOCAL = {
            workerPath: BASE + 'worker.min.js',
            corePath:   BASE + 'tesseract-core.wasm.js',
            langPath:   BASE  // 指向 tesseract/ 目录，Tesseract 自动拼接 eng.traineddata.gz
        };
        console.log('[Busbar] Using local paths:', LOCAL);

        // 尝试反色预处理（热成像照片白底黑字，反色后更易识别）
        var img = new Image();
        var self = this;
        img.onload = function() {
            try {
                var canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                var ctx = canvas.getContext('2d');
                ctx.fillStyle = 'black';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.globalCompositeOperation = 'difference';
                ctx.drawImage(img, 0, 0);
                var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                ctx.putImageData(imageData, 0, 0);
                var processedData = canvas.toDataURL('image/jpeg', 0.9);
                console.log('[Busbar] Processed image size:', processedData.length);

                Tesseract.recognize(processedData, 'eng', LOCAL).then(function(result) {
                    var text = result.data.text;
                    console.log('[Busbar] OCR raw text:', JSON.stringify(text));

                    // 清理特殊字符（度符号、全角空白等）后再匹配
                    var cleaned = text.replace(/[°ºª⁰¹²³⁴⁵⁶⁷⁸⁹℃℉\u00A0\u2000-\u2009]/g, ' ').replace(/\s+/g, ' ').trim();
                    console.log('[Busbar] OCR cleaned text:', cleaned);

                    var maxMatch = cleaned.match(/Max\D*(\d+\.?\d*)/i);
                    var minMatch = cleaned.match(/Min\D*(\d+\.?\d*)/i);
                    var avgMatch = cleaned.match(/Avg\D*(\d+\.?\d*)/i);

                    if (maxMatch || minMatch || avgMatch) {
                        callback({ max: maxMatch ? maxMatch[1] : '', min: minMatch ? minMatch[1] : '', avg: avgMatch ? avgMatch[1] : '' });
                    } else {
                        var temps = cleaned.match(/(\d{2}\.\d)/g);
                        if (temps && temps.length >= 3) {
                            callback({ max: temps[0] || '', min: temps[1] || '', avg: temps[2] || '' });
                        } else {
                            var nums = cleaned.match(/(\d+\.?\d*)/g);
                            if (nums && nums.length >= 3) {
                                callback({ max: nums[0] || '', min: nums[1] || '', avg: nums[2] || '' });
                            } else {
                                console.log('[Busbar] OCR could not extract temps, raw:', text);
                                callback(null);
                            }
                        }
                    }
                }).catch(function(e) {
                    console.log('[Busbar] OCR recognize error:', e);
                    callback(null);
                });
            } catch(e2) {
                console.log('[Busbar] Image preprocessing error:', e2);
                Tesseract.recognize(photoData, 'eng', LOCAL).then(function(result) {
                    console.log('[Busbar] OCR fallback text:', result.data.text);
                    callback(null);
                }).catch(function(e3) {
                    console.log('[Busbar] OCR fallback error:', e3);
                    callback(null);
                });
            }
        };
        img.onerror = function(e) {
            console.log('[Busbar] Image load error:', e);
            callback(null);
        };
        img.src = photoData;
    },

    // 清空所有数据
    clearAll: function() {
        if (confirm('确定要清空所有数据吗？')) {
            this.testForms = [];
            this.renderAll();
        }
    },

    // 导出 Excel（async/await 风格）
    async exportExcel() {
        if (this.testForms.length === 0) {
            alert('没有可导出的数据');
            return;
        }

        var checkDate = document.getElementById('check-date').value;
        var roomTemp = document.getElementById('room-temp').value;
        if (!checkDate) {
            alert('请输入检查日期');
            return;
        }

        this.showLoading('正在加载模板...');

        try {
            var JSZip = window.JSZip;
            var parser = new DOMParser();
            var ns = { x: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main' };

            // 加载模板
            var buffer = await new Promise(function(resolve, reject) {
                var xhr = new XMLHttpRequest();
                xhr.open('GET', '../../templates/busbar_template.xlsx', true);
                xhr.responseType = 'arraybuffer';
                xhr.onload = function() {
                    if (xhr.status === 200 || xhr.status === 0) resolve(xhr.response);
                    else reject(new Error('加载模板失败: ' + xhr.status));
                };
                xhr.onerror = function() { reject(new Error('网络错误')); };
                xhr.send();
            });

            this.showLoading('正在生成Excel...');
            var zip = await JSZip.loadAsync(buffer);

            // 读取 sheet1.xml
            var sheetXml = await zip.file('xl/worksheets/sheet1.xml').async('string');
            var xmlDoc = parser.parseFromString(sheetXml, 'text/xml');

            // 设置单元格的辅助函数
            var setCellStr = function(doc, cellRef, value) {
                var cell = doc.querySelector('c[r="' + cellRef + '"]');
                if (!cell) return;
                cell.setAttribute('t', 'str');
                var v = cell.querySelector('v');
                if (!v) { v = doc.createElementNS(ns.x, 'v'); cell.appendChild(v); }
                v.textContent = value;
            };

            // 填入日期和室温
            var dateParts = checkDate.split('-');
            var dateStr = dateParts[0] + '年' + parseInt(dateParts[1]) + '月' + parseInt(dateParts[2]) + '日';
            setCellStr(xmlDoc, 'N3', dateStr);
            if (roomTemp) {
                var tempVal = roomTemp.endsWith('℃') ? roomTemp : roomTemp + '℃';
                setCellStr(xmlDoc, 'P3', tempVal);
            }

                // 照片列 = 设备编号列 + 1 (B列设备数据 → C列放照片)
                // DEVICE_EXCEL_POS.col 是 Excel 1-indexed，Drawing 的 <col> 也是 1-indexed，故直接用
                var photoList = [];
                for (var fi = 0; fi < this.testForms.length; fi++) {
                    var form = this.testForms[fi];
                    for (var di = 0; di < form.devices.length; di++) {
                        var device = form.devices[di];
                        var pos = this.DEVICE_EXCEL_POS[device.id];
                        if (!pos) continue;

                        if (device.temperature) {
                            var tempColLetter = String.fromCharCode(64 + pos.col + 2);
                            var tempLines = [];
                            if (device.temperature.max) tempLines.push('Max: ' + device.temperature.max + '°C');
                            if (device.temperature.min) tempLines.push('Min: ' + device.temperature.min + '°C');
                            if (device.temperature.avg) tempLines.push('Avg: ' + device.temperature.avg + '°C');
                            if (tempLines.length > 0) {
                                setCellStr(xmlDoc, tempColLetter + pos.row, tempLines.join('\n'));
                            }
                        }

                        // 收集照片
                        if (device.photo) {
                            photoList.push({
                                deviceId: device.id,
                                pos: pos,
                                photoData: device.photo
                            });
                        }
                    }
                }

            // 保存 sheet1.xml
            var serializer = new XMLSerializer();
            zip.file('xl/worksheets/sheet1.xml', serializer.serializeToString(xmlDoc));

            // 嵌入照片
            if (photoList.length > 0) {
                this.showLoading('正在嵌入照片...');

                var wsDrContent = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
                    '<wsDr xmlns="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing">';
                var drawingRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
                    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">';

                photoList.forEach(function(photo, idx) {
                    var imgFileName = 'photo_' + photo.deviceId + '.png';
                    var rid = 'rId' + (idx + 1);

                    // 写入图片文件
                    zip.file('xl/media/' + imgFileName, BusbarModule.base64ToUint8Array(photo.photoData));

                    // drawing rels
                    drawingRels += '<Relationship Id="' + rid + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="/xl/media/' + imgFileName + '"/>';

                    // oneCellAnchor
                    wsDrContent += '<oneCellAnchor editAs="oneCell">' +
                        '<from><col>' + photo.pos.col + '</col><colOff>0</colOff><row>' + (photo.pos.row - 1) + '</row><rowOff>0</rowOff></from>' +
                        '<ext cx="1054800" cy="914400"/>' +
                        '<pic>' +
                        '<nvPicPr><cNvPr id="' + (idx + 1) + '" name="Photo' + photo.deviceId + '" descr="Photo' + photo.deviceId + '"/><cNvPicPr/></nvPicPr>' +
                        '<blipFill>' +
                        '<a:blip xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="' + rid + '"/>' +
                        '<a:stretch xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:fillRect/></a:stretch>' +
                        '</blipFill>' +
                        '<spPr><a:prstGeom xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" prst="rect"/></spPr>' +
                        '</pic>' +
                        '<clientData/>' +
                        '</oneCellAnchor>';
                });

                wsDrContent += '</wsDr>';
                drawingRels += '</Relationships>';

                zip.file('xl/drawings/drawing1.xml', wsDrContent);
                zip.file('xl/drawings/_rels/drawing1.xml.rels', drawingRels);

                // 更新 Content_Types.xml
                var ctContent = await zip.file('[Content_Types].xml').async('string');
                if (ctContent.indexOf('drawing') === -1) {
                    zip.file('[Content_Types].xml', ctContent.replace('</Types>',
                        '<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/></Types>'));
                }

                // 创建 sheet1.xml.rels
                zip.file('xl/worksheets/_rels/sheet1.xml.rels',
                    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
                    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
                    '<Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="/xl/drawings/drawing1.xml" Id="rId1"/>' +
                    '</Relationships>');

                // 在 sheet1.xml 中注入 drawing 引用
                var sheet1Content = await zip.file('xl/worksheets/sheet1.xml').async('string');
                if (sheet1Content.indexOf('</worksheet>') !== -1) {
                    sheet1Content = sheet1Content.replace('</worksheet>', '<drawing r:id="rId1"/></worksheet>');
                    zip.file('xl/worksheets/sheet1.xml', sheet1Content);
                }
            }

            // 生成并下载
            this.showLoading('正在生成文件...');
            var excelBuffer = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
            var fileName = '供电母排检查测温_' + checkDate + '.xlsx';

            var reader = new FileReader();
            await new Promise(function(resolve, reject) {
                reader.onload = function() {
                    window.parent.saveFile(fileName, reader.result);
                    resolve();
                };
                reader.onerror = function() { reject(new Error('读取文件失败')); };
                reader.readAsDataURL(excelBuffer);
            });

            this.hideLoading();
            alert('报告已生成！\n保存到：' + fileName);

        } catch (error) {
            console.error('[Busbar] 导出失败:', error);
            this.hideLoading();
            alert('导出失败: ' + error.message);
        }
    },

    // 显示加载遮罩
    showLoading: function(msg) {
        var el = document.getElementById('loading-msg');
        if (el) el.textContent = msg;
        document.getElementById('loading-overlay').style.display = 'flex';
    },

    // 隐藏加载遮罩
    hideLoading: function() {
        document.getElementById('loading-overlay').style.display = 'none';
    },

    // base64 → Uint8Array
    base64ToUint8Array: function(base64) {
        var base64Data = base64.split(',')[1] || base64;
        var binaryString = atob(base64Data);
        var bytes = new Uint8Array(binaryString.length);
        for (var i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        return bytes;
    }
};

// 初始化
function initModule() {
    BusbarModule.init();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initModule);
} else {
    initModule();
}

window.busbarModule = BusbarModule;
