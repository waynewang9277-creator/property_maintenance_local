// Battery Test Module - 电池测试模块逻辑
// 支持多个测试表单，一次生成多页PDF
let LOGO_DATA_URI = '';

const BatteryTestModule = {
    testForms: [],      // 存储所有测试表单的数据
    pdfBlob: null,

    init() {
        this.loadLogo();
        this.bindEvents();
        this.renderTestList();
        this.updateBottomActions();
    },

    bindEvents() {
        document.getElementById('btn-save').addEventListener('click', () => this.saveRecords());
        document.getElementById('btn-generate-pdf').addEventListener('click', () => this.generateAllPDF());
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
        this.renderAddButton(); // 清空表单UI
        
        alert('记录已保存');
    },

    loadLogo() {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            LOGO_DATA_URI = canvas.toDataURL('image/jpeg', 0.9);
        };
        img.onerror = () => {
            console.warn('Logo加载失败，使用默认图标');
        };
        img.src = '../../common/images/logo.jpg';
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

    // 渲染空白状态（显示初始新建按钮）
    renderEmptyState() {
        const container = document.getElementById('test-forms-container');
        container.innerHTML = `
            <div style="text-align: center; padding: 40px 20px; background: #f9f9f9; border-radius: 8px; margin-bottom: 15px;">
                <p style="color: #666; margin-bottom: 15px;">点击下方按钮开始创建测试</p>
                <button class="btn btn-primary btn-lg" onclick="batteryModule.addTestForm()">➕ 新建测试</button>
            </div>
        `;
    },

    // 渲染新建按钮（当没有表单但有历史记录时）
    renderAddButton() {
        const container = document.getElementById('test-forms-container');
        container.innerHTML = `
            <div style="text-align: center; padding: 20px;">
                <button class="btn btn-primary btn-lg" onclick="batteryModule.addTestForm()">➕ 新建测试</button>
            </div>
        `;
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
        testData.records.forEach((record, recordIndex) => {
            const hasPhoto = record.photoData ? '✅' : '📷';
            recordsHtml += `
                <div class="record-row">
                    <span class="row-num">${recordIndex + 1}</span>
                    <input type="number" class="voltage-input" 
                           value="${record.voltage}" 
                           placeholder="%"
                           min="0" max="100"
                           data-test-index="${index}"
                           data-record-index="${recordIndex}"
                           onchange="batteryModule.updateField(${index}, ${recordIndex}, 'voltage', this.value)">
                    <button class="btn-photo" onclick="batteryModule.takePhoto(${index}, ${recordIndex})" id="photo-btn-${index}-${recordIndex}">
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
                                <span>序号</span>
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
                <div class="form-footer">
                    <button class="btn btn-primary" onclick="batteryModule.addTestForm()">➕ 新建测试</button>
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

    // 拍照
    takePhoto(testIndex, recordIndex) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.processPhoto(file, testIndex, recordIndex);
            }
        };
        
        input.click();
    },

    // 处理照片
    processPhoto(file, testIndex, recordIndex) {
        const reader = new FileReader();
        reader.onload = (event) => {
            this.resizeImage(event.target.result, 1200, (resizedDataUrl) => {
                if (this.testForms[testIndex] && this.testForms[testIndex].records[recordIndex]) {
                    this.testForms[testIndex].records[recordIndex].photoData = resizedDataUrl;
                    this.renderAllForms();
                }
            });
        };
        reader.readAsDataURL(file);
    },

    // 压缩图片
    resizeImage(dataUrl, maxWidth, callback) {
        const img = new Image();
        img.onload = () => {
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
        img.src = dataUrl;
    },

    // 清除表单（不清空历史记录）
    clearForms() {
        this.testForms = [];
        this.renderTestList();
        this.updateBottomActions();
    },

    // 生成所有测试的PDF
    generateAllPDF() {
        // 验证至少有1个表单
        if (this.testForms.length === 0) {
            alert('请先添加至少一个测试');
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

        // 显示加载状态
        document.getElementById('pdf-container').innerHTML = '<p style="text-align:center;padding:50px;">正在生成 PDF...</p>';

        // 生成PDF
        this.createMultiPagePDF();
    },

    // 创建多页PDF（顺序生成，避免异步问题）
    async createMultiPagePDF() {
        const container = document.getElementById('pdf-container');
        container.innerHTML = '';
        
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        const pageWidth = 210;
        const margin = 25;
        
        // 顺序为每个测试生成一页
        for (let testIndex = 0; testIndex < this.testForms.length; testIndex++) {
            const testData = this.testForms[testIndex];
            
            // 如果不是第一个测试，添加新页面
            if (testIndex > 0) {
                pdf.addPage();
            }
            
            // 创建临时div用于渲染当前页
            const tempDiv = document.createElement('div');
            tempDiv.style.cssText = `
                position: fixed;
                left: -9999px;
                top: 0;
                width: ${pageWidth}mm;
                min-height: 297mm;
                padding: 8mm ${margin}mm ${margin}mm ${margin}mm;
                background: white;
                font-family: 'Microsoft YaHei', 'SimHei', 'Noto Sans CJK SC', sans-serif;
                font-size: 9pt;
                line-height: 1.4;
                color: #000;
                box-sizing: border-box;
            `;
            
            // 顶部区域
            tempDiv.innerHTML = `
                <div style="position: relative; width: 100%; margin-bottom: 8px;">
                    <div style="position: relative; width: 100%; margin-bottom: 6px;">
                        ${LOGO_DATA_URI ? `<img src="${LOGO_DATA_URI}" style="position: absolute; left: 0; top: 50%; transform: translateY(-50%); max-width: 100px; max-height: 50px;">` : ''}
                        <div style="font-size: 16pt; font-weight: bold; text-align: center;">应急装置电池放电时间记录表</div>
                    </div>
                </div>
                <div style="border-bottom: 2px solid #333; margin-bottom: 8px;"></div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 9pt;">
                    <span><strong>安装地点：</strong>${this.escapeHtml(testData.location)}</span>
                    <span><strong>开始时间：</strong>${testData.testDate} ${testData.testTime}</span>
                </div>
            `;
            
            // 表格
            const tableHtml = `
                <table style="width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 15px;">
                    <thead>
                        <tr style="background: #e6e6e6;">
                            <th style="border: 1px solid #333; padding: 6px; width: 12mm; text-align: center;">序号</th>
                            <th style="border: 1px solid #333; padding: 6px; width: 50mm; text-align: center;">应急装置安装地点</th>
                            <th style="border: 1px solid #333; padding: 6px; width: 28mm; text-align: center;">放电时间</th>
                            <th style="border: 1px solid #333; padding: 6px; width: 32mm; text-align: center;">剩余电量%</th>
                            <th style="border: 1px solid #333; padding: 6px; width: 26mm; text-align: center;">备注</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${[0, 20, 40, 60, 80, 100, 120].map((min, i) => {
                            const record = testData.records[i] || {};
                            return `
                                <tr>
                                    <td style="border: 1px solid #333; padding: 6px; text-align: center; height: 8mm;">${i + 1}</td>
                                    <td style="border: 1px solid #333; padding: 6px; text-align: center; height: 8mm;">${i === 0 ? this.escapeHtml(testData.location) : ''}</td>
                                    <td style="border: 1px solid #333; padding: 6px; text-align: center; height: 8mm;">${min}分钟</td>
                                    <td style="border: 1px solid #333; padding: 6px; text-align: center; height: 8mm;">${this.escapeHtml(record.voltage || '')}</td>
                                    <td style="border: 1px solid #333; padding: 6px; text-align: center; height: 8mm;">${i === 0 ? this.escapeHtml(testData.testDate + ' ' + testData.testTime) : ''}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            `;
            tempDiv.innerHTML += tableHtml;
            
            // 照片区域
            const hasPhotos = testData.records.some(r => r.photoData);
            if (hasPhotos) {
                tempDiv.innerHTML += `
                    <div style="font-size: 10pt; font-weight: bold; margin: 10px 0 8px 0;">放电测试照片记录</div>
                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 15px;">
                        ${testData.records.map((record, i) => {
                            if (record.photoData) {
                                return `
                                    <div style="border: 1px solid #ccc; padding: 4px; text-align: center;">
                                        <div style="width: 100%; height: 44mm; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #f5f5f5;">
                                            <img src="${record.photoData}" style="max-width: 100%; max-height: 100%; object-fit: contain;">
                                        </div>
                                        <div style="font-size: 8pt; color: #666; margin-top: 4px;">${i * 20}分钟 - ${record.voltage || '?'}%</div>
                                    </div>
                                `;
                            }
                            return '';
                        }).join('')}
                    </div>
                `;
            }
            
            // 签字栏
            tempDiv.innerHTML += `
                <div style="margin-top: 25px;">
                    <div style="font-size: 9pt; margin-bottom: 8px;"><strong>签字确认：</strong></div>
                    <div style="display: flex; justify-content: space-between; gap: 15px;">
                        <div style="flex: 1; border: 1px solid #333; padding: 8px; text-align: center;">
                            <div style="font-size: 9pt; margin-bottom: 20px;">操作者：____________</div>
                            <div style="font-size: 8pt;">日期：____________</div>
                        </div>
                        <div style="flex: 1; border: 1px solid #333; padding: 8px; text-align: center;">
                            <div style="font-size: 9pt; margin-bottom: 20px;">领班：____________</div>
                            <div style="font-size: 8pt;">日期：____________</div>
                        </div>
                        <div style="flex: 1; border: 1px solid #333; padding: 8px; text-align: center;">
                            <div style="font-size: 9pt; margin-bottom: 20px;">工程主任：____________</div>
                            <div style="font-size: 8pt;">日期：____________</div>
                        </div>
                    </div>
                </div>
                <div style="margin-top: 15px; font-size: 7pt; color: #999;">SHKS/R0/2579/REV03/20240630</div>
            `;
            
            document.body.appendChild(tempDiv);
            
            // 等待html2canvas完成（顺序等待）
            const canvas = await html2canvas(tempDiv, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });
            
            const imgData = canvas.toDataURL('image/jpeg', 0.9);
            const imgHeight = (canvas.height * pageWidth) / canvas.width;
            
            pdf.addImage(imgData, 'JPEG', 0, margin, pageWidth, imgHeight);
            
            // 移除临时元素
            tempDiv.remove();
        }
        
        // 所有页面生成完成，显示PDF
        this.showPDFPreview(pdf);
    },

    // 显示PDF预览
    showPDFPreview(pdf) {
        const container = document.getElementById('pdf-container');
        this.pdfBlob = pdf.output('blob');
        const pdfUrl = URL.createObjectURL(this.pdfBlob);
        
        container.innerHTML = `
            <button class="btn btn-outline" style="margin-bottom:10px;" onclick="batteryModule.closePDF()">关闭预览</button>
            <iframe src="${pdfUrl}" style="width:100%; height:500px; border:none; border-radius:6px;"></iframe>
        `;
        
        // 清空表单
        this.testForms = [];
        this.renderAllForms();
        this.renderTestList();
    },

    // 关闭PDF预览
    closePDF() {
        const container = document.getElementById('pdf-container');
        container.innerHTML = '';
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
