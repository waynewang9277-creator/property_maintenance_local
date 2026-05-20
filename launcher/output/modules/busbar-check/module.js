// BusbarCheck - 供电母排检查测温模块
var BusbarModule = {
    STORAGE_KEY: 'busbar_check_data',
    DATA_VERSION: '1.0',
    
    // 分组定义
    GROUPS: ['商四站', '商五站', '商六站', 'T18站', '办公楼租户'],
    
    // 设备列表（用于Excel映射）
    DEVICES: [
        // 商四站 (Row 6)
        { id: "Tx-RS5-1", location: "B1商四站", group: "商四站", row: 6, col: 2 },
        { id: "Tx-RS6-1", location: "B1商四站", group: "商四站", row: 6, col: 6 },
        // T18站 (Rows 6-7)
        { id: "Tx-01-1", location: "B1 T18站", group: "T18站", row: 6, col: 10 },
        { id: "Tx-02-1", location: "B1 T18站", group: "T18站", row: 6, col: 14 },
        { id: "Tx-03-1", location: "B1 T18站", group: "T18站", row: 7, col: 2 },
        { id: "Tx-04-1", location: "B1 T18站", group: "T18站", row: 7, col: 6 },
        // 商六站 (Row 7)
        { id: "Tx-RS7-1", location: "B1商六站", group: "商六站", row: 7, col: 10 },
        { id: "Tx-RS8-1", location: "B1商六站", group: "商六站", row: 7, col: 14 },
        // 商五站 (Row 8)
        { id: "Tx-RS1-1", location: "B1 商五站", group: "商五站", row: 8, col: 2 },
        { id: "Tx-RS2-1", location: "B1 商五站", group: "商五站", row: 8, col: 6 },
        { id: "Tx-RS3-1", location: "B1 商五站", group: "商五站", row: 8, col: 10 },
        { id: "Tx-RS4-1", location: "B1 商五站", group: "商五站", row: 8, col: 14 },
        // 办公楼租户
        { id: "15-租户1-3", location: "15层", group: "办公楼租户", row: 9, col: 2 },
        { id: "15-租户4-6", location: "15层", group: "办公楼租户", row: 9, col: 6 },
        { id: "12-租户1-3", location: "12层", group: "办公楼租户", row: 9, col: 10 },
        { id: "12-租户4-6", location: "12层", group: "办公楼租户", row: 9, col: 14 },
        { id: "11-租户1-3", location: "11层", group: "办公楼租户", row: 10, col: 2 },
        { id: "11-租户4-6", location: "11层", group: "办公楼租户", row: 10, col: 6 },
        { id: "10-租户1-3", location: "10层", group: "办公楼租户", row: 10, col: 10 },
        { id: "10-租户4-6", location: "10层", group: "办公楼租户", row: 10, col: 14 },
        { id: "9-租户1-3", location: "9层", group: "办公楼租户", row: 11, col: 2 },
        { id: "9-租户4-6", location: "9层", group: "办公楼租户", row: 11, col: 6 },
        { id: "8-租户1-3", location: "8层", group: "办公楼租户", row: 11, col: 10 },
        { id: "8-租户4-6", location: "8层", group: "办公楼租户", row: 11, col: 14 },
        { id: "7-租户1-3", location: "7层", group: "办公楼租户", row: 12, col: 2 },
        { id: "7-租户4-6", location: "7层", group: "办公楼租户", row: 12, col: 6 },
        { id: "6-租户1-3", location: "6层", group: "办公楼租户", row: 12, col: 10 },
        { id: "6-租户4-6", location: "6层", group: "办公楼租户", row: 12, col: 14 },
        { id: "5-租户1-3", location: "5层", group: "办公楼租户", row: 13, col: 2 },
        { id: "5-租户4-6", location: "5层", group: "办公楼租户", row: 13, col: 6 },
        { id: "30-租户4-6", location: "30层", group: "办公楼租户", row: 13, col: 10 }
    ],
    
    // 数据: { deviceId: { photo: 'base64', temperature: '36.5', ocrDone: true } }
    data: {},
    
    selectedGroup: null,
    expandedDevice: null,
    ocrEngine: null,
    ocrReady: false,
    
    init: function() {
        var self = this;
        this.loadData();
        this.render();
        
        // 使用事件委托绑定点击事件
        document.getElementById('busbar-list').addEventListener('click', function(e) {
            var target = e.target;
            console.log('Click target:', target.className, target.tagName);
            
            // 检查是否点击了拍照按钮
            if (target.classList.contains('btn-take-photo')) {
                var deviceId = target.getAttribute('data-device');
                console.log('Take photo clicked, deviceId:', deviceId);
                if (deviceId) {
                    self.takePhoto(deviceId);
                }
                return;
            }
            
            // 查找点击的元素是group还是device
            var groupEl = target.closest('.busbar-group-header');
            var deviceEl = target.closest('.busbar-device-header');
            
            if (groupEl) {
                var groupName = groupEl.querySelector('.group-name').textContent;
                self.toggleGroup(groupName);
            } else if (deviceEl) {
                var deviceId = deviceEl.querySelector('.device-name').textContent;
                self.toggleDevice(deviceId);
            }
        });
        
        // 初始化OCR
        this.initOCR();
    },
    
    loadData: function() {
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
    
    saveData: function() {
        var toSave = {
            version: this.DATA_VERSION,
            data: this.data,
            savedAt: new Date().toISOString()
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(toSave));
    },
    
    initOCR: function() {
        var self = this;
        if (typeof Tesseract === 'undefined') {
            console.log('Tesseract not loaded');
            return;
        }
        
        // Tesseract.setLogLevel('INFO');
        this.ocrReady = true;
        console.log('OCR ready (local model)');
    },
    
    render: function() {
        var main = document.getElementById('busbar-list');
        if (!main) return;
        
        var html = '';
        
        for (var i = 0; i < this.GROUPS.length; i++) {
            var group = this.GROUPS[i];
            var devices = this.getDevicesByGroup(group);
            var completed = this.getGroupCompletedCount(group);
            var isExpanded = this.selectedGroup === group;
            
            html += '<div class="busbar-group' + (isExpanded ? ' expanded' : '') + '">';
            html += '<div class="busbar-group-header">';
            html += '<span class="group-arrow">' + (isExpanded ? '▼' : '▶') + '</span>';
            html += '<span class="group-name">' + group + '</span>';
            html += '<span class="group-count">' + completed + '/' + devices.length + '</span>';
            html += '</div>';
            
            if (isExpanded) {
                html += '<div class="busbar-devices">';
                for (var j = 0; j < devices.length; j++) {
                    var device = devices[j];
                    var devData = this.data[device.id];
                    var hasPhoto = devData && devData.photo;
                    var isDeviceExpanded = this.expandedDevice === device.id;
                    
                    html += '<div class="busbar-device' + (hasPhoto ? ' completed' : '') + (isDeviceExpanded ? ' expanded' : '') + '">';
                    html += '<div class="busbar-device-header">';
                    html += '<span class="device-arrow">' + (isDeviceExpanded ? '▼' : '▶') + '</span>';
                    html += '<span class="device-name">' + device.id + '</span>';
                    html += '<span class="device-location">' + device.location + '</span>';
                    html += '<span class="device-status">' + (hasPhoto ? '✓' : '○') + '</span>';
                    html += '</div>';
                    
                    if (isDeviceExpanded) {
                        html += '<div class="busbar-device-detail">';
                        html += '<div class="device-info">';
                        html += '<div class="info-row"><span class="label">设备ID:</span><span class="value">' + device.id + '</span></div>';
                        html += '<div class="info-row"><span class="label">位置:</span><span class="value">' + device.location + '</span></div>';
                        if (devData && devData.temperature) {
                            html += '<div class="temp-row">';
                            html += '<span class="temp-label">Max:</span><span class="temp-value">' + (devData.temperature.max || '--') + '°C</span>';
                            html += '<span class="temp-label">Min:</span><span class="temp-value">' + (devData.temperature.min || '--') + '°C</span>';
                            html += '<span class="temp-label">Avg:</span><span class="temp-value">' + (devData.temperature.avg || '--') + '°C</span>';
                            html += '</div>';
                        } else {
                            html += '<div class="temp-row">';
                            html += '<span class="temp-label">Max:</span><span class="temp-value">--</span>';
                            html += '<span class="temp-label">Min:</span><span class="temp-value">--</span>';
                            html += '<span class="temp-label">Avg:</span><span class="temp-value">--</span>';
                            html += '</div>';
                        }
                        html += '</div>';
                        
                        // 照片预览/上传
                        html += '<div class="photo-area">';
                        if (hasPhoto) {
                            html += '<div class="photo-preview">';
                            html += '<img src="' + devData.photo + '">';
                            html += '</div>';
                        }
                        html += '<button class="btn-take-photo" data-device="' + device.id + '">📷 ' + (hasPhoto ? '重新拍照' : '拍照') + '</button>';
                        html += '</div>';
                        
                        html += '</div>';
                    }
                    
                    html += '</div>';
                }
                html += '</div>';
            }
            
            html += '</div>';
        }
        
        main.innerHTML = html;
    },
    
    getDevicesByGroup: function(group) {
        var result = [];
        for (var i = 0; i < this.DEVICES.length; i++) {
            if (this.DEVICES[i].group === group) {
                result.push(this.DEVICES[i]);
            }
        }
        return result;
    },
    
    getGroupCompletedCount: function(group) {
        var devices = this.getDevicesByGroup(group);
        var count = 0;
        for (var i = 0; i < devices.length; i++) {
            var devData = this.data[devices[i].id];
            if (devData && devData.photo && devData.temperature && devData.temperature.max) {
                count++;
            }
        }
        return count;
    },
    
    toggleGroup: function(group) {
        if (this.selectedGroup === group) {
            this.selectedGroup = null;
        } else {
            this.selectedGroup = group;
            this.expandedDevice = null;
        }
        this.render();
    },
    
    toggleDevice: function(deviceId) {
        if (this.expandedDevice === deviceId) {
            this.expandedDevice = null;
        } else {
            this.expandedDevice = deviceId;
        }
        this.render();
    },
    
    takePhoto: function(deviceId) {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        var self = this;
        input.onchange = function(e) {
            var file = e.target.files[0];
            if (!file) return;
            
            var reader = new FileReader();
            reader.onload = function(ev) {
                var base64 = ev.target.result;
                self.processPhoto(deviceId, base64);
            };
            reader.readAsDataURL(file);
        };
        input.click();
    },
    
    processPhoto: function(deviceId, photoData) {
        var self = this;
        console.log('processPhoto called for:', deviceId, 'photo length:', photoData.length);
        
        if (!this.data[deviceId]) {
            this.data[deviceId] = {};
        }
        this.data[deviceId].photo = photoData;
        this.data[deviceId].date = this.formatDate(new Date());
        
        this.recognizeTemperature(photoData, function(tempObj) {
            console.log('OCR callback, tempObj:', tempObj);
            if (tempObj) {
                self.data[deviceId].temperature = tempObj;
                self.data[deviceId].ocrDone = true;
            }
            self.saveData();
            self.render();
        });
    },
    
    recognizeTemperature: function(photoData, callback) {
        var self = this;
        
        console.log('recognizeTemperature called');
        
        if (typeof Tesseract === 'undefined') {
            console.log('Tesseract not loaded');
            callback(null);
            return;
        }
        
        console.log('Starting OCR recognition with local model...');
        
        // 使用本地语言模型
        var langPath = '../../common/models/';
        
        Tesseract.recognize(photoData, 'eng', {
            langPath: langPath,
            logger: function(m) {
                console.log('OCR progress:', m.status);
            }
        }).then(function(result) {
            var text = result.data.text;
            console.log('OCR识别文本:', text);
            
            // 尝试提取 Max/Min/Avg 温度
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
                // 尝试匹配通用温度格式
                var temps = text.match(/(\d{2}\.\d)/g);
                if (temps && temps.length >= 3) {
                    callback({
                        max: temps[0] || '',
                        min: temps[1] || '',
                        avg: temps[2] || ''
                    });
                } else {
                    callback(null);
                }
            }
        }).catch(function(e) {
            console.log('OCR识别失败:', e);
            callback(null);
        });
    },
    
    formatDate: function(date) {
        var y = date.getFullYear();
        var m = String(date.getMonth() + 1).padStart(2, '0');
        var d = String(date.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + d;
    },
    
    exportExcel: function() {
        var self = this;
        
        var dateInput = document.getElementById('check-date');
        var roomTempInput = document.getElementById('room-temp');
        var checkDate = dateInput ? dateInput.value : '';
        var roomTemp = roomTempInput ? roomTempInput.value : '';
        
        if (!checkDate) {
            alert('请输入检查日期');
            return;
        }
        
        document.getElementById('loading-overlay').style.display = 'flex';
        
        var JSZip = window.JSZip;
        var parser = new DOMParser();
        var ns = { x: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main' };
        
        fetch('../../assets/templates/busbar_template.xlsx')
            .then(function(res) { return res.arrayBuffer(); })
            .then(function(buffer) {
                return JSZip.loadAsync(buffer);
            })
            .then(function(zip) {
                return zip.file('xl/worksheets/sheet1.xml').async('string').then(function(xmlStr) {
                    return { zip: zip, xmlStr: xmlStr };
                });
            })
            .then(function(data) {
                var zip = data.zip;
                var xmlStr = data.xmlStr;
                var xmlDoc = parser.parseFromString(xmlStr, 'text/xml');
                
                var setCellValue = function(doc, cellRef, value) {
                    console.log('setCellValue called:', cellRef, value);
                    var cell = doc.querySelector('c[r="' + cellRef + '"]');
                    if (!cell) {
                        console.log('Cell not found:', cellRef);
                        return;
                    }
                    console.log('Before setCellValue, cell XML:', new XMLSerializer().serializeToString(cell));
                    cell.setAttribute('t', 'str');
                    // Remove existing v if any
                    var existingV = cell.querySelector('v');
                    if (existingV) cell.removeChild(existingV);
                    // Create new v element
                    var v = doc.createElementNS(ns.x, 'v');
                    v.textContent = value;
                    cell.appendChild(v);
                    console.log('After setCellValue, cell XML:', new XMLSerializer().serializeToString(cell));
                };
                
                // 格式化日期: YYYY年M月D日
                var dateParts = checkDate.split('-');
                var dateStr = dateParts[0] + '年' + parseInt(dateParts[1]) + '月' + parseInt(dateParts[2]) + '日';
                
                // 日期填入 N3
                setCellValue(xmlDoc, 'N3', dateStr);
                
                // 室温填入 P3 (格式: 数字+℃)
                if (roomTemp) {
                    var tempVal = roomTemp.endsWith('℃') ? roomTemp : roomTemp + '℃';
                    setCellValue(xmlDoc, 'P3', tempVal);
                }
                
                // 填入每个设备的温度 (Max/Min/Avg)
                // 模板结构: 每4列一组 (位置|设备编号|照片|温度)
                // 温度列 = 设备所在列 + 2
                for (var i = 0; i < self.DEVICES.length; i++) {
                    var device = self.DEVICES[i];
                    var devData = self.data[device.id];
                    
                    if (devData && devData.temperature) {
                        var tempCol = device.col + 2; // 温度列 = 设备编号列 + 2
                        var photoCol = device.col + 1; // 照片列 = 设备编号列 + 1
                        var tempColLetter = String.fromCharCode(64 + tempCol);
                        var cellRefMax = tempColLetter + device.row;
                        var cellRefMin = tempColLetter + (device.row + 1);
                        var cellRefAvg = tempColLetter + (device.row + 2);
                        
                        if (devData.temperature) {
                            var tempLines = [];
                            if (devData.temperature.max) tempLines.push('Max: ' + devData.temperature.max + '°C');
                            if (devData.temperature.min) tempLines.push('Min: ' + devData.temperature.min + '°C');
                            if (devData.temperature.avg) tempLines.push('Avg: ' + devData.temperature.avg + '°C');
                            if (tempLines.length > 0) {
                                setCellValue(xmlDoc, cellRefMax, 'Max: ' + (devData.temperature.max||'') + String.fromCharCode(10) + 'Min: ' + (devData.temperature.min||'') + String.fromCharCode(10) + 'Avg: ' + (devData.temperature.avg||''));
                            }
                        }
                    }
                }
                
                // ---- 填入照片 ----
                var photoCount = 0;
                try {
                for (var i = 0; i < self.DEVICES.length; i++) {
                    var device = self.DEVICES[i];
                    var devData = self.data[device.id];
                    console.log('Device:', device.id, 'has photo:', !!devData && !!devData.photo);
                    if (devData && devData.photo) {
                        photoCount++;
                        zip.file('xl/media/photo_' + device.id + '.png', self.base64ToUint8Array(devData.photo));
                    }
                }
                
                console.log('Total photos:', photoCount);
                
                if (photoCount > 0) {
                    // Build drawing XML
                    var wsDrContent = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
                        '<wsDr xmlns="http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing">';
                    var drawingRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
                        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">';
                    
                    var imgIdx = 1;
                    for (var i = 0; i < self.DEVICES.length; i++) {
                        var device = self.DEVICES[i];
                        var devData = self.data[device.id];
                        if (!devData || !devData.photo) continue;
                        
                        var photoColForDrawing = device.col; // 照片列 = 设备编号列 + 1，drawing用0-based所以减1
                        
                        drawingRels += '<Relationship Id="rId' + imgIdx + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="/xl/media/photo_' + device.id + '.png"/>';
                        
                        wsDrContent += '<oneCellAnchor editAs="oneCell">' +
                            '<from><col>' + photoColForDrawing + '</col><colOff>0</colOff><row>' + (device.row - 1) + '</row><rowOff>0</rowOff></from>' +
                            '<ext cx="1054800" cy="914400"/>' +
                            '<pic>' +
                            '<nvPicPr><cNvPr id="' + imgIdx + '" name="Photo' + device.id + '" descr="Photo"/><cNvPicPr/></nvPicPr>' +
                            '<blipFill>' +
                            '<a:blip xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" r:embed="rId' + imgIdx + '"/>' +
                            '<a:stretch xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:fillRect/></a:stretch>' +
                            '</blipFill>' +
                            '<spPr><a:prstGeom xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" prst="rect"/></spPr>' +
                            '</pic>' +
                            '<clientData/>' +
                            '</oneCellAnchor>';
                        
                        imgIdx++;
                    }
                    wsDrContent += '</wsDr>';
                    drawingRels += '</Relationships>';
                    
                    zip.file('xl/drawings/drawing1.xml', wsDrContent);
                    zip.file('xl/drawings/_rels/drawing1.xml.rels', drawingRels);
                    
                    // Update Content_Types.xml
                    var ctContent = zip.file('[Content_Types].xml').async('string');
                    ctContent.then(function(ct) {
                        if (ct.indexOf('drawing') === -1) {
                            zip.file('[Content_Types].xml', ct.replace('</Types>',
                                '<Override PartName="/xl/drawings/drawing1.xml" ContentType="application/vnd.openxmlformats-officedocument.drawing+xml"/></Types>'));
                        }
                    });
                    
                    // Create sheet1.xml.rels
                    zip.file('xl/worksheets/_rels/sheet1.xml.rels',
                        '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
                        '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
                        '<Relationship Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/drawing" Target="/xl/drawings/drawing1.xml" Id="rId1"/>' +
                        '</Relationships>');
                    
                    // Inject drawing reference into sheet1.xml
                    var sheet1WithDrawing = sheet1Xml.replace('</worksheet>',
                        '<drawing r:id="rId1"/></worksheet>');
                    zip.file('xl/worksheets/sheet1.xml', sheet1WithDrawing);
                }
                } catch (e) {
                    console.log('Photo processing error:', e);
                }
                
                // Serialize with temperature data
                var serializer = new XMLSerializer();
                var sheet1WithTemp = serializer.serializeToString(xmlDoc);
                
                // Inject drawing reference if photos exist
                if (photoCount > 0) {
                    sheet1WithTemp = sheet1WithTemp.replace('</worksheet>', '<drawing r:id="rId1"/></worksheet>');
                }
                
                zip.file('xl/worksheets/sheet1.xml', sheet1WithTemp);
                
                return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
            })
            .then(function(blob) {
                document.getElementById('loading-overlay').style.display = 'none';
                var url = URL.createObjectURL(blob);
                var link = document.createElement('a');
                link.download = '供电母排检查测温_' + checkDate + '.xlsx';
                link.href = url;
                link.click();
            })
            .catch(function(e) {
                document.getElementById('loading-overlay').style.display = 'none';
                console.log('Export error:', e);
                alert('导出失败');
            });
    },
    
    base64ToUint8Array: function(base64) {
        var base64Data = base64.split(',')[1] || base64;
        var binaryString = atob(base64Data);
        var bytes = new Uint8Array(binaryString.length);
        for (var i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        return bytes;
    },
    
    clearAll: function() {
        if (confirm('确定要清空所有数据吗？')) {
            this.data = {};
            this.selectedGroup = null;
            this.expandedDevice = null;
            this.saveData();
            this.render();
        }
    }
};

document.addEventListener('DOMContentLoaded', function() {
    BusbarModule.init();
});
