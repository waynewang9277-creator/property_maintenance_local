// Main App - 应用主逻辑
const app = {
    currentRecordIndex: -1,
    currentRecord: null,
    pdfBlob: null,

    // Logo base64 (from logo.jpg in images folder)
    logoDataUri: 'data:image/jpeg;base64,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',

    init() {
        this.setDefaultDateTime();
        this.renderRecords();
    },

    // 分类数据
    categories: [
        { name: '强电维保', icon: '⚡', items: [
            { name: '应急装置电池放电测试', page: 'battery-test' },
            { name: '应急发电机保养', page: 'generator' },
            { name: '电容检查及测温', page: 'capacitor' },
            { name: '供电母排检查及测温', page: 'busbar' },
            { name: '强电间月度巡检', page: 'electric-room' },
            { name: '电梯逃生门检查', page: 'elevator-emergency' }
        ]},
        { name: '综合维修维保', icon: '🔧', items: [
            { name: '门禁故障维修', page: 'access-control' },
            { name: '照明维修', page: 'lighting' },
            { name: '墙面维修', page: 'wall-repair' }
        ]},
        { name: '弱电维保', icon: '📡', items: [
            { name: '监控故障维修', page: 'cctv' },
            { name: '对讲机维修', page: 'intercom' },
            { name: '网络故障排查', page: 'network' }
        ]},
        { name: '空调维保', icon: '❄️', items: [
            { name: '中央空调保养', page: 'central-ac' },
            { name: '分体空调维修', page: 'split-ac' }
        ]},
        { name: '给排水维保', icon: '💧', items: [
            { name: '水泵保养', page: 'pump' },
            { name: '管道维修', page: 'plumbing' },
            { name: '阀门更换', page: 'valve' }
        ]}
    ],

    // 跳转分类页
    goToCategory(index) {
        this.currentCategory = this.categories[index];
        const title = document.getElementById('category-title');
        title.textContent = this.currentCategory.name;
        
        const list = document.getElementById('item-list');
        let html = '';
        this.currentCategory.items.forEach((item, i) => {
            html += `
                <div class="item-card" onclick="app.goToPage('${item.page}', '${item.name}')">
                    <span class="item-name">${item.name}</span>
                    <span class="item-arrow">›</span>
                </div>
            `;
        });
        list.innerHTML = html;
        
        document.getElementById('main-menu').classList.add('hidden');
        document.getElementById('category-page').classList.remove('hidden');
    },

    // 返回主页
    backToMain() {
        document.getElementById('category-page').classList.add('hidden');
        document.getElementById('main-menu').classList.remove('hidden');
    },

    // 跳转到具体项目页
    goToPage(pageName, pageTitle) {
        if (pageName === 'battery-test') {
            document.getElementById('category-page').classList.add('hidden');
            document.getElementById('battery-test-page').classList.remove('hidden');
            document.getElementById('test-form-title').textContent = pageTitle;
            this.setDefaultDateTime();
            document.getElementById('location').value = '';
            document.getElementById('records-input').innerHTML = '';
            document.getElementById('test-form').style.display = 'none';
            this.renderRecords();
        } else {
            alert('该模块暂未开放：' + pageTitle);
        }
    },

    // 返回分类页
    backToCategory() {
        document.getElementById('battery-test-page').classList.add('hidden');
        document.getElementById('category-page').classList.remove('hidden');
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
                <div class="record-item" onclick="app.viewRecord(${index})">
                    <div class="record-info">
                        <span class="record-location">${record.location || '未知地点'}</span>
                        <span class="record-date">${record.testDate || ''} ${record.testTime || ''}</span>
                    </div>
                    <div class="record-meta">
                        <span>${recordCount} 条记录</span>
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
        document.getElementById('test-form-title').textContent = '📝 新建测试';
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
        
        const index = this.currentRecord.records.length;
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
            const hasPhoto = record.photoData ? '✅' : '📷';
            html += `
                <div class="record-row">
                    <span class="row-num">${index + 1}</span>
                    <input type="number" class="voltage-input" 
                           value="${record.voltage}" 
                           placeholder="%"
                           min="0" max="100"
                           onchange="app.updateRecord(${index}, 'voltage', this.value)">
                    <button class="btn-photo" onclick="app.takePhoto(${index})" id="photo-btn-${index}">
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
            // 压缩图片到合适大小
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
            alert('请输入安装地点');
            return;
        }

        if (!this.currentRecord.records || this.currentRecord.records.length === 0) {
            alert('请添加至少一条记录');
            return;
        }

        // 保存数据
        this.currentRecord.location = location;
        this.currentRecord.testDate = testDate;
        this.currentRecord.testTime = testTime;

        // 保存到 localStorage
        if (this.currentRecordIndex >= 0) {
            DataManager.updateRecord(this.currentRecordIndex, this.currentRecord);
        } else {
            DataManager.addRecord(this.currentRecord);
        }

        // 显示加载状态
        document.getElementById('pdf-container').innerHTML = '<p style="text-align:center;padding:50px;">正在生成 PDF...</p>';

        // 创建 PDF 内容
        this.createPDFContent();
    },

    // 创建 PDF 内容区域 - 模仿原版格式
    createPDFContent() {
        const container = document.getElementById('pdf-container');
        
        // 清理旧内容
        container.innerHTML = '';
        
        // 创建隐藏的 PDF 内容区域（用于截图）
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

        // 顶部区域（Logo + 标题，左对齐）
        const topArea = document.createElement('div');
        topArea.style.cssText = 'position: relative; width: 100%; margin-bottom: 15px;';
        
        // Logo + 标题在同一行，标题居中
        const titleRow = document.createElement('div');
        titleRow.style.cssText = 'position: relative; width: 100%; margin-bottom: 10px;';
        
        // Logo 图片（左上角）
        if (this.logoDataUri) {
            const logoImg = document.createElement('img');
            logoImg.src = this.logoDataUri;
            logoImg.style.cssText = 'position: absolute; left: 0; top: 50%; transform: translateY(-50%); max-width: 100px; max-height: 50px;';
            logoImg.onload = () => {
                console.log('PDF Logo loaded successfully');
            };
            logoImg.onerror = () => {
                console.error('PDF Logo failed to load');
            };
            titleRow.appendChild(logoImg);
        }
        
        // 标题（居中）
        const title = document.createElement('div');
        title.style.cssText = `
            font-size: 16pt;
            font-weight: bold;
            text-align: center;
        `;
        title.textContent = '应急装置电池放电时间记录表';
        titleRow.appendChild(title);
        
        topArea.appendChild(titleRow);

        pdfContent.appendChild(topArea);

        // 分隔线
        const divider = document.createElement('div');
        divider.style.cssText = 'border-bottom: 2px solid #333; margin-bottom: 10px;';
        pdfContent.appendChild(divider);

        // 信息行
        const infoRow = document.createElement('div');
        infoRow.style.cssText = 'display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 9pt;';
        infoRow.innerHTML = `
            <span><strong>安装地点：</strong>${this.escapeHtml(this.currentRecord.location)}</span>
            <span><strong>开始时间：</strong>${this.escapeHtml(this.currentRecord.testDate)} ${this.escapeHtml(this.currentRecord.testTime)}</span>
        `;
        pdfContent.appendChild(infoRow);

        // 表格
        const table = document.createElement('table');
        table.style.cssText = 'width: 100%; border-collapse: collapse; font-size: 9pt; margin-bottom: 15px;';
        
        // 表头
        const thead = document.createElement('thead');
        thead.innerHTML = `
            <tr style="background: #e6e6e6;">
                <th style="border: 1px solid #333; padding: 6px; width: 12mm; text-align: center;">序号</th>
                <th style="border: 1px solid #333; padding: 6px; width: 50mm; text-align: center;">应急装置安装地点</th>
                <th style="border: 1px solid #333; padding: 6px; width: 28mm; text-align: center;">放电时间</th>
                <th style="border: 1px solid #333; padding: 6px; width: 32mm; text-align: center;">剩余电量%</th>
                <th style="border: 1px solid #333; padding: 6px; width: 26mm; text-align: center;">备注</th>
            </tr>
        `;
        table.appendChild(thead);

        // 表体 - 7行数据（原版格式）
        const tbody = document.createElement('tbody');
        const TIME_POINTS = ['0分钟', '20分钟', '40分钟', '60分钟', '80分钟', '100分钟', '120分钟'];
        
        for (let i = 0; i < 7; i++) {
            const record = this.currentRecord.records[i] || {};
            const voltage = record.voltage || '';
            const photoData = record.photoData || '';
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td style="border: 1px solid #333; padding: 6px; text-align: center; height: 8mm;">${i + 1}</td>
                <td style="border: 1px solid #333; padding: 6px; text-align: center; height: 8mm;">${i === 0 ? this.escapeHtml(this.currentRecord.location) : ''}</td>
                <td style="border: 1px solid #333; padding: 6px; text-align: center; height: 8mm;">${TIME_POINTS[i]}</td>
                <td style="border: 1px solid #333; padding: 6px; text-align: center; height: 8mm;">${this.escapeHtml(voltage)}</td>
                <td style="border: 1px solid #333; padding: 6px; text-align: center; height: 8mm;">${i === 0 ? this.escapeHtml(this.currentRecord.testDate + ' ' + this.currentRecord.testTime) : ''}</td>
            `;
            tbody.appendChild(row);
        }
        table.appendChild(tbody);
        pdfContent.appendChild(table);

        // 照片区域标题
        const hasPhotos = this.currentRecord.records.some(r => r.photoData);
        if (hasPhotos) {
            const photoTitle = document.createElement('div');
            photoTitle.style.cssText = 'font-size: 10pt; font-weight: bold; margin: 10px 0 8px 0;';
            photoTitle.textContent = '放电测试照片记录';
            pdfContent.appendChild(photoTitle);

            // 照片网格（2行3列）
            const photoGrid = document.createElement('div');
            photoGrid.style.cssText = 'display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 15px;';
            
            this.currentRecord.records.forEach((record, index) => {
                if (record.photoData) {
                    const photoCell = document.createElement('div');
                    photoCell.style.cssText = 'border: 1px solid #ccc; padding: 4px; text-align: center;';
                    
                    // 使用 object-fit: cover 保持比例填充，避免压扁
                    const imgWrapper = document.createElement('div');
                    imgWrapper.style.cssText = 'width: 100%; height: 44mm; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #f5f5f5;';
                    
                    const img = document.createElement('img');
                    img.src = record.photoData;
                    img.style.cssText = 'max-width: 100%; max-height: 100%; object-fit: contain;';
                    imgWrapper.appendChild(img);
                    photoCell.appendChild(imgWrapper);
                    
                    // 标签
                    const label = document.createElement('div');
                    label.style.cssText = 'font-size: 8pt; color: #666; margin-top: 4px;';
                    label.textContent = `${index * 20}分钟 - ${record.voltage || '?'}%`;
                    photoCell.appendChild(label);

                    photoGrid.appendChild(photoCell);
                }
            });
            pdfContent.appendChild(photoGrid);
        }

        // 签字栏
        const sigArea = document.createElement('div');
        sigArea.style.cssText = 'margin-top: 25px; page-break-inside: avoid;';
        sigArea.innerHTML = `
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
        `;
        pdfContent.appendChild(sigArea);

        // 表单编号
        const formNo = document.createElement('div');
        formNo.style.cssText = 'margin-top: 15px; font-size: 7pt; color: #999;';
        formNo.textContent = 'SHKS/R0/2579/REV03/20240630';
        pdfContent.appendChild(formNo);

        document.body.appendChild(pdfContent);

        // 使用 html2canvas + jsPDF 生成
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
            // 使用较高分辨率截图
            const canvas = await html2canvas(pdfContent, {
                scale: 3,  // 提高分辨率
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff',
                width: 210 * 3.78,  // 210mm * 3.78 pixels/mm
                windowWidth: 794  // ~210mm at 96dpi
            });

            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');

            const imgData = canvas.toDataURL('image/jpeg', 0.95);
            const pageWidth = 210;
            const pageHeight = 297;

            // 计算图片比例
            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * pageWidth) / canvas.width;

            // 只添加必要的页面
            const pagesNeeded = Math.ceil(imgHeight / pageHeight);
            
            for (let i = 0; i < pagesNeeded; i++) {
                if (i > 0) {
                    pdf.addPage();
                }
                
                const yOffset = -i * pageHeight;
                pdf.addImage(imgData, 'JPEG', 0, yOffset, imgWidth, imgHeight);
            }

            // 保存 PDF
            this.pdfBlob = pdf.output('blob');
            
            // 显示预览
            const pdfUrl = URL.createObjectURL(this.pdfBlob);
            const iframe = document.createElement('iframe');
            iframe.src = pdfUrl;
            iframe.style.cssText = 'width:100%; height:500px; border:none; border-radius:6px;';
            
            container.innerHTML = '';
            
            // 添加关闭按钮
            const closeBtn = document.createElement('button');
            closeBtn.textContent = '✖ 关闭预览';
            closeBtn.className = 'btn btn-outline';
            closeBtn.style.cssText = 'margin-bottom:10px;';
            closeBtn.onclick = () => this.closePDF();
            container.appendChild(closeBtn);
            
            container.appendChild(iframe);
            container.style.display = 'block';

        } catch (error) {
            console.error('PDF Error:', error);
            container.innerHTML = `
                <div style="padding:20px;background:#fff1f0;border-radius:8px;">
                    <p style="color:#f5222d;">PDF 生成失败：${error.message}</p>
                </div>
            `;
        } finally {
            // 清理临时元素
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

    // 返回列表
    backToList() {
        this.renderRecords();
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
            document.getElementById('test-form-title').textContent = '📝 查看测试';
            document.getElementById('pdf-container').style.display = 'none';
        }
    },

    // 显示区块
    showSection(sectionId) {
        const sections = ['test-form', 'report-preview'];
        sections.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.classList.toggle('hidden', id !== sectionId);
            }
        });
    }
};

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// 导出给全局使用
window.app = app;