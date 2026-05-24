// Battery Test Module - 电池测试模块逻辑
// 支持多个测试表单，一次生成Excel报告

const BatteryTestModule = {
    testForms: [],      // 存储所有测试表单的数据

    // 上下文信息（从URL参数传递）
    context: {
        date: null,
        region: null,
        category: 'strong-power'
    },

    init() {
        this.parseUrlParams();
        this.bindEvents();
        this.renderTestList();
        this.updateBottomActions();
    },

    parseUrlParams() {
        var params = new URLSearchParams(window.location.search);
        var date = params.get('date');
        var region = params.get('region');
        if (date) this.context.date = date;
        if (region) this.context.region = region;
        console.log('BatteryTestModule context:', this.context);
    },

    bindEvents() {
        document.getElementById('btn-save').addEventListener('click', () => this.saveRecords());
        document.getElementById('btn-generate-excel').addEventListener('click', () => this.generateExcel());
        document.getElementById('btn-cancel').addEventListener('click', () => this.clearForms());
        document.getElementById('btn-new-test').addEventListener('click', () => this.addTestForm());
    },

    // 更新底部操作按钮区显示
    updateBottomActions() {
        const bottomActions = document.getElementById('bottom-actions');
        const recordsContainer = document.getElementById('records-container');
        
        // 始终显示底部按钮区
        bottomActions.style.display = 'flex';
        recordsContainer.style.display = 'block';
    },

    // 保存记录到历史
    saveRecords() {
        if (this.testForms.length === 0) {
            alert('没有可保存的记录');
            return;
        }

        // 验证每个表单
        for (let i = 0; i < this.testForms.length; i++) {
            const test = this.testForms[i];
            if (!test.location.trim()) {
                alert(`请填写第 ${i + 1} 个测试的安装地点`);
                return;
            }
            if (!test.records || test.records.length === 0) {
                alert(`请为第 ${i + 1} 个测试添加至少一条记录`);
                return;
            }
        }

        // 保存到localStorage
        this.testForms.forEach(test => {
            DataManager.addRecord({
                location: test.location,
                testDate: test.testDate,
                testTime: test.testTime,
                records: test.records
            });
        });

        // 清空表单并刷新显示
        this.testForms = [];
        this.renderTestList();
        this.updateBottomActions();
        document.getElementById('test-forms-container').innerHTML = ''; // 清空表单UI
        
        alert('记录已保存');
    },

    // 渲染测试列表
    renderTestList() {
        const container = document.getElementById('records-container');
        const records = DataManager.getAllRecords();
        
        if (!records || records.length === 0) {
            container.innerHTML = '<p class="empty-tip">暂无测试记录</p>';
            return;
        }

        let html = '';
        records.forEach((record, index) => {
            const recordCount = record.records ? record.records.length : 0;
            html += `
                <div class="record-item">
                    <div class="record-info" onclick="batteryModule.viewRecord(${index})">
                        <span class="record-location">${record.location || '未知地点'}</span>
                        <span class="record-date">${record.testDate || ''} ${record.testTime || ''}</span>
                        <span class="record-count">${recordCount} 条记录</span>
                    </div>
                    <button class="btn-delete" onclick="batteryModule.deleteRecord(${index})">🗑 删除</button>
                </div>
            `;
        });
        container.innerHTML = html;
    },

    // 添加一个新的测试表单
    addTestForm() {
        const formId = Date.now();
        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const time = now.toTimeString().slice(0, 5);
        
        const testData = {
            id: formId,
            location: '',
            testDate: date,
            testTime: time,
            records: [{ voltage: '', photoData: '', note: '' }]
        };
        
        this.testForms.push(testData);
        this.renderAllForms();
    },

    // 渲染所有测试表单
    renderAllForms() {
        const container = document.getElementById('test-forms-container');
        let html = '';
        
        this.testForms.forEach((testData, index) => {
            html += this.createFormHTML(testData, index);
        });
        
        container.innerHTML = html;
        
        // 绑定事件
        this.bindFormEvents();
    },

    // 创建单个表单的HTML
    createFormHTML(testData, index) {
        const now = new Date();
        const defaultDate = testData.testDate || now.toISOString().split('T')[0];
        const defaultTime = testData.testTime || now.toTimeString().slice(0, 5);
        
        let recordsHtml = '';
        testData.records.forEach((record, recIdx) => {
            const hasPhoto = record.photoData ? '✅' : '📷';
            recordsHtml += `
                <div class="record-row">
                    <span class="row-num">${recIdx * 20}min</span>
                    <input type="number" class="voltage-input"
                           value="${record.voltage}"
                           data-record-index="${recIdx}"
                           onchange="batteryModule.updateField(${index}, ${recIdx}, 'voltage', this.value)">
                    <button class="btn-photo" onclick="batteryModule.takePhoto(${index}, ${recIdx})" id="photo-btn-${index}-${recIdx}">
                        ${hasPhoto} 拍照
                    </button>
                </div>
            `;
        });
        
        return `
            <div class="test-form-card" id="form-${testData.id}" data-index="${index}">
                <div class="form-header">
                    <span class="form-title">测试 ${index + 1}</span>
                    <button class="btn-remove" onclick="batteryModule.removeForm(${index})">×</button>
                </div>
                <div class="form-body">
                    <div class="form-group">
                        <label>安装地点</label>
                        <input type="text" id="location-${index}" value="${testData.location}" 
                               placeholder="如：1号楼配电室"
                               onchange="batteryModule.updateTestLocation(${index}, this.value)">
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>测试日期</label>
                            <input type="date" id="date-${index}" value="${defaultDate}"
                                   onchange="batteryModule.updateTestDate(${index}, this.value)">
                        </div>
                        <div class="form-group">
                            <label>测试时间</label>
                            <input type="time" id="time-${index}" value="${defaultTime}"
                                   onchange="batteryModule.updateTestTime(${index}, this.value)">
                        </div>
                    </div>
                    <div class="form-group">
                        <label>放电测试记录</label>
                        <div class="records-table">
                            <div class="table-header">
                                <span>时间</span>
                                <span>剩余电量%</span>
                                <span>照片</span>
                            </div>
                            <div id="records-${index}">
                                ${recordsHtml}
                            </div>
                        </div>
                        <button class="btn btn-secondary btn-sm" onclick="batteryModule.addRecord(${index})">➕ 添加记录</button>
                    </div>
                </div>
            </div>
        `;
    },

    // 绑定表单事件
    bindFormEvents() {
        // 事件已在HTML中通过onchange绑定
    },

    // 更新测试地点
    updateTestLocation(testIndex, value) {
        if (this.testForms[testIndex]) {
            this.testForms[testIndex].location = value;
        }
    },

    // 更新测试日期
    updateTestDate(testIndex, value) {
        if (this.testForms[testIndex]) {
            this.testForms[testIndex].testDate = value;
        }
    },

    // 更新测试时间
    updateTestTime(testIndex, value) {
        if (this.testForms[testIndex]) {
            this.testForms[testIndex].testTime = value;
        }
    },

    // 更新字段值
    updateField(testIndex, recordIndex, field, value) {
        if (this.testForms[testIndex] && this.testForms[testIndex].records[recordIndex]) {
            this.testForms[testIndex].records[recordIndex][field] = value;
        }
    },

    // 删除表单
    removeForm(testIndex) {
        this.testForms.splice(testIndex, 1);
        if (this.testForms.length === 0) {
            const records = DataManager.getAllRecords();
            if (!records || records.length === 0) {
                this.updateBottomActions();
            }
        } else {
            this.renderAllForms();
        }
    },

    // 添加记录行
    addRecord(testIndex) {
        if (this.testForms[testIndex]) {
            this.testForms[testIndex].records.push({
                voltage: '',
                photoData: '',
                note: ''
            });
            this.renderAllForms();
        }
    },

    // 拍照/选择照片
    takePhoto(testIndex, recordIndex) {
        console.log('[Battery] takePhoto called:', { testIndex, recordIndex });
        // 使用父窗口的文件选择器（因为 WebView 的 WebChromeClient 无法处理 iframe 内部的 input[type=file]）
        var self = this;
        window.parent.requestFileChooseRaw(null, testIndex, function(deviceId, extraData, base64) {
            console.log('[Battery] requestFileChoose callback:', { deviceId, extraData, base64Length: base64 ? base64.length : 0 });
            if (base64) {
                self.processPhotoFromBase64(base64, extraData, recordIndex);
            }
        });
    },

    // 处理 base64 照片（直接存储，不做resize，和电容模块保持一致）
    processPhotoFromBase64(base64, testIndex, recordIndex) {
        console.log('[Battery] processPhotoFromBase64:', { testIndex, recordIndex, base64Length: base64 ? base64.length : 0 });
        var formsLen = this.testForms ? this.testForms.length : 0;
        var recordsLen = this.testForms && this.testForms[testIndex] ? this.testForms[testIndex].records.length : 0;
        console.log('[Battery] testForms length:', formsLen, 'records length:', recordsLen);
        if (this.testForms[testIndex] && this.testForms[testIndex].records[recordIndex]) {
            this.testForms[testIndex].records[recordIndex].photoData = base64;
            console.log('[Battery] photo saved for testIndex:', testIndex, 'recordIndex:', recordIndex);
            this.renderAllForms();
        } else {
            console.log('[Battery] record not found:', { testIndex, recordIndex, formsLength: this.testForms.length });
        }
    },

    // 压缩图片
    resizeImage(dataUrl, maxWidth, callback) {
        console.log('[Battery] resizeImage called, dataUrl length:', typeof dataUrl, dataUrl ? dataUrl.length : 'null');
        const img = new Image();
        img.onload = () => {
            console.log('[Battery] img.onload, img.width:', img.width, 'img.height:', img.height);
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            callback(canvas.toDataURL('image/jpeg', 0.85));
        };
        img.onerror = () => {
            console.error('[Battery] img.onerror: failed to load image, dataUrl type:', typeof dataUrl, 'dataUrl preview:', dataUrl ? dataUrl.substring(0, 50) : 'null');
        };
        img.src = dataUrl;
    },

    // 清除表单（不清空历史记录）
    clearForms() {
        this.testForms = [];
        this.renderTestList();
        this.updateBottomActions();
    },

    // 生成Excel报告（多Sheet版）
    // 逻辑：testForms[0]→Sheet1, testForms[1]→Sheet2, ... 每个测试一个Sheet
    async generateExcel() {
        if (this.testForms.length === 0) {
            alert('请先添加至少一个测试');
            return;
        }

        // 验证
        for (let i = 0; i < this.testForms.length; i++) {
            const test = this.testForms[i];
            if (!test.location.trim()) {
                alert(`请填写第 ${i + 1} 个测试的安装地点`);
                return;
            }
            if (!test.records || test.records.length === 0) {
                alert(`请为第 ${i + 1} 个测试添加至少一条记录`);
                return;
            }
        }

        // 模板最多5个Sheet
        if (this.testForms.length > 5) {
            alert('模板最多支持5个测试地点，当前 ' + this.testForms.length + ' 个。请减少测试数量。');
            return;
        }

        document.getElementById('pdf-container').innerHTML = '<p style="text-align:center;padding:50px;">正在生成 Excel...</p>';

        try {
            const JSZip = window.JSZip;
            const parser = new DOMParser();
            const ns = { x: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main' };

            // 加载模板
            const buffer = await new Promise(function(resolve, reject) {
                var xhr = new XMLHttpRequest();
                xhr.open('GET', '../../templates/battery_template.xlsx', true);
                xhr.responseType = 'arraybuffer';
                xhr.onload = function() {
                    if (xhr.status === 200 || xhr.status === 0) resolve(xhr.response);
                    else reject(new Error('Failed to load template: ' + xhr.status));
                };
                xhr.onerror = function() { reject(new Error('Network error')); };
                xhr.send();
            });
            const zip = await JSZip.loadAsync(buffer);

            // 照片映射：idx → Excel单元格位置
            // idx 0(20min)→A13, idx 1(40min)→D13, idx 2(60min)→G13
            // idx 3(80min)→A15, idx 4(100min)→D15, idx 5(120min)→G15
            const photoCells = [
                { idx: 0, col: 'A', row: 13 },
                { idx: 1, col: 'D', row: 13 },
                { idx: 2, col: 'G', row: 13 },
                { idx: 3, col: 'A', row: 15 },
                { idx: 4, col: 'D', row: 15 },
                { idx: 5, col: 'G', row: 15 }
            ];
            const colMap = { 'A': 0, 'D': 3, 'G': 6 };

            // 辅助函数：在doc中设置单元格字符串值
            const setCellStr = (doc, cellRef, value) => {
                let cell = doc.querySelector(`c[r="${cellRef}"]`);
                if (!cell) return;
                cell.setAttribute('t', 'str');
                let v = cell.querySelector('v');
                if (!v) { v = doc.createElementNS(ns.x, 'v'); cell.appendChild(v); }
                v.textContent = value;
            };

            // === 遍历每个测试表单，填入对应Sheet ===
            for (let i = 0; i < this.testForms.length; i++) {
                const test = this.testForms[i];
                const sheetNum = i + 1; // Sheet1, Sheet2, ...

                // 读取对应Sheet的XML
                const sheetXml = await zip.file(`xl/worksheets/sheet${sheetNum}.xml`).async('string');
                const xmlDoc = parser.parseFromString(sheetXml, 'text/xml');

                // 填数据行 4-10
                test.records.forEach((record, idx) => {
                    if (idx >= 7) return; // 最多7行
                    const row = 4 + idx;

                    // 序号 A列（数值类型，去掉t属性）
                    const cellA = xmlDoc.querySelector(`c[r="A${row}"]`);
                    if (cellA) {
                        cellA.removeAttribute('t');
                        let v = cellA.querySelector('v');
                        if (!v) { v = xmlDoc.createElementNS(ns.x, 'v'); cellA.appendChild(v); }
                        v.textContent = idx + 1;
                    }

                    // 安装地点 B列（只在第1行填）
                    if (idx === 0) {
                        setCellStr(xmlDoc, `B${row}`, test.location);
                        // 测试日期填入 H列备注
                        setCellStr(xmlDoc, `H${row}`, `${test.testDate} ${test.testTime}`);
                    }

                    // 剩余电量% G列
                    setCellStr(xmlDoc, `G${row}`, record.voltage || '');
                });

                // 保存Sheet XML
                const serializer = new XMLSerializer();
                zip.file(`xl/worksheets/sheet${sheetNum}.xml`, serializer.serializeToString(xmlDoc));

                // === 嵌入照片到该Sheet的drawing文件 ===
                const photoList = [];
                if (test.records) {
                    test.records.forEach((record, idx) => {
                        if (record.photoData) {
                            const mapping = photoCells.find(p => p.idx === idx);
                            if (mapping) {
                                photoList.push({
                                    recordIndex: idx,
                                    col: mapping.col,
                                    row: mapping.row,
                                    photoData: record.photoData
                                });
                            }
                        }
                    });
                }

                if (photoList.length > 0) {
                    // 构建新的drawing XML（和电容模块一致）
                    let wsDrContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
                        `<wsDr xmlns="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing">`;
                    let drawingRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
                        `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`;

                    // 照片文件名：使用绝对路径（和电容模块一致）
                    photoList.forEach((photo, idx) => {
                        const imgFileName = `image${sheetNum * 10 + idx + 2}.jpeg`;
                        const rid = `rId${sheetNum * 10 + idx + 2}`;
                        const col = colMap[photo.col];
                        const row = photo.row - 1; // Excel行号从0开始

                        // 写入图片文件
                        zip.file(`xl/media/${imgFileName}`, this.base64ToUint8Array(photo.photoData));

                        // drawing rels（使用绝对路径 /xl/media/...）
                        drawingRels += `<Relationship Id="${rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="/xl/media/${imgFileName}"/>`;

                        // oneCellAnchor（和电容模块一致）
                        const photoDescr = `放电${photo.idx + 1}记录照片`;
                        wsDrContent += `<oneCellAnchor editAs="oneCell">` +
                            `<from><col>${col}</col><colOff>0</colOff><row>${row}</row><rowOff>0</rowOff></from>` +
                            `<ext cx="1920240" cy="1764792"/>` +
                            `<pic>` +
                            `<nvPicPr><cNvPr id="${sheetNum * 10 + idx + 2}" name="${photoDescr}" descr="${photoDescr}"/><cNvPicPr/></nvPicPr>` +
                            `<blipFill>` +
                            `<a:blip xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="${rid}"/>` +
                            `<a:stretch xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:fillRect/></a:stretch>` +
                            `</blipFill>` +
                            `<spPr><a:prstGeom xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" prst="rect"/></spPr>` +
                            `</pic>` +
                            `<clientData/>` +
                            `</oneCellAnchor>`;
                    });

                    wsDrContent += '</wsDr>';
                    drawingRels += '</Relationships>';

                    // 完全重写drawing文件（而不是追加）
                    zip.file(`xl/drawings/drawing${sheetNum}.xml`, wsDrContent);
                    zip.file(`xl/drawings/_rels/drawing${sheetNum}.xml.rels`, drawingRels);
                }
            }

            // === 生成并下载 ===
            const today = new Date();
            const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            const excelBuffer = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
            const fileName = `应急电池放电测试_${dateStr}.xlsx`;

            // 显示loading
            document.getElementById('pdf-container').innerHTML = `
                <div style="text-align:center;padding:30px;background:#f0f8ff;border-radius:8px;margin-bottom:15px;">
                    <div style="font-size:48px;margin-bottom:10px;">⏳</div>
                    <div style="font-size:16px;font-weight:bold;color:#333;margin-bottom:5px;">正在保存报告...</div>
                    <div style="font-size:13px;color:#666;">${fileName}</div>
                </div>
            `;

            const reader = new FileReader();
            await new Promise((resolve, reject) => {
                reader.onload = function() {
                    resolve(reader.result);
                };
                reader.onerror = function() { reject(new Error('读取文件失败')); };
                reader.readAsDataURL(excelBuffer);
            });

            // 保存文件（通过androidBridge）
            var base64 = reader.result;
            var self = this;
            var origOnFileSaved = window.onFileSaved;
            window.onFileSaved = async function(success, errorMsg) {
                window.onFileSaved = origOnFileSaved;
                if (success) {
                    document.getElementById('pdf-container').innerHTML = `
                        <div style="text-align:center;padding:30px;background:#f0f8ff;border-radius:8px;margin-bottom:15px;">
                            <div style="font-size:48px;margin-bottom:10px;">⏳</div>
                            <div style="font-size:16px;font-weight:bold;color:#333;margin-bottom:5px;">正在上传报告...</div>
                            <div style="font-size:13px;color:#666;">${fileName}</div>
                        </div>
                    `;

                    // 上传到服务器
                    if (self.context.date) {
                        try {
                            // 收集所有照片
                            var allPhotos = [];
                            for (var i = 0; i < self.testForms.length; i++) {
                                var test = self.testForms[i];
                                if (test.records) {
                                    for (var j = 0; j < test.records.length; j++) {
                                        if (test.records[j].photos) {
                                            allPhotos = allPhotos.concat(test.records[j].photos);
                                        }
                                    }
                                }
                            }

                            var reportData = {
                                category: self.context.category,
                                content: '应急电池放电测试 - ' + self.context.date,
                                executor: '',
                                completedDate: self.formatDate(new Date()),
                                date: self.context.date,
                                region: self.context.region,
                                moduleId: 'item-1',
                                photos: allPhotos,
                                fileBase64: base64
                            };

                            var result = await ApiClient.submitReport(reportData);
                            console.log('Report upload result:', result);

                            if (result.success) {
                                // 标记计划为已完成
                                var completeData = {
                                    category: self.context.category,
                                    date: self.context.date,
                                    moduleId: 'item-1',
                                    region: self.context.region,
                                    completedDate: self.formatDate(new Date())
                                };
                                var completeResult = await ApiClient.completeReport(completeData);
                                console.log('Complete result:', completeResult);

                                document.getElementById('pdf-container').innerHTML = `
                                    <div style="text-align:center;padding:30px;background:#f0f8ff;border-radius:8px;margin-bottom:15px;">
                                        <div style="font-size:48px;margin-bottom:10px;">✅</div>
                                        <div style="font-size:16px;font-weight:bold;color:#333;margin-bottom:5px;">报告生成完成！</div>
                                        <div style="font-size:13px;color:#666;">已保存到：${fileName}</div>
                                        <div style="font-size:13px;color:#52c41a;margin-top:5px;">报告已上传服务器，计划已标记完成</div>
                                    </div>
                                `;
                            } else {
                                document.getElementById('pdf-container').innerHTML = `
                                    <div style="text-align:center;padding:30px;background:#f0f8ff;border-radius:8px;margin-bottom:15px;">
                                        <div style="font-size:48px;margin-bottom:10px;">✅</div>
                                        <div style="font-size:16px;font-weight:bold;color:#333;margin-bottom:5px;">报告生成完成！</div>
                                        <div style="font-size:13px;color:#666;">已保存到：${fileName}</div>
                                        <div style="font-size:13px;color:#faad14;margin-top:5px;">报告已上传，标记完成失败</div>
                                    </div>
                                `;
                            }
                        } catch(e) {
                            console.error('Upload error:', e);
                            document.getElementById('pdf-container').innerHTML = `
                                <div style="text-align:center;padding:30px;background:#f0f8ff;border-radius:8px;margin-bottom:15px;">
                                    <div style="font-size:48px;margin-bottom:10px;">✅</div>
                                    <div style="font-size:16px;font-weight:bold;color:#333;margin-bottom:5px;">报告生成完成！</div>
                                    <div style="font-size:13px;color:#666;">已保存到：${fileName}</div>
                                    <div style="font-size:13px;color:#faad14;margin-top:5px;">报告已上传，上传过程出错</div>
                                </div>
                            `;
                        }
                    } else {
                        document.getElementById('pdf-container').innerHTML = `
                            <div style="text-align:center;padding:30px;background:#f0f8ff;border-radius:8px;margin-bottom:15px;">
                                <div style="font-size:48px;margin-bottom:10px;">✅</div>
                                <div style="font-size:16px;font-weight:bold;color:#333;margin-bottom:5px;">报告生成完成！</div>
                                <div style="font-size:13px;color:#666;">已保存到：${fileName}</div>
                            </div>
                        `;
                    }

                    self.testForms = [];
                    self.renderAllForms();
                    self.renderTestList();
                } else {
                    document.getElementById('pdf-container').innerHTML = `
                        <div style="text-align:center;padding:30px;background:#fff0f0;border-radius:8px;margin-bottom:15px;">
                            <div style="font-size:48px;margin-bottom:10px;">❌</div>
                            <div style="font-size:16px;font-weight:bold;color:#333;margin-bottom:5px;">保存失败</div>
                            <div style="font-size:13px;color:#666;">${errorMsg || '未知错误'}</div>
                        </div>
                    `;
                }
            };
            window.androidBridge.saveFile(base64, fileName);
            window.androidBridge.shareFile(base64, fileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');

        } catch (error) {
            console.error('生成失败:', error);
            document.getElementById('pdf-container').innerHTML = `
                <div style="text-align:center;padding:30px;background:#fff0f0;border-radius:8px;margin-bottom:15px;">
                    <div style="font-size:48px;margin-bottom:10px;">❌</div>
                    <div style="font-size:16px;font-weight:bold;color:#333;margin-bottom:5px;">生成失败</div>
                    <div style="font-size:13px;color:#666;">${this.escapeHtml(error.message)}</div>
                </div>
            `;
        }
    },

    // 格式化日期
    formatDate(date) {
        var y = date.getFullYear();
        var m = ('0' + (date.getMonth() + 1)).slice(-2);
        var d = ('0' + date.getDate()).slice(-2);
        return y + '-' + m + '-' + d;
    },

    // base64转Uint8Array
    base64ToUint8Array(base64) {
        const dataUrl = base64;
        const base64Data = dataUrl.split(',')[1] || dataUrl;
        const binaryString = atob(base64Data);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return bytes;
    },

    // HTML转义
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // 查看历史记录（单条）
    viewRecord(index) {
        const records = DataManager.getAllRecords();
        if (index >= 0 && index < records.length) {
            const record = records[index];
            // 填充到表单
            this.testForms = [{
                id: Date.now(),
                location: record.location || '',
                testDate: record.testDate || '',
                testTime: record.testTime || '',
                records: record.records || []
            }];
            this.renderAllForms();
        }
    },

    // 删除单条历史记录
    deleteRecord(index) {
        DataManager.deleteRecord(index);
        this.renderTestList();
    }
};

// 初始化
function initModule() {
    BatteryTestModule.init();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initModule);
} else {
    initModule();
}

// 导出
window.batteryModule = BatteryTestModule;
