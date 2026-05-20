// Capacitor Check Module - 电容检查及测温记录
// Uses NEW combined template: Sheet1=数据工作记录, Sheet2=数据工作图片记录

const CapacitorModule = {
    // All 36 locations
    LOCATIONS: [
        { id: 1, name: '商业三 Tx-M1-3', row: 5 },
        { id: 2, name: '商业三 Tx-M1-4', row: 6 },
        { id: 3, name: '商业三 Tx-M2-2', row: 7 },
        { id: 4, name: '商业三 Tx-M2-3', row: 8 },
        { id: 5, name: '商业四 Tx-R(S)5-2', row: 9 },
        { id: 6, name: '商业四 Tx-R(S)5-3', row: 10 },
        { id: 7, name: '商业四 Tx-R(S)6-2', row: 11 },
        { id: 8, name: '商业四 Tx-R(S)6-3', row: 12 },
        { id: 9, name: '商业五 Tx-R(S)1-2', row: 13 },
        { id: 10, name: '商业五 Tx-R(S)1-3', row: 14 },
        { id: 11, name: '商业五 Tx-R(S)2-2', row: 15 },
        { id: 12, name: '商业五 Tx-R(S)2-3', row: 16 },
        { id: 13, name: '商业五 Tx-R(S)3-2', row: 17 },
        { id: 14, name: '商业五 Tx-R(S)3-3', row: 18 },
        { id: 15, name: '商业五 Tx-R(S)4-2', row: 19 },
        { id: 16, name: '商业五 Tx-R(S)4-3', row: 20 },
        { id: 17, name: '商业五 Tx-R(S)7-2', row: 21 },
        { id: 18, name: '商业五 Tx-R(S)7-3', row: 22 },
        { id: 19, name: '商业五 Tx-R(S)8-2', row: 23 },
        { id: 20, name: '商业五 Tx-R(S)8-3', row: 24 },
        { id: 21, name: 'T18站 Tx-01-2', row: 25 },
        { id: 22, name: 'T18站 Tx-01-3', row: 26 },
        { id: 23, name: 'T18站 Tx-02-2', row: 27 },
        { id: 24, name: 'T18站 Tx-02-3', row: 28 },
        { id: 25, name: 'T18站 Tx-03-2', row: 29 },
        { id: 26, name: 'T18站 Tx-03-3', row: 30 },
        { id: 27, name: 'T18站 Tx-04-2', row: 31 },
        { id: 28, name: 'T18站 Tx-04-3', row: 32 },
        { id: 29, name: 'T15站 SA5-1-2', row: 33 },
        { id: 30, name: 'T15站 SA6-1-2', row: 34 },
        { id: 31, name: 'T15站 SA7-1-2', row: 35 },
        { id: 32, name: 'T15站 SA8-1-2', row: 36 },
        { id: 33, name: 'T16A站 SA1-1-2', row: 37 },
        { id: 34, name: 'T16A站 SA2-1-2', row: 38 },
        { id: 35, name: 'T16B站 SA4-1-2', row: 39 },
        { id: 36, name: 'T16B站 SA3-1-2', row: 40 }
    ],

    expandedLocations: [],
    completedLocations: [],
    locationChecks: {},
    locationPhotos: {},

    init() {
        this.bindEvents();
        this.renderLocationGrid();
        const today = new Date().toISOString().slice(0, 10);
        document.getElementById('check-date').value = today;
    },

    bindEvents() {
        document.getElementById('btn-generate').addEventListener('click', () => this.generateExcel());
        document.getElementById('btn-clear').addEventListener('click', () => this.clearForm());
        document.getElementById('btn-back').addEventListener('click', () => this.goBack());
    },

    renderLocationGrid() {
        const grid = document.getElementById('location-grid');
        let html = '';
        this.LOCATIONS.forEach(loc => {
            const isExpanded = this.expandedLocations.includes(loc.id);
            const isCompleted = this.completedLocations.includes(loc.id);
            let className = 'location-item';
            if (isExpanded) className += ' expanded';
            if (isCompleted) className += ' completed';
            html += `
                <div class="${className}" data-id="${loc.id}" onclick="CapacitorModule.toggleLocation(${loc.id})">
                    <div class="loc-header">
                        <span class="loc-name">${loc.id}. ${loc.name}</span>
                        <span class="loc-toggle ${isExpanded ? 'expanded' : ''}">▶</span>
                    </div>
                    ${isCompleted ? '<div class="loc-status">✅ 已完成</div>' : ''}
                    <div class="check-content">${this.renderCheckItems(loc.id)}</div>
                </div>`;
        });
        grid.innerHTML = html;
        this.updateCompletedCount();
    },

    renderCheckItems(locId) {
        const checks = [
            '分合闸主开关状态正常',
            '母排、电缆及线路无发热变色破损',
            '安全保护接地可靠',
            '电容无漏液投切正常',
            '电柜清洁无杂物',
            '保险管导通无熔断',
            '红外线成像检查'
        ];
        const stored = this.locationChecks[locId] || {};
        const hasPhoto = !!this.locationPhotos[locId];
        const isCompleted = this.completedLocations.includes(locId);
        
        let html = checks.map((text, idx) => {
            const val = stored['check' + (idx + 1)] || 'Y';
            return `<div class="check-row">
                <div class="check-num">${idx + 1}</div>
                <div class="check-text">${text}</div>
                <div class="check-options">
                    <label onclick="event.stopPropagation()">
                        <input type="radio" name="check${idx + 1}-${locId}" value="Y" ${val === 'Y' ? 'checked' : ''} onchange="CapacitorModule.setCheck(${locId}, ${idx + 1}, 'Y')"><span>√</span>
                    </label>
                    <label onclick="event.stopPropagation()">
                        <input type="radio" name="check${idx + 1}-${locId}" value="N" ${val === 'N' ? 'checked' : ''} onchange="CapacitorModule.setCheck(${locId}, ${idx + 1}, 'N')"><span>×</span>
                    </label>
                </div>
            </div>`;
        }).join('');
        
        html += `<div class="photo-section" onclick="event.stopPropagation()">
            <label class="photo-label">📷 热成像照片：</label>
            <div class="photo-upload-area ${hasPhoto ? 'has-photo' : ''}" id="photo-area-${locId}" onclick="CapacitorModule.triggerPhotoUpload(${locId})">
                <input type="file" accept="image/*" id="photo-input-${locId}" onchange="CapacitorModule.handlePhoto(this, ${locId})" style="display:none;">
                <div class="photo-icon">📷</div>
                <div class="photo-hint">${hasPhoto ? '已上传，点击可更换' : '点击上传热成像照片'}</div>
                ${hasPhoto ? `<img src="${this.locationPhotos[locId]}" class="photo-preview" alt="热成像照片">` : ''}
            </div>
        </div>`;
        
        html += `<div class="complete-section" onclick="event.stopPropagation()">
            ${isCompleted ? `
                <button class="btn-undo" onclick="CapacitorModule.undoComplete(${locId})">↩️ 撤销完成</button>
                <span style="flex:1;color:#4CAF50;font-weight:bold;">✅ 检查已完成</span>
            ` : `
                <button class="btn-complete" onclick="CapacitorModule.completeLocation(${locId})" ${!hasPhoto ? 'disabled' : ''}>✅ 完成检查</button>
            `}
        </div>`;
        return html;
    },

    toggleLocation(id) {
        event.stopPropagation();
        const idx = this.expandedLocations.indexOf(id);
        if (idx === -1) this.expandedLocations.push(id);
        else this.expandedLocations.splice(idx, 1);
        this.renderLocationGrid();
    },

    setCheck(locId, checkNum, value) {
        if (!this.locationChecks[locId]) this.locationChecks[locId] = {};
        this.locationChecks[locId]['check' + checkNum] = value;
    },

    triggerPhotoUpload(locId) {
        const input = document.getElementById('photo-input-' + locId);
        if (input) input.click();
    },

    handlePhoto(input, locId) {
        const file = input.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            this.locationPhotos[locId] = e.target.result;
            this.renderLocationGrid();
        };
        reader.readAsDataURL(file);
    },

    completeLocation(locId) {
        if (!this.locationPhotos[locId]) {
            alert('请先上传热成像照片');
            return;
        }
        if (!this.completedLocations.includes(locId)) {
            this.completedLocations.push(locId);
        }
        this.renderLocationGrid();
        this.updateCompletedSummary();
    },

    undoComplete(locId) {
        const idx = this.completedLocations.indexOf(locId);
        if (idx !== -1) this.completedLocations.splice(idx, 1);
        this.renderLocationGrid();
        this.updateCompletedSummary();
    },

    updateCompletedCount() {
        const countEl = document.getElementById('completed-count');
        const btn = document.getElementById('btn-generate');
        const count = this.completedLocations.length;
        if (count > 0) {
            countEl.textContent = `✅ 已完成 ${count} 个位置`;
            btn.disabled = false;
            btn.textContent = `📥 生成报告（${count}个位置）`;
        } else {
            countEl.textContent = '';
            btn.disabled = true;
            btn.textContent = '📥 生成报告（需先完成检查）';
        }
    },

    updateCompletedSummary() {
        const summaryEl = document.getElementById('selected-summary');
        const locationsEl = document.getElementById('selected-locations');
        if (this.completedLocations.length === 0) {
            summaryEl.classList.remove('visible');
        } else {
            summaryEl.classList.add('visible');
            const names = this.completedLocations.map(id => {
                const loc = this.LOCATIONS.find(l => l.id === id);
                return loc ? `${loc.id}. ${loc.name}` : '';
            });
            locationsEl.textContent = names.join('、 ');
        }
        this.updateCompletedCount();
    },

    formatDate(dateStr) {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
    },

    base64ToUint8Array(base64) {
        const base64Data = base64.split(',')[1] || base64;
        const binaryString = atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        return bytes;
    },

    colLetterToIndex(col) {
        let idx = 0;
        for (let i = 0; i < col.length; i++) idx = idx * 26 + (col.charCodeAt(i) - 'A'.charCodeAt(0) + 1);
        return idx - 1;
    },

    async generateExcel() {
        if (this.completedLocations.length === 0) {
            alert('没有已完成检查的位置');
            return;
        }
        const inspector = document.getElementById('inspector').value.trim();
        if (!inspector) {
            alert('请输入检查人姓名');
            return;
        }
        const checkDate = document.getElementById('check-date').value;
        if (!checkDate) {
            alert('请选择检测日期');
            return;
        }
        document.getElementById('loading-overlay').style.display = 'flex';

        try {
            const JSZip = window.JSZip;
            const parser = new DOMParser();
            const ns = { x: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main' };

            // ==================== SINGLE COMBINED FILE (NEW TEMPLATE) ====================
            const response = await fetch('../../assets/templates/capacitor_template_new.xlsx');
            const buffer = await response.arrayBuffer();
            const zip = await JSZip.loadAsync(buffer);

            // ---- SHEET1: 填数据 ----
            const sheet1Xml = await zip.file('xl/worksheets/sheet1.xml').async('string');
            const xmlDoc = parser.parseFromString(sheet1Xml, 'text/xml');

            const setCellValue = (doc, cellRef, value) => {
                let cell = doc.querySelector(`c[r="${cellRef}"]`);
                if (!cell) return;
                cell.removeAttribute('t');
                let v = cell.querySelector('v');
                if (!v) { v = doc.createElementNS(ns.x, 'v'); cell.appendChild(v); }
                v.textContent = value;
            };

            // 填检查结果数据 (C:I 列 = 7项检查)
            const checkCols = ['C', 'D', 'E', 'F', 'G', 'H', 'I'];
            this.completedLocations.forEach(id => {
                const loc = this.LOCATIONS.find(l => l.id === id);
                if (!loc) return;
                const row = loc.row;
                const checks = this.locationChecks[id] || {};
                for (let i = 1; i <= 7; i++) {
                    const val = checks['check' + i] || 'Y';
                    setCellValue(xmlDoc, `${checkCols[i - 1]}${row}`, val === 'Y' ? '√' : '×');
                }
                // J=检查人, K=日期 (Sheet1的K3已有日期标签)
                setCellValue(xmlDoc, `J${row}`, inspector);
                setCellValue(xmlDoc, `K${row}`, this.formatDate(checkDate));
            });

            const serializer = new XMLSerializer();
            zip.file('xl/worksheets/sheet1.xml', serializer.serializeToString(xmlDoc));

            // ---- SHEET2: 填照片 ----
            // 照片列: B/D/F/H/J (= 0-indexed col 1/3/5/7/9)
            // 行=4 + floor((locId-1)/5) => locId 1→row5, 2→row5, ..., 5→row6...
            const photoColMap = [1, 3, 5, 7, 9]; // B=1, D=3, F=5, H=7, J=9

            let photoCount = 0;
            for (const locId of this.completedLocations) {
                const photoData = this.locationPhotos[locId];
                if (!photoData) continue;
                photoCount++;
                zip.file(`xl/media/photo_${locId}.png`, this.base64ToUint8Array(photoData));
            }

            if (photoCount > 0) {
                // Build drawing XML for sheet2 (photos in B/D/F/H/J cols)
                let wsDrContent = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
                    `<wsDr xmlns="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing">`;
                let drawingRels = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
                    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`;

                let imgIdx = 1;
                for (const locId of this.completedLocations) {
                    const photoData = this.locationPhotos[locId];
                    if (!photoData) continue;

                    const pos0Based = locId - 1;
                    const row = 4 + Math.floor(pos0Based / 5);
                    const colIdx = pos0Based % 5;
                    const col = photoColMap[colIdx];

                    drawingRels += `<Relationship Id="rId${imgIdx}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="/xl/media/photo_${locId}.png"/>`;

                    // oneCellAnchor + editAs=oneCell tells Excel to keep image within cell
                    // Fixed size: 3.2cm wide × 3.4cm tall (1 cm = 914400 EMU)
                    // No cstate="print" so image renders at full quality
                    wsDrContent += `<oneCellAnchor editAs="oneCell">` +
                        `<from><col>${col}</col><colOff>0</colOff><row>${row}</row><rowOff>0</rowOff></from>` +
                        `<ext cx="1124712" cy="1216152"/>` +
                        `<pic>` +
                        `<nvPicPr><cNvPr id="${imgIdx}" name="Photo${locId}" descr="Photo"/><cNvPicPr/></nvPicPr>` +
                        `<blipFill>` +
                        `<a:blip xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="rId${imgIdx}"/>` +
                        `<a:stretch xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:fillRect/></a:stretch>` +
                        `</blipFill>` +
                        `<spPr><a:prstGeom xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" prst="rect"/></spPr>` +
                        `</pic>` +
                        `<clientData/>` +
                        `</oneCellAnchor>`;

                    imgIdx++;
                }
                wsDrContent += '</wsDr>';
                drawingRels += '</Relationships>';

                zip.file('xl/drawings/drawing1.xml', wsDrContent);
                zip.file('xl/drawings/_rels/drawing1.xml.rels', drawingRels);

                // Update Content_Types.xml
                const ctContent = await zip.file('[Content_Types].xml').async('string');
                if (ctContent.indexOf('drawing') === -1) {
                    zip.file('[Content_Types].xml', ctContent.replace('</Types>',
                        `<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/></Types>`));
                }

                // Create sheet2.xml.rels (drawing relationship for sheet2)
                zip.file('xl/worksheets/_rels/sheet2.xml.rels',
                    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>` +
                    `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">` +
                    `<Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="/xl/drawings/drawing1.xml" Id="rId1"/>` +
                    `</Relationships>`);

                // Inject <drawing r:id="rId1"/> into sheet2.xml (before </worksheet>)
                const sheet2Xml = await zip.file('xl/worksheets/sheet2.xml').async('string');
                const sheet2WithDrawing = sheet2Xml.replace('</worksheet>',
                    `<drawing r:id="rId1"/></worksheet>`);
                zip.file('xl/worksheets/sheet2.xml', sheet2WithDrawing);
            }

            // 生成并下载
            const excelBuffer = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
            const url = URL.createObjectURL(excelBuffer);
            const link = document.createElement('a');
            link.download = `电容检查记录_${checkDate}.xlsx`;
            link.href = url;
            link.click();
            URL.revokeObjectURL(url);

            document.getElementById('loading-overlay').style.display = 'none';
            alert(`报告生成完成！\n已生成：电容检查记录_${checkDate}.xlsx`);

        } catch (error) {
            console.error('生成失败:', error);
            document.getElementById('loading-overlay').style.display = 'none';
            alert('生成失败: ' + error.message);
        }
    },

    clearForm() {
        this.expandedLocations = [];
        this.completedLocations = [];
        this.locationChecks = {};
        this.locationPhotos = {};
        this.renderLocationGrid();
        this.updateCompletedSummary();
        document.getElementById('inspector').value = '';
        document.getElementById('check-date').value = new Date().toISOString().slice(0, 10);
    },

    goBack() {
        if (parent.app && parent.app.backToCategory) parent.app.backToCategory();
        else window.location.href = '../../index.html';
    }
};

document.addEventListener('DOMContentLoaded', () => {
    CapacitorModule.init();
});

window.CapacitorModule = CapacitorModule;
