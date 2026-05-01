// Elevator Fault Report Module - 电梯月度故障报告

const FaultModule = {
    currentTab: 'report',
    currentBuilding: 'office',
    selectedYear: 2026,
    selectedMonth: null,
    selectedDate: null,
    expandedDevice: null,

    FAULT_TYPES: [
        { code: 'A', label: '困人' },
        { code: 'B', label: '电梯门故障' },
        { code: 'C', label: '操作手按钮故障' },
        { code: 'D', label: '电梯不停站' },
        { code: 'E', label: '电梯轿箱与楼板地平不平' },
        { code: 'F', label: '有异常声响' },
        { code: 'G', label: '其他（注明原因）' },
        { code: 'H', label: '保养停机' }
    ],

    OFFICE_DEVICES: [
        { id: 'P01', name: 'P01' }, { id: 'P02', name: 'P02' },
        { id: 'L01', name: 'L01' }, { id: 'L02', name: 'L02' },
        { id: 'L03', name: 'L03' }, { id: 'L04', name: 'L04' },
        { id: 'L05', name: 'L05' }, { id: 'L06', name: 'L06' },
        { id: 'L07', name: 'L07' }, { id: 'L08', name: 'L08' },
        { id: 'L09', name: 'L09' }, { id: 'L10', name: 'L10' },
        { id: 'S01', name: 'S01' }, { id: 'S02', name: 'S02' },
        { id: 'E03', name: 'E03' }, { id: 'E04', name: 'E04' }
    ],

    MALL_DEVICES_P: [
        { id: 'P1', name: 'P1' }, { id: 'P2', name: 'P2' }, { id: 'P3', name: 'P3' },
        { id: 'P4', name: 'P4' }, { id: 'P5', name: 'P5' }, { id: 'P6', name: 'P6' },
        { id: 'P7', name: 'P7' }, { id: 'P8', name: 'P8' }, { id: 'P9', name: 'P9' },
        { id: 'P10', name: 'P10' }, { id: 'P11', name: 'P11' }, { id: 'P12', name: 'P12' },
        { id: 'P13', name: 'P13' }, { id: 'P14', name: 'P14' }, { id: 'P15', name: 'P15' },
        { id: 'P16', name: 'P16' }, { id: 'P17', name: 'P17' }
    ],

    MALL_DEVICES_E: [
        { id: 'E7', name: 'E7' }, { id: 'E8', name: 'E8' }, { id: 'E9', name: 'E9' },
        { id: 'E10', name: 'E10' }, { id: 'E11', name: 'E11' }, { id: 'E12', name: 'E12' },
        { id: 'E13', name: 'E13' }, { id: 'E14', name: 'E14' }, { id: 'E15', name: 'E15' },
        { id: 'E16', name: 'E16' }, { id: 'E17', name: 'E17' }, { id: 'E18', name: 'E18' },
        { id: 'E19', name: 'E19' }, { id: 'E20', name: 'E20' }, { id: 'E21', name: 'E21' },
        { id: 'E22', name: 'E22' }, { id: 'E23', name: 'E23' }, { id: 'E24', name: 'E24' },
        { id: 'E25', name: 'E25' }, { id: 'E26', name: 'E26' }
    ],

    // records: { "date_deviceId" -> "A/B/G" }
    records: {},
    // remarks: { "date_deviceId" -> "" }
    remarks: {},
    // faultDescs: { "date_deviceId_faultCode" -> "description" }
    faultDescs: {},
    // faultTimes: { "date_deviceId_faultCode" -> { reportHour, reportMinute, rescueHour, rescueMinute, isNotTrapped, arrivalDate, arrivalHour, arrivalMinute, inspectionResult }
    faultTimes: {},
    expandedDates: [],
    // Statistics tab state
    expandedStatItems: [],

    init: function() {
        window.FaultModule = this;
        this.selectedYear = new Date().getFullYear();
        this.renderMonthGrid();
        this.renderDateGrid();
        this.updateSummary();
    },

    renderMonthGrid: function() {
        var grid = document.getElementById('month-grid');
        if (!grid) return;
        var yearEl = document.getElementById('picker-year');
        if (yearEl) yearEl.textContent = this.selectedYear + '年';
        var months = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];
        var html = '';
        for (var m = 1; m <= 12; m++) {
            var sel = (this.selectedMonth === m) ? ' selected' : '';
            html += '<div class="month-picker-cell' + sel + '" onclick="FaultModule.selectMonth(' + m + ')">' + months[m-1] + '</div>';
        }
        grid.innerHTML = html;
    },

    selectMonth: function(m) {
        this.selectedMonth = m;
        this.expandedDates = [];
        this.expandedDevice = null;
        this.renderMonthGrid();
        this.renderDateGrid();
    },

    prevYear: function() {
        this.selectedYear--;
        this.selectedMonth = null;
        this.renderMonthGrid();
    },

    nextYear: function() {
        this.selectedYear++;
        this.selectedMonth = null;
        this.renderMonthGrid();
    },

    switchTab: function(tab) {
        this.currentTab = tab;
        var btns = document.querySelectorAll('.tab-btn');
        for (var i = 0; i < btns.length; i++) {
            btns[i].classList.toggle('active', btns[i].id === 'tab-' + tab);
        }
        var contents = document.querySelectorAll('.tab-content');
        for (var j = 0; j < contents.length; j++) {
            contents[j].classList.toggle('active', contents[j].id === 'content-' + tab);
        }
        if (tab === 'stat') {
            this.renderStatContent();
        }
    },

    getCurrentDevices: function() {
        if (this.currentBuilding === 'office') {
            return this.OFFICE_DEVICES;
        } else {
            return this.MALL_DEVICES_P.concat(this.MALL_DEVICES_E);
        }
    },

    renderDateGrid: function() {
        var grid = document.getElementById('date-grid');
        if (!grid) return;
        if (!this.selectedMonth) {
            grid.innerHTML = '<div style="text-align:center;color:#999;padding:20px;font-size:12pt;">请先选择月份</div>';
            return;
        }
        var html = '<div class="date-grid">';
        for (var i = 1; i <= 31; i++) {
            var isExpanded = this.expandedDates.indexOf(i) !== -1;
            var hasRecords = this.dateHasRecords(i);
            var cls = 'date-cell' + (isExpanded ? ' expanded' : '') + (hasRecords ? ' has-record' : '');
            html += '<div class="' + cls + '" onclick="FaultModule.toggleDate(' + i + ')">' +
                '<span class="date-num">' + i + '</span>' +
                (hasRecords ? '<span class="date-dot">●</span>' : '') + '</div>';
        }
        html += '</div>';
        if (this.expandedDates.length > 0) {
            html += '<div class="device-section">' +
                '<div class="device-section-title">' + this.expandedDates[0] + '日设备</div>' +
                '<div class="device-grid" id="device-grid"></div>' +
                '<div id="fault-panel"></div></div>';
        }
        grid.innerHTML = html;
        if (this.expandedDates.length > 0) {
            this.renderDeviceGrid(this.expandedDates[0]);
        }
    },

    dateHasRecords: function(date) {
        var devs = this.getCurrentDevices();
        for (var i = 0; i < devs.length; i++) {
            if (this.records[date + '_' + devs[i].id]) return true;
        }
        return false;
    },

    toggleDate: function(date) {
        if (this.expandedDates.indexOf(date) !== -1) {
            this.expandedDates = [];
            this.expandedDevice = null;
        } else {
            this.expandedDates = [date];
            this.expandedDevice = null;
        }
        this.renderDateGrid();
    },

    renderDeviceGrid: function(date) {
        var grid = document.getElementById('device-grid');
        if (!grid) return;
        var devs = this.getCurrentDevices();
        var html = '';
        for (var i = 0; i < devs.length; i++) {
            var dev = devs[i];
            var key = date + '_' + dev.id;
            var code = this.records[key] || '';
            var isSelected = this.expandedDevice === dev.id;
            var cls = 'device-btn' + (isSelected ? ' selected' : '') + (code ? ' has-fault' : '');
            var rightText = code
                ? '<span class="device-btn-code">' + code + '</span>'
                : '<span class="device-btn-ok">正常</span>';
            html += '<div class="' + cls + '" onclick="FaultModule.selectDevice(\'' + dev.id + '\', ' + date + ')">' +
                '<span class="device-btn-name">' + dev.name + '</span>' + rightText + '</div>';
        }
        grid.innerHTML = html;
        this.renderFaultPanel(date);
    },

    selectDevice: function(deviceId, date) {
        this.expandedDevice = (this.expandedDevice === deviceId) ? null : deviceId;
        this.renderDeviceGrid(date);
    },

    renderFaultPanel: function(date) {
        var panel = document.getElementById('fault-panel');
        if (!panel) return;
        if (!this.expandedDevice) { panel.innerHTML = ''; return; }
        var key = date + '_' + this.expandedDevice;
        var code = this.records[key] || '';
        var dev = null;
        var devs = this.getCurrentDevices();
        for (var i = 0; i < devs.length; i++) {
            if (devs[i].id === this.expandedDevice) { dev = devs[i]; break; }
        }

        var html = '<div class="fault-panel">' +
            '<div class="fault-panel-title">' + (dev ? dev.name : '') + ' - 选择故障类型</div>' +
            '<div class="fault-buttons">';
        for (var j = 0; j < this.FAULT_TYPES.length; j++) {
            var f = this.FAULT_TYPES[j];
            var sel = code.indexOf(f.code) !== -1;
            html += '<button class="fault-btn' + (sel ? ' selected' : '') + '" onclick="FaultModule.toggleFault(\'' + this.expandedDevice + '\', ' + date + ', \'' + f.code + '\')">' + f.code + ':' + f.label + '</button>';
        }
        html += '</div>';

        // Per-fault-type description and time inputs
        html += '<div class="fault-desc-panel">';
        for (var k = 0; k < this.FAULT_TYPES.length; k++) {
            var ft = this.FAULT_TYPES[k];
            var descKey = key + '_' + ft.code;
            var descVal = this.faultDescs[descKey] || '';
            var timeData = this.faultTimes[descKey] || {};
            var isActive = code.indexOf(ft.code) !== -1;
            var rh = timeData.reportHour || '';
            var rm = timeData.reportMinute || '';
            var nth = timeData.rescueHour || '';
            var ntm = timeData.rescueMinute || '';
            var isNotTrapped = timeData.isNotTrapped || false;
            var ad = timeData.arrivalDate || '';
            var ath = timeData.arrivalHour || '';
            var atm = timeData.arrivalMinute || '';
            var safeKey = descKey.replace(/[^a-zA-Z0-9]/g, '_');

            html += '<div class="fault-desc-row' + (isActive ? ' active' : '') + '" ' + (isActive ? '' : 'style="display:none"') + '>' +
                '<div class="fault-item-header" onclick="FaultModule.toggleFaultDetail(\'' + safeKey + '\')">' +
                '<span class="fault-desc-label">' + ft.code + ':' + ft.label + '</span>' +
                '<span class="fault-detail-toggle" id="toggle_' + safeKey + '">' + (descVal || rh ? '▼ 详情' : '▶ 填写') + '</span></div>' +
                '<div class="fault-detail-form" id="detail_' + safeKey + '" style="display:none; margin-top:8px;">' +
                '<div class="fault-time-row"><span class="time-label">报修时间:</span>' +
                '<input type="number" class="time-input hour" min="0" max="23" placeholder="时" value="' + rh + '" onchange="FaultModule.setFaultTime(\'' + this.expandedDevice + '\', ' + date + ', \'' + ft.code + '\', \'reportHour\', this.value)">' +
                '<span class="time-sep">:</span>' +
                '<input type="number" class="time-input minute" min="0" max="59" placeholder="分" value="' + rm + '" onchange="FaultModule.setFaultTime(\'' + this.expandedDevice + '\', ' + date + ', \'' + ft.code + '\', \'reportMinute\', this.value)">' +
                '</div>' +
                '<div class="fault-time-row"><span class="time-label">解困时间:</span>' +
                '<input type="number" class="time-input hour" min="0" max="23" placeholder="时" value="' + nth + '" onchange="FaultModule.setFaultTime(\'' + this.expandedDevice + '\', ' + date + ', \'' + ft.code + '\', \'rescueHour\', this.value)">' +
                '<span class="time-sep">:</span>' +
                '<input type="number" class="time-input minute" min="0" max="59" placeholder="分" value="' + ntm + '" onchange="FaultModule.setFaultTime(\'' + this.expandedDevice + '\', ' + date + ', \'' + ft.code + '\', \'rescueMinute\', this.value)">' +
                '<label class="not-trapped-label"><input type="checkbox" ' + (isNotTrapped ? 'checked' : '') + ' onchange="FaultModule.setFaultTime(\'' + this.expandedDevice + '\', ' + date + ', \'' + ft.code + '\', \'isNotTrapped\', this.checked)"> 未困人</label>' +
                '</div>' +
                '<div class="fault-time-row"><span class="time-label">到场时间:</span>' +
                '<input type="number" class="time-input day" min="1" max="31" placeholder="日" value="' + ad + '" onchange="FaultModule.setFaultTime(\'' + this.expandedDevice + '\', ' + date + ', \'' + ft.code + '\', \'arrivalDate\', this.value)">' +
                '<input type="number" class="time-input hour" min="0" max="23" placeholder="时" value="' + ath + '" onchange="FaultModule.setFaultTime(\'' + this.expandedDevice + '\', ' + date + ', \'' + ft.code + '\', \'arrivalHour\', this.value)">' +
                '<span class="time-sep">:</span>' +
                '<input type="number" class="time-input minute" min="0" max="59" placeholder="分" value="' + atm + '" onchange="FaultModule.setFaultTime(\'' + this.expandedDevice + '\', ' + date + ', \'' + ft.code + '\', \'arrivalMinute\', this.value)">' +
                '</div>' +
                '<div class="fault-desc-row-inline"><span class="time-label">故障描述:</span>' +
                '<input type="text" class="fault-desc-input" placeholder="描述(选填)" value="' + descVal + '" ' +
                'onchange="FaultModule.setFaultDesc(\'' + this.expandedDevice + '\', ' + date + ', \'' + ft.code + '\', this.value)">' +
                '</div>' +
                '<div class="fault-desc-row-inline"><span class="time-label">检查结果:</span>' +
                '<input type="text" class="fault-desc-input" placeholder="检查结果(选填)" value="' + (timeData.inspectionResult || '') + '" ' +
                'onchange="FaultModule.setFaultTime(\'' + this.expandedDevice + '\', ' + date + ', \'' + ft.code + '\', \'inspectionResult\', this.value)">' +
                '</div></div></div>';
        }
        html += '</div></div>';
        panel.innerHTML = html;
    },

    toggleFaultDetail: function(safeKey) {
        var el = document.getElementById('detail_' + safeKey);
        var toggle = document.getElementById('toggle_' + safeKey);
        if (!el) return;
        var isHidden = el.style.display === 'none';
        el.style.display = isHidden ? 'block' : 'none';
        if (toggle) toggle.textContent = isHidden ? '▼ 详情' : '▶ 填写';
    },

    setFaultTime: function(deviceId, date, fcode, field, value) {
        var key = date + '_' + deviceId + '_' + fcode;
        if (!this.faultTimes[key]) this.faultTimes[key] = {};
        this.faultTimes[key][field] = value;
    },

    toggleFault: function(deviceId, date, fcode) {
        var key = date + '_' + deviceId;
        var current = this.records[key] || '';
        if (current.indexOf(fcode) !== -1) {
            current = current.split('/').filter(function(c) { return c !== fcode; }).join('/');
            delete this.faultDescs[key + '_' + fcode];
        } else {
            if (current) current += '/';
            current += fcode;
        }
        this.records[key] = current;
        this.renderDeviceGrid(date);
        this.renderDateGrid();
        this.updateSummary();
    },

    setFaultDesc: function(deviceId, date, fcode, value) {
        var key = date + '_' + deviceId;
        var descKey = key + '_' + fcode;
        if (value) {
            this.faultDescs[descKey] = value;
        } else {
            delete this.faultDescs[descKey];
        }
    },

    switchBuilding: function(type) {
        this.currentBuilding = type;
        this.expandedDates = [];
        this.expandedDevice = null;
        var btns = document.querySelectorAll('.building-btn');
        for (var i = 0; i < btns.length; i++) {
            var txt = btns[i].textContent;
            var isActive = (type === 'office' && txt.indexOf('办公') !== -1) || (type === 'mall' && txt.indexOf('商场') !== -1);
            btns[i].classList.toggle('active', isActive);
        }
        this.renderDateGrid();
    },

    clearAll: function() {
        this.records = {};
        this.remarks = {};
        this.faultDescs = {};
        this.faultTimes = {};
        this.expandedDates = [];
        this.expandedDevice = null;
        this.renderDateGrid();
        this.updateSummary();
    },

    updateSummary: function() {
        var countEl = document.getElementById('record-count');
        var devicesEl = document.getElementById('record-devices');
        var count = 0;
        var deviceSet = {};
        for (var k in this.records) {
            if (this.records[k]) { count++; deviceSet[k.split('_')[1]] = true; }
        }
        if (countEl) countEl.textContent = '已记录 ' + count + ' 条故障';
        if (devicesEl) devicesEl.textContent = '涉及 ' + Object.keys(deviceSet).length + ' 台设备';
    },

    getMonthValue: function() {
        return this.selectedYear + '-' + String(this.selectedMonth).padStart(2, '0');
    },

    getDayRemark: function(date, deviceId) {
        // 根据deviceId判断使用哪个设备列表
        var devs;
        var firstChar = deviceId.charAt(0);
        if (firstChar === 'L' || firstChar === 'S' || deviceId === 'P01' || deviceId === 'P02' || deviceId === 'E03' || deviceId === 'E04') {
            devs = this.OFFICE_DEVICES;
        } else {
            devs = this.MALL_DEVICES_P.concat(this.MALL_DEVICES_E);
        }
        var parts = [];
        for (var i = 0; i < this.FAULT_TYPES.length; i++) {
            var fcode = this.FAULT_TYPES[i].code;
            var devDescs = [];
            for (var j = 0; j < devs.length; j++) {
                var dkey = date + '_' + devs[j].id;
                var codes = this.records[dkey] || '';
                if (codes.indexOf(fcode) !== -1) {
                    var ddesc = this.faultDescs[dkey + '_' + fcode] || '';
                    if (ddesc) devDescs.push(ddesc);
                }
            }
            if (devDescs.length > 0) parts.push(devDescs.join('、'));
        }
        return parts.join('、');
    },

    async generateExcel() {
        // alert('generateExcel 被调用了！');
        console.log('[Debug] generateExcel called');
        var hasRecords = false;
        for (var k in this.records) { if (this.records[k]) { hasRecords = true; break; } }
        console.log('[Debug] hasRecords:', hasRecords);
        if (!hasRecords) { alert('请先填写故障记录'); return; }
        if (!this.selectedMonth) { alert('请先选择月份'); return; }

        document.getElementById('loading-overlay').style.display = 'flex';
        console.log('[Debug] loading overlay shown');
        try {
            console.log('[Debug] starting XHR...');
            var month = this.getMonthValue();
            var self = this;
            var monthLabel = month.split('-')[1] + '月';

            var buffer = await new Promise(function(resolve, reject) {
                console.log('[Debug] XHR creating...');
                var xhr = new XMLHttpRequest();
                xhr.open('GET', '../../assets/templates/elevator_monthly_report.xlsx', true);
                xhr.responseType = 'arraybuffer';
                xhr.onload = function() {
                    console.log('[Debug] XHR onload, status:', xhr.status);
                    if (xhr.status === 200 || xhr.status === 0) {
                        resolve(xhr.response);
                    } else {
                        reject(new Error('Failed to load template: ' + xhr.status));
                    }
                };
                xhr.onerror = function() { console.error('[Debug] XHR onerror'); reject(new Error('Network error')); };
                xhr.send();
                console.log('[Debug] XHR sent');
            });
            console.log('[Debug] Template loaded, processing...');
            console.log('[Debug] About to call JSZip.loadAsync...');
            var zip = await JSZip.loadAsync(buffer);
            console.log('[Debug] JSZip loaded');

            var ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';

            console.log('[Debug] Loading sheet1...');
            var sheet1Xml = await zip.file('xl/worksheets/sheet1.xml').async('string');
            console.log('[Debug] sheet1 loaded, length:', sheet1Xml.length);
            
            console.log('[Debug] Loading sheet2...');
            var sheet2File = zip.file('xl/worksheets/sheet2.xml');
            console.log('[Debug] sheet2 file found:', sheet2File !== null, sheet2File ? sheet2File.name : 'null');
            var sheet2Xml = await sheet2File.async('string');
            console.log('[Debug] sheet2 loaded, length:', sheet2Xml.length);
            var parser = new DOMParser();
            var xmlDoc1 = parser.parseFromString(sheet1Xml, 'text/xml');

            var setCellValue = function(doc, cellRef, value) {
                var cell = doc.querySelector('c[r="' + cellRef + '"]');
                if (!cell) return;
                cell.setAttribute('t', 'str');
                var v = cell.querySelector('v');
                if (!v) { v = doc.createElementNS(ns, 'v'); cell.appendChild(v); }
                v.textContent = value;
            };

            var p3Cell = xmlDoc1.querySelector('c[r="P3"]');
            if (p3Cell) {
                p3Cell.setAttribute('t', 'inlineStr');
                var isEl = xmlDoc1.createElementNS(ns, 'is');
                var tEl = xmlDoc1.createElementNS(ns, 't');
                tEl.textContent = monthLabel;
                isEl.appendChild(tEl);
                p3Cell.appendChild(isEl);
            }

            var officeCols = ['B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q'];
            for (var di = 0; di < this.OFFICE_DEVICES.length; di++) {
                var odev = this.OFFICE_DEVICES[di];
                var col = officeCols[di];
                for (var d = 1; d <= 31; d++) {
                    var okey = d + '_' + odev.id;
                    var ocode = this.records[okey] || '';
                    if (ocode) {
                        setCellValue(xmlDoc1, col + (7 + d), ocode);
                        var remark = this.getDayRemark(d, odev.id);
                        if (remark) setCellValue(xmlDoc1, 'R' + (7 + d), remark);
                    }
                }
            }

            var serializer = new XMLSerializer();
            console.log('[Debug] About to write sheet1 back to zip...');
            zip.file('xl/worksheets/sheet1.xml', serializer.serializeToString(xmlDoc1));
            console.log('[Debug] sheet1 written, now reloading sheet2...');
            var sheet2Xml = await zip.file('xl/worksheets/sheet2.xml').async('string');
            console.log('[Debug] sheet2 reloaded, length:', sheet2Xml.length);
            var xmlDoc2 = parser.parseFromString(sheet2Xml, 'text/xml');

            var q3Cell = xmlDoc2.querySelector('c[r="Q3"]');
            console.log('[Debug] Q3 cell found:', q3Cell !== null);
            if (q3Cell) {
                q3Cell.setAttribute('t', 'inlineStr');
                var existingV2 = q3Cell.querySelector('v');
                if (existingV2) q3Cell.removeChild(existingV2);
                var existingIs2 = q3Cell.querySelector('is');
                if (existingIs2) q3Cell.removeChild(existingIs2);
                var isEl2 = xmlDoc2.createElementNS(ns, 'is');
                var tEl2 = xmlDoc2.createElementNS(ns, 't');
                tEl2.textContent = monthLabel;
                isEl2.appendChild(tEl2);
                q3Cell.appendChild(isEl2);
            }
            console.log('[Debug] Q3 cell set done, starting mallP loop...');

            var mallPCols = ['B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R'];
            for (var pi = 0; pi < this.MALL_DEVICES_P.length; pi++) {
                var pdev = this.MALL_DEVICES_P[pi];
                var pcol = mallPCols[pi];
                for (var pd = 1; pd <= 31; pd++) {
                    var pkey = pd + '_' + pdev.id;
                    var pcode = this.records[pkey] || '';
                    if (pcode) {
                        setCellValue(xmlDoc2, pcol + (7 + pd), pcode);
                        var premark = this.getDayRemark(pd, pdev.id);
                        if (premark) setCellValue(xmlDoc2, 'V' + (7 + pd), premark);
                    }
                }
            }
            console.log('[Debug] mallP loop done, starting mallE loop...');

            var mallECols = ['B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R','S','T','U'];
            for (var ei = 0; ei < this.MALL_DEVICES_E.length; ei++) {
                var edev = this.MALL_DEVICES_E[ei];
                var ecol = mallECols[ei];
                for (var ed = 1; ed <= 31; ed++) {
                    var ekey = ed + '_' + edev.id;
                    var ecode = this.records[ekey] || '';
                    if (ecode) {
                        setCellValue(xmlDoc2, ecol + (42 + ed), ecode);
                        var eremmark = this.getDayRemark(ed, edev.id);
                        if (eremmark) setCellValue(xmlDoc2, 'V' + (42 + ed), eremmark);
                    }
                }
            }
            console.log('[Debug] mallE loop done, writing sheet2 back to zip...');

            zip.file('xl/worksheets/sheet2.xml', serializer.serializeToString(xmlDoc2));
            console.log('[Debug] sheet2 written, generating blob...');

            // 强制 Excel 打开时重新计算所有公式
            var calcPr2 = zip.file('xl/workbook.xml');
            if (calcPr2) {
                var calcXml2 = await calcPr2.async('string');
                if (calcXml2.indexOf('calcId') !== -1) {
                    calcXml2 = calcXml2.replace(/(<calcPr[^>]*?)\//, '$1 fullCalcOnLoad="1"/>');
                    zip.file('xl/workbook.xml', calcXml2);
                }
            }

            var blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
            console.log('[Debug] blob generated, converting to base64...');

            var base64 = await new Promise(function(resolve, reject) {
                var reader = new FileReader();
                reader.onload = function() { resolve(reader.result); };
                reader.onerror = function() { reject(new Error('FileReader failed')); };
                reader.readAsDataURL(blob);
            });
            console.log('[Debug] base64 ready, calling androidBridge.saveFile...');

            var fileName = '电梯月度故障报告_' + month.split('-')[1] + '月.xlsx';

            // 直接调用 saveFile，用超时兜底关闭 loading（Java 回调机制在部分 WebView 版本不通）
            window.androidBridge.saveFile(base64, fileName);
            window.androidBridge.shareFile(base64, fileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            var savedCallbackFired = false;
            var origOnFileSaved = window.onFileSaved;
            window.onFileSaved = function(success, errorMsg) {
                if (savedCallbackFired) return;
                savedCallbackFired = true;
                window.onFileSaved = origOnFileSaved;
                document.getElementById('loading-overlay').style.display = 'none';
                var overlay = document.getElementById('loading-overlay');
                if (overlay) {
                    overlay.innerHTML = '<div style="color:#4caf50;font-size:18px;font-weight:bold;padding:20px;">✅ 报告已保存到手机 Downloads 文件夹！</div>';
                    overlay.style.display = 'flex';
                    overlay.style.justifyContent = 'center';
                    overlay.style.alignItems = 'center';
                    overlay.style.background = 'rgba(255,255,255,0.95)';
                    overlay.style.flexDirection = 'column';
                    overlay.style.gap = '10px';
                    overlay.style.color = '#333';
                    overlay.onclick = function() { overlay.style.display = 'none'; };
                    setTimeout(function() { overlay.style.display = 'none'; }, 3000);
                }
            };
            setTimeout(function() {
                if (!savedCallbackFired) {
                    savedCallbackFired = true;
                    document.getElementById('loading-overlay').style.display = 'none';
                    var overlay = document.getElementById('loading-overlay');
                    if (overlay) {
                        overlay.innerHTML = '<div style="color:#4caf50;font-size:18px;font-weight:bold;padding:20px;">✅ 报告已保存到手机 Downloads 文件夹！</div>';
                        overlay.style.display = 'flex';
                        overlay.style.justifyContent = 'center';
                        overlay.style.alignItems = 'center';
                        overlay.style.background = 'rgba(255,255,255,0.95)';
                        overlay.style.flexDirection = 'column';
                        overlay.style.gap = '10px';
                        overlay.style.color = '#333';
                        overlay.onclick = function() { overlay.style.display = 'none'; };
                        setTimeout(function() { overlay.style.display = 'none'; }, 3000);
                    }
                }
            }, 2000);
        } catch (err) {
            console.error(err);
            document.getElementById('loading-overlay').style.display = 'none';
            var overlay = document.getElementById('loading-overlay');
            if (overlay) {
                overlay.innerHTML = '<div style="color:#f44336;font-size:16px;font-weight:bold;padding:20px;">❌ 生成失败: ' + err.message + '</div>';
                overlay.style.display = 'flex';
                overlay.style.justifyContent = 'center';
                overlay.style.alignItems = 'center';
                overlay.style.background = 'rgba(255,255,255,0.95)';
                overlay.style.flexDirection = 'column';
                overlay.style.color = '#333';
                overlay.onclick = function() { overlay.style.display = 'none'; };
                setTimeout(function() { overlay.style.display = 'none'; }, 4000);
            }
        }
    },

    // ========== Statistics Tab ==========
    renderStatContent: function() {
        var container = document.getElementById('stat-content');
        if (!container) return;
        var hasRecords = false;
        for (var k in this.records) { if (this.records[k]) { hasRecords = true; break; } }
        if (!hasRecords) {
            container.innerHTML = '<div class="placeholder"><div class="placeholder-icon">📋</div><p>暂无故障记录</p></div>';
            return;
        }
        if (!this.selectedMonth) {
            container.innerHTML = '<div class="placeholder"><div class="placeholder-icon">📅</div><p>请先在"月度故障报告"中选择月份</p></div>';
            return;
        }
        var html = '<div class="card">' +
            '<div class="card-title">选择统计范围</div>' +
            '<div class="building-tabs">' +
            '<button class="building-btn' + (this.currentBuilding === 'office' ? ' active' : '') + '" onclick="FaultModule.switchBuildingForStat(\'office\');">办公楼电梯</button>' +
            '<button class="building-btn' + (this.currentBuilding === 'mall' ? ' active' : '') + '" onclick="FaultModule.switchBuildingForStat(\'mall\');">商场电梯</button>' +
            '</div>' +
            '</div>' +
            '<div class="card"><div class="card-title">故障清单</div>' +
            '<div id="stat-list"></div>' +
            '</div>' +
            '<div class="btn-row"><button class="btn-generate" onclick="FaultModule.generateStatExcel()">📥 生成统计表 Excel</button></div>';
        container.innerHTML = html;
        this.renderStatList();
    },

    switchBuildingForStat: function(type) {
        this.currentBuilding = type;
        var btns = document.querySelectorAll('#content-stat .building-btn');
        for (var i = 0; i < btns.length; i++) {
            var txt = btns[i].textContent;
            var isActive = (type === 'office' && txt.indexOf('办公') !== -1) || (type === 'mall' && txt.indexOf('商场') !== -1);
            btns[i].classList.toggle('active', isActive);
        }
        this.renderStatList();
    },

    renderStatList: function() {
        var list = document.getElementById('stat-list');
        if (!list) return;
        var devs = this.getCurrentDevices();
        var items = [];
        for (var k in this.records) {
            var code = this.records[k];
            if (!code) continue;
            var parts = k.split('_');
            var date = parseInt(parts[0]);
            var devId = parts.slice(1).join('_');
            var codes = code.split('/');
            for (var i = 0; i < codes.length; i++) {
                var fc = codes[i];
                if (fc === 'H') continue;
                var descKey = k + '_' + fc;
                var desc = this.faultDescs[descKey] || '';
                var timeData = this.faultTimes[descKey] || {};
                items.push({ date: date, devId: devId, faultCode: fc, desc: desc, timeData: timeData, key: descKey });
            }
        }
        items.sort(function(a, b) { return b.date - a.date; });

        if (items.length === 0) {
            list.innerHTML = '<p style="text-align:center;color:#999;padding:15px;">暂无故障数据</p>';
            return;
        }

        var html = '';
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var ft = this.FAULT_TYPES.find(function(t) { return t.code === item.faultCode; }) || { code: item.faultCode, label: item.faultCode };
            var isExpanded = this.expandedStatItems.indexOf(item.key) !== -1;
            var safeKey = item.key.replace(/[^a-zA-Z0-9]/g, '_');
            html += '<div class="stat-item' + (isExpanded ? ' expanded' : '') + '">' +
                '<div class="stat-item-header" onclick="FaultModule.toggleStatItem(\'' + safeKey + '\')">' +
                '<span class="stat-date">' + this.selectedYear + '/' + this.selectedMonth + '/' + item.date + '</span>' +
                '<span class="stat-device">' + item.devId + '</span>' +
                '<span class="stat-fault-code">' + ft.code + ':' + ft.label + '</span>' +
                '<span class="stat-expand-icon">' + (isExpanded ? '▼' : '▶') + '</span></div>' +
                '<div class="stat-item-detail" style="' + (isExpanded ? '' : 'display:none') + '">' +
                '<div class="stat-time-grid">' +
                '<div class="stat-time-field"><label>报修时间(B):</label>' +
                '<span class="time-input-group">' +
                '<input type="number" class="time-input hour" id="rb_' + safeKey + '" min="0" max="23" placeholder="时" value="' + (item.timeData.reportHour || '') + '" onchange="FaultModule.updateStatTime(\'' + safeKey + '\', \'reportHour\', this.value)">' +
                '<span>:</span>' +
                '<input type="number" class="time-input minute" id="rm_' + safeKey + '" min="0" max="59" placeholder="分" value="' + (item.timeData.reportMinute || '') + '" onchange="FaultModule.updateStatTime(\'' + safeKey + '\', \'reportMinute\', this.value)">' +
                '</span></div>' +
                '<div class="stat-time-field"><label>解困时间(E):</label>' +
                '<span class="time-input-group">' +
                '<input type="number" class="time-input hour" id="rh_' + safeKey + '" min="0" max="23" placeholder="时" value="' + (item.timeData.rescueHour || '') + '" onchange="FaultModule.updateStatTime(\'' + safeKey + '\', \'rescueHour\', this.value)">' +
                '<span>:</span>' +
                '<input type="number" class="time-input minute" id="rt_' + safeKey + '" min="0" max="59" placeholder="分" value="' + (item.timeData.rescueMinute || '') + '" onchange="FaultModule.updateStatTime(\'' + safeKey + '\', \'rescueMinute\', this.value)">' +
                '<label class="not-trapped-label"><input type="checkbox" id="nt_' + safeKey + '" ' + (item.timeData.isNotTrapped ? 'checked' : '') + ' onchange="FaultModule.updateStatTime(\'' + safeKey + '\', \'isNotTrapped\', this.checked)"> 未困人</label>' +
                '</span></div>' +
                '<div class="stat-time-field"><label>到场时间(F-H):</label>' +
                '<span class="time-input-group">' +
                '<input type="number" class="time-input day" id="ad_' + safeKey + '" min="1" max="31" placeholder="日" value="' + (item.timeData.arrivalDate || '') + '" onchange="FaultModule.updateStatTime(\'' + safeKey + '\', \'arrivalDate\', this.value)">' +
                '<input type="number" class="time-input hour" id="ah_' + safeKey + '" min="0" max="23" placeholder="时" value="' + (item.timeData.arrivalHour || '') + '" onchange="FaultModule.updateStatTime(\'' + safeKey + '\', \'arrivalHour\', this.value)">' +
                '<span>:</span>' +
                '<input type="number" class="time-input minute" id="at_' + safeKey + '" min="0" max="59" placeholder="分" value="' + (item.timeData.arrivalMinute || '') + '" onchange="FaultModule.updateStatTime(\'' + safeKey + '\', \'arrivalMinute\', this.value)">' +
                '</span></div>' +
                '<div class="stat-time-field"><label>故障描述:</label><input type="text" class="fault-desc-input" id="desc_' + safeKey + '" value="' + item.desc + '" onchange="FaultModule.updateStatTime(\'' + safeKey + '\', \'desc\', this.value)"></div>' +
                '<div class="stat-time-field"><label>检查结果(I):</label><input type="text" class="fault-desc-input" id="ir_' + safeKey + '" value="' + (item.inspectionResult || '') + '" onchange="FaultModule.updateStatTime(\'' + safeKey + '\', \'inspectionResult\', this.value)"></div>' +
                '</div></div>';
            html += '</div>';
            }
            list.innerHTML = html;
        },

        toggleStatItem: function(safeKey) {
            var idx = this.expandedStatItems.indexOf(safeKey);
            if (idx !== -1) {
                this.expandedStatItems.splice(idx, 1);
            } else {
                this.expandedStatItems.push(safeKey);
            }
            this.renderStatList();
        },

        updateStatTime: function(safeKey, field, value) {
            // Find the original key from safeKey
            var originalKey = null;
            for (var k in this.records) {
                var code = this.records[k];
                if (!code) continue;
                var parts = k.split('_');
                var codes = code.split('/');
                for (var i = 0; i < codes.length; i++) {
                    var fc = codes[i];
                    if (fc === 'H') continue;
                    var descKey = k + '_' + fc;
                    var sk = descKey.replace(/[^a-zA-Z0-9]/g, '_');
                    if (sk === safeKey) {
                        originalKey = descKey;
                        break;
                    }
                }
                if (originalKey) break;
            }
            if (!originalKey) return;
            if (!this.faultTimes[originalKey]) this.faultTimes[originalKey] = {};
            if (field === 'desc') {
                if (value) {
                    this.faultDescs[originalKey] = value;
                } else {
                    delete this.faultDescs[originalKey];
                }
            } else {
                this.faultTimes[originalKey][field] = value;
            }
        },

        getStatFaultsForExcel: function() {
            var devs = this.getCurrentDevices();
            var items = [];
            for (var k in this.records) {
                var code = this.records[k];
                if (!code) continue;
                var parts = k.split('_');
                var date = parseInt(parts[0]);
                var devId = parts.slice(1).join('_');
                var codes = code.split('/');
                for (var i = 0; i < codes.length; i++) {
                    var fc = codes[i];
                    if (fc === 'H') continue;
                    var descKey = k + '_' + fc;
                    var desc = this.faultDescs[descKey] || '';
                    var timeData = this.faultTimes[descKey] || {};
                    var ft = this.FAULT_TYPES.find(function(t) { return t.code === fc; }) || { code: fc, label: fc };
                    items.push({
                        date: date,
                        devId: devId,
                        faultCode: fc,
                        faultLabel: ft.label,
                        desc: desc,
                        reportHour: timeData.reportHour || '',
                        reportMinute: timeData.reportMinute || '',
                        rescueHour: timeData.rescueHour || '',
                        rescueMinute: timeData.rescueMinute || '',
                        isNotTrapped: timeData.isNotTrapped || false,
                        arrivalDate: timeData.arrivalDate || '',
                        arrivalHour: timeData.arrivalHour || '',
                        arrivalMinute: timeData.arrivalMinute || '',
                        inspectionResult: timeData.inspectionResult || ''
                    });
                }
            }
            items.sort(function(a, b) { return a.date - b.date; });
            return items;
        },

        // Helper: 判断设备是否属于办公楼
        isOfficeDevice: function(devId) {
            var firstChar = devId.charAt(0);
            if (firstChar === 'L' || firstChar === 'S') return true;
            if (firstChar === 'P') {
                if (devId === 'P01' || devId === 'P02') return true;
                return false;
            }
            if (firstChar === 'E') {
                if (devId === 'E03' || devId === 'E04') return true;
                return false;
            }
            return false;
        },

        // Helper: 写入数据到指定sheet
        // Helper: 判断设备是否属于办公楼
        isOfficeDevice: function(devId) {
            var firstChar = devId.charAt(0);
            if (firstChar === 'L' || firstChar === 'S') return true;
            if (firstChar === 'P') {
                if (devId === 'P01' || devId === 'P02') return true;
                return false;
            }
            if (firstChar === 'E') {
                if (devId === 'E03' || devId === 'E04') return true;
                return false;
            }
            return false;
        },

        // Helper: 判断设备是否属于商场
        isMallDevice: function(devId) {
            return !this.isOfficeDevice(devId);
        },

        // Helper: 写入数据到指定sheet
        writeStatSheet: function(xmlDoc, ns, items, setCellValue, setInlineStr, filterFn) {
            var self = this;
            var sheetItems = items.filter(filterFn);

            // 清空数据行 5-17
            for (var r = 5; r <= 17; r++) {
                setInlineStr(xmlDoc, 'A' + r, '');
                setInlineStr(xmlDoc, 'B' + r, '');
                setInlineStr(xmlDoc, 'C' + r, '');
                setInlineStr(xmlDoc, 'D' + r, '');
                setInlineStr(xmlDoc, 'E' + r, '');
                setInlineStr(xmlDoc, 'F' + r, '');
                setInlineStr(xmlDoc, 'I' + r, '');
                setInlineStr(xmlDoc, 'L' + r, '');
            }

            var eDeviceCount = 0;
            var otherDeviceCount = 0;

            for (var i = 0; i < sheetItems.length && i < 13; i++) {
                var item = sheetItems[i];
                var row = 5 + i;

                setInlineStr(xmlDoc, 'A' + row, this.selectedYear + '/' + this.selectedMonth + '/' + item.date);

                var reportTime = item.reportHour !== '' ? String(item.reportHour).padStart(2, '0') + ':' + String(item.reportMinute || '00').padStart(2, '0') : '';
                setInlineStr(xmlDoc, 'B' + row, reportTime);

                setInlineStr(xmlDoc, 'C' + row, item.devId);

                var autoDesc = item.desc || item.faultLabel;
                setInlineStr(xmlDoc, 'D' + row, autoDesc);

                if (item.isNotTrapped) {
                    setInlineStr(xmlDoc, 'E' + row, '未困人');
                } else if (item.rescueHour !== '') {
                    var rm = item.rescueMinute || '00';
                    var rescueTime = String(item.rescueHour).padStart(2, '0') + ':' + String(rm).padStart(2, '0');
                    setInlineStr(xmlDoc, 'E' + row, rescueTime);
                } else {
                    setInlineStr(xmlDoc, 'E' + row, '');
                }

                var arrivalStr = '';
                if (item.arrivalDate) {
                    arrivalStr = item.arrivalDate + '日';
                }
                if (item.arrivalHour !== '') {
                    arrivalStr += (arrivalStr ? ' ' : '') + String(item.arrivalHour).padStart(2, '0') + ':' + String(item.arrivalMinute || '00').padStart(2, '0');
                }
                setInlineStr(xmlDoc, 'F' + row, arrivalStr);

                // I: 检查结果
                setInlineStr(xmlDoc, 'I' + row, item.inspectionResult || '');

                setInlineStr(xmlDoc, 'L' + row, item.faultCode);

                if (item.devId.charAt(0) === 'E') {
                    eDeviceCount++;
                } else {
                    otherDeviceCount++;
                }
            }

            setCellValue(xmlDoc, 'G18', otherDeviceCount);
            setCellValue(xmlDoc, 'G20', eDeviceCount);
        },

        async generateStatExcel() {
            alert('generateStatExcel 被调用了！');
            console.log('[Debug] generateStatExcel called');
            var items = this.getStatFaultsForExcel();
            console.log('[Debug] items.length:', items.length);
            if (items.length === 0) { alert('暂无故障数据可导出'); return; }
            if (!this.selectedMonth) { alert('请先选择月份'); return; }

            document.getElementById('loading-overlay').style.display = 'flex';
            try {
                console.log('[Debug] Loading template...');
                var month = this.getMonthValue();
                var monthLabel = month.split('-')[1] + '月';

                var buffer = await new Promise(function(resolve, reject) {
                    var xhr = new XMLHttpRequest();
                    xhr.open('GET', '../../assets/templates/elevator_monthly_stat.xlsx', true);
                    xhr.responseType = 'arraybuffer';
                    xhr.onload = function() {
                        console.log('[Debug] XHR onload, status:', xhr.status);
                        if (xhr.status === 200 || xhr.status === 0) {
                            resolve(xhr.response);
                        } else {
                            reject(new Error('Failed to load template: ' + xhr.status));
                        }
                    };
                    xhr.onerror = function() { console.error('[Debug] XHR onerror'); reject(new Error('Network error')); };
                    xhr.send();
                });
                console.log('[Debug] Template loaded, processing...');
                var zip = await JSZip.loadAsync(buffer);

                var ns = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';

                var sheet1Xml = await zip.file('xl/worksheets/sheet1.xml').async('string');
                var sheet2Xml = await zip.file('xl/worksheets/sheet2.xml').async('string');
                var parser = new DOMParser();
                var xmlDoc1 = parser.parseFromString(sheet1Xml, 'text/xml');
                var xmlDoc2 = parser.parseFromString(sheet2Xml, 'text/xml');

                var setCellValue = function(doc, cellRef, value) {
                    var cell = doc.querySelector('c[r="' + cellRef + '"]');
                    if (!cell) return;
                    cell.removeAttribute('t');
                    var v = cell.querySelector('v');
                    if (!v) { v = doc.createElementNS(ns, 'v'); cell.appendChild(v); }
                    v.textContent = value;
                };

                var setInlineStr = function(doc, cellRef, value) {
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

                setInlineStr(xmlDoc1, 'I2', monthLabel);
                setInlineStr(xmlDoc2, 'I2', monthLabel);

                this.writeStatSheet(xmlDoc1, ns, items, setCellValue, setInlineStr, function(item) { return this.isOfficeDevice(item.devId); }.bind(this));
                this.writeStatSheet(xmlDoc2, ns, items, setCellValue, setInlineStr, function(item) { return this.isMallDevice(item.devId); }.bind(this));

                var serializer = new XMLSerializer();
                zip.file('xl/worksheets/sheet1.xml', serializer.serializeToString(xmlDoc1));
                zip.file('xl/worksheets/sheet2.xml', serializer.serializeToString(xmlDoc2));

                var calcPr = zip.file('xl/workbook.xml');
                if (calcPr) {
                    var calcXml = await calcPr.async('string');
                    if (calcXml.indexOf('calcId') !== -1) {
                        calcXml = calcXml.replace(/(<calcPr[^>]*?)\/>/, '$1 fullCalcOnLoad="1"/>');
                        zip.file('xl/workbook.xml', calcXml);
                    }
                }

                var blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
                var base64 = await new Promise(function(resolve, reject) {
                    var reader = new FileReader();
                    reader.onload = function() { resolve(reader.result); };
                    reader.onerror = function() { reject(new Error('FileReader failed')); };
                    reader.readAsDataURL(blob);
                });
                var statFileName = '电梯月度故障统计_' + month.split('-')[1] + '月.xlsx';
                // 直接调用 saveFile，用超时兜底关闭 loading
                window.androidBridge.saveFile(base64, statFileName);
                window.androidBridge.shareFile(base64, statFileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                var savedCallbackFired = false;
                var origOnFileSaved = window.onFileSaved;
                window.onFileSaved = function(success, errorMsg) {
                    if (savedCallbackFired) return;
                    savedCallbackFired = true;
                    window.onFileSaved = origOnFileSaved;
                    document.getElementById('loading-overlay').style.display = 'none';
                    var overlay = document.getElementById('loading-overlay');
                    if (overlay) {
                        overlay.innerHTML = '<div style="color:#4caf50;font-size:18px;font-weight:bold;padding:20px;">✅ 统计表已保存到手机 Downloads 文件夹！</div>';
                        overlay.style.display = 'flex';
                        overlay.style.justifyContent = 'center';
                        overlay.style.alignItems = 'center';
                        overlay.style.background = 'rgba(255,255,255,0.95)';
                        overlay.style.flexDirection = 'column';
                        overlay.style.gap = '10px';
                        overlay.style.color = '#333';
                        overlay.onclick = function() { overlay.style.display = 'none'; };
                        setTimeout(function() { overlay.style.display = 'none'; }, 3000);
                    }
                };
                setTimeout(function() {
                    if (!savedCallbackFired) {
                        savedCallbackFired = true;
                        document.getElementById('loading-overlay').style.display = 'none';
                        var overlay = document.getElementById('loading-overlay');
                        if (overlay) {
                            overlay.innerHTML = '<div style="color:#4caf50;font-size:18px;font-weight:bold;padding:20px;">✅ 统计表已保存到手机 Downloads 文件夹！</div>';
                            overlay.style.display = 'flex';
                            overlay.style.justifyContent = 'center';
                            overlay.style.alignItems = 'center';
                            overlay.style.background = 'rgba(255,255,255,0.95)';
                            overlay.style.flexDirection = 'column';
                            overlay.style.gap = '10px';
                            overlay.style.color = '#333';
                            overlay.onclick = function() { overlay.style.display = 'none'; };
                            setTimeout(function() { overlay.style.display = 'none'; }, 3000);
                        }
                    }
                }, 2000);
            } catch (err) {
                console.error('[Debug] Catch error:', err.message, err);
                document.getElementById('loading-overlay').style.display = 'none';
                var overlay = document.getElementById('loading-overlay');
                if (overlay) {
                    overlay.innerHTML = '<div style="color:#f44336;font-size:16px;font-weight:bold;padding:20px;">❌ 生成失败: ' + err.message + '</div>';
                    overlay.style.display = 'flex';
                    overlay.style.justifyContent = 'center';
                    overlay.style.alignItems = 'center';
                    overlay.style.background = 'rgba(255,255,255,0.95)';
                    overlay.style.flexDirection = 'column';
                    overlay.style.color = '#333';
                    overlay.onclick = function() { overlay.style.display = 'none'; };
                    setTimeout(function() { overlay.style.display = 'none'; }, 4000);
                }
            }
        }
};

window.FaultModule = FaultModule;

document.addEventListener('DOMContentLoaded', function() {
    FaultModule.init();
});
