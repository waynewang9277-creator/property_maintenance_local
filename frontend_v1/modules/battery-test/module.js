// Battery Test Module - 电池测试模块逻辑
// Logo base64 (from logo.jpg)
let LOGO_DATA_URI = '';

const BatteryTestModule = {
    currentRecordIndex: -1,
    currentRecord: null,
    pdfBlob: null,

    init() {
        this.loadLogo();
        this.bindEvents();
        this.setDefaultDateTime();
        this.renderRecords();
    },

    bindEvents() {
        document.getElementById('btn-new-test').addEventListener('click', () => this.showNewTest());
        document.getElementById('btn-add-record').addEventListener('click', () => this.addRecord());
        document.getElementById('btn-generate-pdf').addEventListener('click', () => this.generatePDF());
        document.getElementById('btn-cancel').addEventListener('click', () => this.hideTestForm());
    },

    // 加载Logo为base64
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

    // 设置默认日期时间
    setDefaultDateTime() {
        const now = new Date();
        const date = now.toISOString().split('T')[0];
        const time = now.toTimeString().slice(0, 5);
        document.getElementById('test-date').value = date;
        document.getElementById('test-time').value = time;
    },

    // 渲染记录列表
    renderRecords() {
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
                <div class="record-item" onclick="batteryModule.viewRecord(${index})">
                    <div class="record-info">
                        <span class="record-location">${record.location || '未知地点'}</span>
                        <span class="record-date">${record.testDate || ''} ${record.testTime || ''}</span>
                    </div>
                    <div class="record-meta">
                        <span>${recordCount} 条记?/span>
                    </div>
                </div>
            `;
        });
        container.innerHTML = html;
    },

    // 显示新增表单
    showNewTest() {
        this.currentRecordIndex = -1;
        this.currentRecord = {
            location: '',
            testDate: '',
            testTime: '',
            records: []
        };
        
        document.getElementById('location').value = '';
        this.setDefaultDateTime();
        document.getElementById('records-input').innerHTML = '';
        
        document.getElementById('test-form').style.display = 'block';
        document.getElementById('pdf-container').style.display = 'none';
        this.addRecord(); // 添加第一条记录
    },
    // 隐藏测试表单
    hideTestForm() {
        document.getElementById('test-form').style.display = 'none';
    },

    // 添加记录行
    addRecord() {
        if (!this.currentRecord.records) {
            this.currentRecord.records = [];
        }
        
        this.currentRecord.records.push({
            voltage: '',
            photoData: '',
            note: ''
        });
        
        this.renderRecordInputs();
    },

    // 渲染记录输入行
    renderRecordInputs() {
        const container = document.getElementById('records-input');
        let html = '';
        
        (this.currentRecord.records || []).forEach((record, index) => {
            const hasPhoto = record.photoData ? '? : '📷';
            html += `
                <div class="record-row">
                    <span class="row-num">${index + 1}</span>
                    <input type="number" class="voltage-input" 
                           value="${record.voltage}" 
                           placeholder="%"
                           min="0" max="100"
                           onchange="batteryModule.updateRecord(${index}, 'voltage', this.value)">
                    <button class="btn-photo" onclick="batteryModule.takePhoto(${index})" id="photo-btn-${index}">
                        ${hasPhoto} 拍照
                    </button>
                </div>
            `;
        });
        
        container.innerHTML = html;
    },

    // 更新记录
    updateRecord(index, field, value) {
        if (this.currentRecord && this.currentRecord.records && this.currentRecord.records[index]) {
            this.currentRecord.records[index][field] = value;
        }
    },

    // 拍照/上传照片
    takePhoto(index) {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                this.processPhoto(file, index);
            }
        };
        
        input.click();
    },

    // 处理照片
    processPhoto(file, recordIndex) {
        const reader = new FileReader();
        reader.onload = (event) => {
            this.resizeImage(event.target.result, 1200, (resizedDataUrl) => {
                this.currentRecord.records[recordIndex].photoData = resizedDataUrl;
                this.renderRecordInputs();
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

    // 生成 PDF
    generatePDF() {
        const location = document.getElementById('location').value.trim();
        const testDate = document.getElementById('test-date').value;
        const testTime = document.getElementById('test-time').value;

        if (!location) {
            alert('请输入安装地?);
            return;
        }

        if (!this.currentRecord.records || this.currentRecord.records.length === 0) {
            alert('请添加至少一条记?);
            return;
        }

        // 保存数据
        this.currentRecord.location = location;
        this.currentRecord.testDate = testDate;
        this.currentRecord.testTime = testTime;

        // 保存?localStorage
        if (this.currentRecordIndex >= 0) {
            DataManager.updateRecord(this.currentRecordIndex, this.currentRecord);
        } else {
            DataManager.addRecord(this.currentRecord);
        }

        // 显示加载状?        document.getElementById('pdf-container').innerHTML = '<p style="text-align:center;padding:50px;">正在生成 PDF...</p>';

        // 创建 PDF 内容
        this.createPDFContent();
    },

    // 创建 PDF 内容区域
    createPDFContent() {
        const container = document.getElementById('pdf-container');
        container.innerHTML = '';
        
        const pdfContent = document.createElement('div');
        pdfContent.id = 'pdf-content';
        pdfContent.style.cssText = `
            position: fixed;
            left: -9999px;
            top: 0;
            width: 210mm;
            min-height: 297mm;
            padding: 25mm;
            background: white;
            font-family: 'Microsoft YaHei', 'SimHei', 'Noto Sans CJK SC', sans-serif;
            font-size: 9pt;
            line-height: 1.4;
            color: #000;
            box-sizing: border-box;
        `;

        // 顶部区域（Logo + 标题?        const topArea = document.createElement('div');
        topArea.style.cssText = 'position: relative; width: 100%; margin-bottom: 15px;';
        
        const titleRow = document.createElement('div');
        titleRow.style.cssText = 'position: relative; width: 100%; margin-bottom: 10px;';
        
        // Logo 图片（左上角?        const logoImg = document.createElement('img');
        logoImg.src = LOGO_DATA_URI;
        logoImg.style.cssText = 'position: absolute; left: 0; top: 50%; transform: translateY(-50%); max-width: 100px; max-height: 50px;';
        titleRow.appendChild(logoImg);
        
        // 标题（居中）
        const title = document.createElement('div');
        title.style.cssText = 'font-size: 16pt; font-weight: bold; text-align: center;';
        title.textContent = '应急装置电池放电时间记录表';
        titleRow.appendChild(title);
        
        topArea.appendChild(titleRow);
        pdfContent.appendChild(topArea);

        // 分隔?        const divider = document.createElement('div');
        divider.style.cssText = 'border-bottom: 2px solid #333; margin-bottom: 10px;';
        pdfContent.appendChild(divider);

        // 信息?        const infoRow = document.createElement('div');
        infoRow.style.cssText = 'display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 9pt;';
        infoRow.innerHTML = `
            <span><strong>安装地点?/strong>${this.escapeHtml(this.currentRecord.location)}</span>
            <span><strong>开始时间：</strong>${this.escapeHtml(this.currentRecord.testDate)} ${this.escapeHtml(this.currentRecord.testTime)}</span>
        `;
        pdfContent.appendChild(infoRow);

        // 表格
        const table = document.createElement('table');
        table.style.cssText = 'width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 15px;';
        
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr style="background: #e6e6e6;">
                <th style="border: 1px solid #333; padding: 6px; width: 12mm; text-align: center;">序号</th>
                <th style="border: 1px solid #333; padding: 6px; width: 50mm; text-align: center;">应急装置安装地?/th>
                <th style="border: 1px solid #333; padding: 6px; width: 28mm; text-align: center;">放电时间</th>
                <th style="border: 1px solid #333; padding: 6px; width: 32mm; text-align: center;">剩余电量%</th>
                <th style="border: 1px solid #333; padding: 6px; width: 26mm; text-align: center;">备注</th>
            </tr>
        `;
        table.appendChild(thead);

        const tbody = document.createElement('tbody');
        const TIME_POINTS = ['0分钟', '20分钟', '40分钟', '60分钟', '80分钟', '100分钟', '120分钟'];
        
        for (let i = 0; i < 7; i++) {
            const record = this.currentRecord.records[i] || {};
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="border: 1px solid #333; padding: 6px; text-align: center; height: 8mm;">${i + 1}</td>
                <td style="border: 1px solid #333; padding: 6px; text-align: center; height: 8mm;">${i === 0 ? this.escapeHtml(this.currentRecord.location) : ''}</td>
                <td style="border: 1px solid #333; padding: 6px; text-align: center; height: 8mm;">${TIME_POINTS[i]}</td>
                <td style="border: 1px solid #333; padding: 6px; text-align: center; height: 8mm;">${this.escapeHtml(record.voltage || '')}</td>
                <td style="border: 1px solid #333; padding: 6px; text-align: center; height: 8mm;">${i === 0 ? this.escapeHtml(this.currentRecord.testDate + ' ' + this.currentRecord.testTime) : ''}</td>
            `;
            tbody.appendChild(row);
        }
        table.appendChild(tbody);
        pdfContent.appendChild(table);

        // 照片区域
        const hasPhotos = this.currentRecord.records.some(r => r.photoData);
        if (hasPhotos) {
            const photoTitle = document.createElement('div');
            photoTitle.style.cssText = 'font-size: 10pt; font-weight: bold; margin: 10px 0 8px 0;';
            photoTitle.textContent = '放电测试照片记录';
            pdfContent.appendChild(photoTitle);

            const photoGrid = document.createElement('div');
            photoGrid.style.cssText = 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 15px;';
            
            this.currentRecord.records.forEach((record, index) => {
                if (record.photoData) {
                    const photoCell = document.createElement('div');
                    photoCell.style.cssText = 'border: 1px solid #ccc; padding: 4px; text-align: center;';
                    
                    const imgWrapper = document.createElement('div');
                    imgWrapper.style.cssText = 'width: 100%; height: 44mm; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #f5f5f5;';
                    
                    const img = document.createElement('img');
                    img.src = record.photoData;
                    img.style.cssText = 'max-width: 100%; max-height: 100%; object-fit: contain;';
                    imgWrapper.appendChild(img);
                    photoCell.appendChild(imgWrapper);
                    
                    const label = document.createElement('div');
                    label.style.cssText = 'font-size: 8pt; color: #666; margin-top: 4px;';
                    label.textContent = `${index * 20}分钟 - ${record.voltage || '?'}%`;
                    photoCell.appendChild(label);

                    photoGrid.appendChild(photoCell);
                }
            });
            pdfContent.appendChild(photoGrid);
        }

        // 签字?        const sigArea = document.createElement('div');
        sigArea.style.cssText = 'margin-top: 25px; page-break-inside: avoid;';
        sigArea.innerHTML = `
            <div style="font-size: 9pt; margin-bottom: 8px;"><strong>签字确认?/strong></div>
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
        `;
        pdfContent.appendChild(sigArea);

        // 表单编号
        const formNo = document.createElement('div');
        formNo.style.cssText = 'margin-top: 15px; font-size: 7pt; color: #999;';
        formNo.textContent = 'SHKS/R0/2579/REV03/20240630';
        pdfContent.appendChild(formNo);

        document.body.appendChild(pdfContent);
        this.renderPDF(pdfContent);
    },

    // HTML 转义
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // 渲染 PDF
    async renderPDF(pdfContent) {
        const container = document.getElementById('pdf-container');
        
        try {
            const canvas = await html2canvas(pdfContent, {
                scale: 3,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                width: 210 * 3.78,
                windowWidth: 794
            });

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const pageWidth = 210;
            const pageHeight = 297;

            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * pageWidth) / canvas.width;

            const pagesNeeded = Math.ceil(imgHeight / pageHeight);
            
            for (let i = 0; i < pagesNeeded; i++) {
                if (i > 0) {
                    pdf.addPage();
                }
                const yOffset = -i * pageHeight;
                pdf.addImage(imgData, 'JPEG', 0, yOffset, imgWidth, imgHeight);
            }

            this.pdfBlob = pdf.output('blob');
            
            const pdfUrl = URL.createObjectURL(this.pdfBlob);
            const iframe = document.createElement('iframe');
            iframe.src = pdfUrl;
            iframe.style.cssText = 'width:100%; height:500px; border:none; border-radius:6px;';
            
            container.innerHTML = '';
            
            const closeBtn = document.createElement('button');
            closeBtn.textContent = '?关闭预览';
            closeBtn.className = 'btn btn-outline';
            closeBtn.style.cssText = 'margin-bottom:10px;';
            closeBtn.onclick = () => this.closePDF();
            container.appendChild(closeBtn);
            
            container.appendChild(iframe);
            container.style.display = 'block';

        } catch (error) {
            console.error('PDF Error:', error);
            container.innerHTML = `<div style="padding:20px;background:#fff1f0;border-radius:8px;"><p style="color:#f5222d;">PDF 生成失败?{error.message}</p></div>`;
        } finally {
            const tempContent = document.getElementById('pdf-content');
            if (tempContent) {
                tempContent.remove();
            }
        }
    },

    // 下载 PDF
    downloadPDF() {
        if (this.pdfBlob) {
            const filename = `电池测试报告_${this.currentRecord.testDate || new Date().toISOString().slice(0,10)}.pdf`;
            const link = document.createElement('a');
            link.href = URL.createObjectURL(this.pdfBlob);
            link.download = filename;
            link.click();
        }
    },

    // 关闭 PDF 预览
    closePDF() {
        const container = document.getElementById('pdf-container');
        container.innerHTML = '';
        container.style.display = 'none';
    },

    // 查看记录
    viewRecord(index) {
        const records = DataManager.getAllRecords();
        if (index >= 0 && index < records.length) {
            this.currentRecordIndex = index;
            this.currentRecord = JSON.parse(JSON.stringify(records[index]));
            
            document.getElementById('location').value = this.currentRecord.location || '';
            document.getElementById('test-date').value = this.currentRecord.testDate || '';
            document.getElementById('test-time').value = this.currentRecord.testTime || '';
            
            this.renderRecordInputs();
            document.getElementById('test-form').style.display = 'block';
            document.getElementById('pdf-container').style.display = 'none';
        }
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    BatteryTestModule.init();
});

// 导出给全局使用
window.batteryModule = BatteryTestModule;


