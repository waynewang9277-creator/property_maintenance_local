// PowerRoomMonthly - 强电间月度巡检模块
var PowerRoomModule = {
    STORAGE_KEY: 'power_room_monthly_data',
    DATA_VERSION: '1.0',
    
    // 强电间清单（从Excel解析）
    FLOORS: {
        "1层": ["Q1F-014","Q1F-053","Q1F-054","Q1F-080","Q1F-132","Q1F-139","Q1F-147","Q1F-148","Q1F-149","Q1F-162","Q1F-164","Q1F-172"],
        "2层": ["Q2F-013","Q2F-037","Q2F-045","Q2F-074","Q2F-106","Q2F-121","Q2F-156","Q2F-162","Q2F-171C","Q2F-195","Q2F-196","Q2F-206","Q2F-215","Q2F-217"],
        "3层": ["Q3F-006","Q3F-019","Q3F-034","Q3F-063"],
        "4层": ["Q4F-006","Q4F-025","Q4F-047","Q4F-066"],
        "5层": ["Q5F-004","Q5F-022","Q5F-042A","Q5F-059"],
        "6层": ["Q6F-003","Q6F-008","Q6F-018"],
        "B1层": ["B1-ER1","B1-ER2","B1-ER3","B1-ER4","B1-ER5","B1-ER6","B1-ER8","B1-ER9","B1-ER10","B1-ER11","B1-ER7","B1-ER13","B1-ER14","B1-ER15","B1-ER12","B1-ER16","B1-ER17","B1-ER18","B1-ER19","B1-ER20","B1-ER21","B1-ER22","B1-ER23"],
        "B2层": ["B2-ER1","B2-ER2","B2-ER3","B2-ER4","B2-ER5","B2-ER6","B2-ER7","B2-ER8","B2-ER9","B2-ER10","B2-ER11","B2-ER12","B2-ER13","B2-ER14","B2-ER15","B2-ER16","B2-ER17","B2-ER18","B2-ER19"],
        "B3层": ["B3-ER1","B3-ER2","B3-ER3","B3-ER4","B3-ER5","B3-ER6","B3-ER7","B3-ER8","B3-ER9","B3-ER14","B3-ER15","B3-ER17","B3-ER18","B3-ER23","B3-ER10","B3-ER11","B3-ER13","B3-ER16","B3-ER19","B3-ER20","B3-ER12","B3-ER21","B3-ER22"],
        "OfficeH": ["17A","17B","18A","18B","19A","19B","20A","20B","21A","21B","22A","22B","23A","23B","25A","25B","26A","26B","27A","27B","28A","28B","29A","29B","30A","30B","RF"],
        "OfficeL": ["3A","3B","4A","4B","4C","5A","5B","6A","6B","7A","7B","8A","8B","9A","9B","10A","10B","11A","11B","12A","12B","15A","15B","16A","16B"]
    },
    
    // 数据: { roomId: { photos: ['base64', ...], date: 'YYYY-MM-DD' } }
    data: {},
    
    selectedFloor: null,
    expandedRoom: null,
    
    // 上下文信息（从URL参数传递）
    context: {
        date: null,
        region: null,
        category: 'strong-power'
    },
    
    init: function() {
        this.parseUrlParams();
        this.loadData();
        this.render();
    },
    
    parseUrlParams: function() {
        var params = new URLSearchParams(window.location.search);
        var date = params.get('date');
        var region = params.get('region');
        if (date) this.context.date = date;
        if (region) this.context.region = region;
        console.log('PowerRoomModule context:', this.context);
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
        // 只保存非照片数据到localStorage，避免超过5MB配额
        // 照片数据只存储在内存中，不写入localStorage
        try {
            var dataToSave = {};
            for (var roomId in this.data) {
                if (this.data.hasOwnProperty(roomId)) {
                    dataToSave[roomId] = {
                        date: this.data[roomId].date,
                        // 不保存photos数组，只保留其他数据
                    };
                }
            }
            var toSave = {
                version: this.DATA_VERSION,
                data: dataToSave,
                savedAt: new Date().toISOString()
            };
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(toSave));
        } catch(e) {
            // localStorage 配额不足时忽略，不阻断后续操作
            console.warn('saveData: localStorage write failed:', e.message);
        }
    },
    
    render: function() {
        var main = document.getElementById('room-list');
        if (!main) return;
        
        var html = '';
        var floors = Object.keys(this.FLOORS).sort(function(a, b) {
            if (a.startsWith('B')) {
                if (b.startsWith('B')) {
                    return parseInt(a.replace('B','').replace('层','')) - parseInt(b.replace('B','').replace('层',''));
                }
                return -1;
            }
            if (b.startsWith('B')) return 1;
            if (a.includes('办公楼')) {
                if (b.includes('办公楼')) return a > b ? 1 : -1;
                return 1;
            }
            if (b.includes('办公楼')) return -1;
            return parseInt(a) - parseInt(b);
        });
        
        for (var i = 0; i < floors.length; i++) {
            var floor = floors[i];
            var rooms = this.FLOORS[floor];
            var inspected = this.getInspectedCount(floor);
            var isExpanded = this.selectedFloor === floor;
            
            html += '<div class="floor-item' + (isExpanded ? ' expanded' : '') + '">';
            html += '<div class="floor-header" onclick="PowerRoomModule.toggleFloor(\'' + this.escapeHtml(floor) + '\')">';
            html += '<span class="floor-arrow">' + (isExpanded ? '▼' : '▶') + '</span>';
            html += '<span class="floor-name">' + this.escapeHtml(floor) + '</span>';
            html += '<span class="floor-count">' + inspected + '/' + rooms.length + '</span>';
            html += '</div>';
            
            if (isExpanded) {
                html += '<div class="floor-rooms">';
                for (var j = 0; j < rooms.length; j++) {
                    var room = rooms[j];
                    var roomData = this.data[room];
                    var hasPhoto = roomData && roomData.photos && roomData.photos.length > 0;
                    var isRoomExpanded = this.expandedRoom === room;
                    
                    html += '<div class="room-item' + (hasPhoto ? ' inspected' : '') + '">';
                    html += '<div class="room-header" onclick="PowerRoomModule.toggleRoom(\'' + this.escapeHtml(room) + '\')">';
                    html += '<span class="room-arrow">' + (isRoomExpanded ? '▼' : '▶') + '</span>';
                    html += '<span class="room-name">' + this.escapeHtml(room) + '</span>';
                    html += '<span class="room-status">' + (hasPhoto ? '✓' : '○') + '</span>';
                    html += '</div>';
                    
                    if (isRoomExpanded) {
                        html += '<div class="room-detail">';
                        html += '<div class="photo-area">';
                        if (hasPhoto) {
                            html += '<span style="color:#666;font-size:12px;margin-right:8px;">' + roomData.photos.length + '张照片</span>';
                            html += '<button class="btn-retake-photo" onclick="PowerRoomModule.takePhoto(\'' + this.escapeHtml(room) + '\')">📷 重拍</button>';
                            html += '<button class="btn-delete-photo" onclick="PowerRoomModule.deletePhoto(\'' + this.escapeHtml(room) + '\', -1)" style="margin-left:6px;background:#ff6b6b;color:white;border:none;padding:6px 12px;border-radius:4px;font-size:12px;">🗑 清空</button>';
                        } else {
                            html += '<button class="btn-add-photo" onclick="PowerRoomModule.takePhoto(\'' + this.escapeHtml(room) + '\')">📷 拍照</button>';
                        }
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
    
    toggleFloor: function(floor) {
        if (this.selectedFloor === floor) {
            this.selectedFloor = null;
        } else {
            this.selectedFloor = floor;
            this.expandedRoom = null;
        }
        this.render();
    },
    
    toggleRoom: function(room) {
        if (this.expandedRoom === room) {
            this.expandedRoom = null;
        } else {
            this.expandedRoom = room;
        }
        this.render();
    },
    
    getInspectedCount: function(floor) {
        var rooms = this.FLOORS[floor] || [];
        var count = 0;
        for (var i = 0; i < rooms.length; i++) {
            var roomData = this.data[rooms[i]];
            if (roomData && roomData.photos && roomData.photos.length > 0) {
                count++;
            }
        }
        return count;
    },
    
    takePhoto: function(roomId) {
        // 使用父窗口的文件选择器（因为 WebView 的 WebChromeClient 无法处理 iframe 内部的 input[type=file]）
        window.parent.requestFileChoose(roomId, function(roomId, base64) {
            if (base64) {
                PowerRoomModule.addPhoto(roomId, base64);
            }
        });
    },
    
    addPhoto: function(roomId, photoData) {
        var self = this;
        if (!this.data[roomId]) {
            this.data[roomId] = { photos: [], date: this.formatDate(new Date()) };
        }
        // 压缩照片到100KB左右：缩小尺寸 + JPEG质量压缩
        this.compressImage(photoData, function(compressedPhoto) {
            console.log('Photo compressed, original size:', photoData.length, 'compressed size:', compressedPhoto.length);
            self.data[roomId].photos.push(compressedPhoto);
            self.saveData();
            self.expandedRoom = null;
            self.render();
        });
    },
    
    // 压缩图片到100KB左右
    compressImage: function(dataUrl, callback) {
        var img = new Image();
        img.crossOrigin = 'anonymous';
        
        // 清理base64：去掉可能的换行符和空格
        var cleanDataUrl = dataUrl.replace(/[\r\n\s]/g, '');
        
        img.onload = function() {
            console.log('compressImage: img loaded, original size:', cleanDataUrl.length, 'dims:', img.width, 'x', img.height);
            
            // 缩小尺寸：最长边不超过800px
            var maxSize = 800;
            var width = img.width;
            var height = img.height;
            if (width > maxSize || height > maxSize) {
                if (width > height) {
                    height = Math.round(height * maxSize / width);
                    width = maxSize;
                } else {
                    width = Math.round(width * maxSize / height);
                    height = maxSize;
                }
            }
            console.log('compressImage: resized to:', width, 'x', height);
            
            var canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            
            // JPEG压缩，逐步降低质量直到文件小于100KB
            var quality = 0.8;
            var minQuality = 0.1;
            var tryCompress = function() {
                var result = canvas.toDataURL('image/jpeg', quality);
                var base64Len = result.length - result.indexOf(',') - 1;
                var approxSize = base64Len * 0.75;
                console.log('compressImage: quality', quality.toFixed(1), 'approx size:', Math.round(approxSize / 1024) + 'KB');
                if (quality > minQuality && approxSize > 100 * 1024) {
                    quality -= 0.1;
                    tryCompress();
                } else {
                    console.log('compressImage: final size:', Math.round(approxSize / 1024) + 'KB');
                    callback(result);
                }
            };
            tryCompress();
        };
        img.onerror = function() { 
            console.error('compressImage: img load failed, using original, dataUrl length:', cleanDataUrl.length);
            callback(cleanDataUrl); 
        };
        img.src = cleanDataUrl;
    },
    
    deletePhoto: function(roomId, index) {
        if (this.data[roomId] && this.data[roomId].photos) {
            if (index === -1) {
                // 清空全部照片
                delete this.data[roomId];
            } else {
                this.data[roomId].photos.splice(index, 1);
                if (this.data[roomId].photos.length === 0) {
                    delete this.data[roomId];
                }
            }
            this.saveData();
            this.expandedRoom = null;
            this.render();
        }
    },
    
    previewPhoto: function(roomId, index) {
        var data = this.data[roomId];
        if (data && data.photos[index]) {
            window.open(data.photos[index], '_blank');
        }
    },
    
    formatDate: function(date) {
        var y = date.getFullYear();
        var m = String(date.getMonth() + 1).padStart(2, '0');
        var d = String(date.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + d;
    },
    
    escapeHtml: function(text) {
        if (!text) return '';
        return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },
    
    toGrayImage: function(dataUrl, callback) {
        var img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = function() {
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            var imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            var data = imageData.data;
            for (var i = 0; i < data.length; i += 4) {
                var gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                data[i] = gray;
                data[i + 1] = gray;
                data[i + 2] = gray;
            }
            ctx.putImageData(imageData, 0, 0);
            callback(canvas.toDataURL('image/jpeg', 0.8));
        };
        img.onerror = function() { callback(dataUrl); };
        img.src = dataUrl;
    },
    
    // 同步版本，使用缓存的canvas
    toGraySync: function(dataUrl) {
        var img = new Image();
        img.src = dataUrl;
        if (!img.complete) return dataUrl; // 如果图片还没加载完，返回原图
        
        if (!this._grayCanvas) {
            this._grayCanvas = document.createElement('canvas');
            this._grayCtx = this._grayCanvas.getContext('2d');
        }
        
        this._grayCanvas.width = img.width;
        this._grayCanvas.height = img.height;
        this._grayCtx.drawImage(img, 0, 0);
        
        var imageData = this._grayCtx.getImageData(0, 0, this._grayCanvas.width, this._grayCanvas.height);
        var data = imageData.data;
        for (var i = 0; i < data.length; i += 4) {
            var gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            data[i] = data[i + 1] = data[i + 2] = gray;
        }
        this._grayCtx.putImageData(imageData, 0, 0);
        return this._grayCanvas.toDataURL('image/jpeg', 0.8);
    },
    
    generatePDF: function() {
        var self = this;
        console.log('generatePDF called, data keys:', Object.keys(this.data));
        
        // jsPDF 可能在不同浏览器环境有不同全局变量名
        var JsPDF = typeof jsPDF !== 'undefined' ? jsPDF : (window.jsPDF || self.jsPDF);
        console.log('JsPDF available:', typeof JsPDF !== 'undefined', typeof JsPDF);
        
        if (typeof JsPDF === 'undefined') {
            alert('PDF库加载失败，请刷新页面重试');
            return;
        }
        
        try {
            console.log('Starting PDF generation...');
            console.log('Building summary...');
            // 统计每个楼层的巡检情况
            var summary = [];
            var floors = Object.keys(this.FLOORS);
            var totalPlanned = 0;
            var totalInspected = 0;
            var totalMissed = 0;
            
            for (var i = 0; i < floors.length; i++) {
                var floor = floors[i];
                var rooms = this.FLOORS[floor];
                var inspectedList = [];
                var missedList = [];
                
                for (var j = 0; j < rooms.length; j++) {
                    var room = rooms[j];
                    var roomData = this.data[room];
                    if (roomData && roomData.photos && roomData.photos.length > 0) {
                        inspectedList.push(room);
                    } else {
                        missedList.push(room);
                    }
                }
                
                summary.push({
                    floor: floor,
                    planned: rooms.length,
                    inspected: inspectedList.length,
                    missed: missedList,
                    inspectedList: inspectedList
                });
                
                totalPlanned += rooms.length;
                totalInspected += inspectedList.length;
                totalMissed += missedList.length;
            }
            
            console.log('Summary built, creating PDF object...');
            // 生成PDF
            var pdf = new JsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            var pageWidth = pdf.internal.pageSize.getWidth();
            var pageHeight = pdf.internal.pageSize.getHeight();
            var margin = 15;
            var y = margin;
            
            // ===== 第一页：汇总表（英文避免字体问题）=====
            pdf.setFontSize(16);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Power Room Monthly Inspection Summary', pageWidth / 2, y, { align: 'center' });
            y += 10;
            
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'normal');
            pdf.text('Date: ' + this.formatDate(new Date()), margin, y);
            y += 15;
            
            // 汇总表标题行
            pdf.setFillColor(220, 220, 220);
            pdf.rect(margin, y, pageWidth - margin * 2, 8, 'F');
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Floor', margin + 2, y + 5.5);
            pdf.text('Plan', margin + 55, y + 5.5);
            pdf.text('Done', margin + 75, y + 5.5);
            pdf.text('Missed', margin + 95, y + 5.5);
            y += 8;
            
            // 汇总数据行 - 每行一个楼层，missed列表自动换行
            pdf.setFont('helvetica', 'normal');
            for (var i = 0; i < summary.length; i++) {
                var item = summary[i];
                
                // 计算需要的行数（每行约60mm宽）
                var missedStr = item.missed.length > 0 ? item.missed.join(',') : '-';
                var availableWidth = pageWidth - margin - 97; // Missed列起始位置到右边距
                var charWidth = 2; // 估算每个字符宽度
                var charsPerLine = Math.floor(availableWidth / charWidth);
                
                // 将missed列表拆分成多行
                var missedLines = [];
                if (item.missed.length > 0) {
                    var words = missedStr.split(',');
                    var currentLine = '';
                    for (var w = 0; w < words.length; w++) {
                        if (currentLine.length + words[w].length + 1 > charsPerLine && currentLine.length > 0) {
                            missedLines.push(currentLine);
                            currentLine = words[w];
                        } else {
                            if (currentLine.length > 0) currentLine += ',';
                            currentLine += words[w];
                        }
                    }
                    if (currentLine.length > 0) missedLines.push(currentLine);
                } else {
                    missedLines = ['-'];
                }
                
                var rowHeight = 8 + Math.max(0, (missedLines.length - 1) * 5);
                
                if (y + rowHeight > pageHeight - margin) {
                    pdf.addPage();
                    y = margin;
                }
                
                pdf.text(item.floor, margin + 2, y + 5);
                pdf.text(String(item.planned), margin + 57, y + 5);
                pdf.text(String(item.inspected), margin + 77, y + 5);
                
                pdf.setTextColor(255, 0, 0);
                for (var ml = 0; ml < missedLines.length; ml++) {
                    pdf.text(missedLines[ml], margin + 97, y + 5 + ml * 5);
                }
                pdf.setTextColor(0, 0, 0);
                
                pdf.setDrawColor(200, 200, 200);
                pdf.line(margin, y + rowHeight, pageWidth - margin, y + rowHeight);
                
                y += rowHeight;
            }
            
            // 总计行
            y += 3;
            pdf.setFont('helvetica', 'bold');
            pdf.setFillColor(240, 240, 240);
            pdf.rect(margin, y, pageWidth - margin * 2, 8, 'F');
            pdf.text('Total', margin + 2, y + 5.5);
            pdf.text(String(totalPlanned), margin + 57, y + 5.5);
            pdf.text(String(totalInspected), margin + 77, y + 5.5);
            pdf.setTextColor(255, 0, 0);
            pdf.text(String(totalMissed), margin + 97, y + 5.5);
            pdf.setTextColor(0, 0, 0);
            y += 15;
            
            // 分隔线
            pdf.setDrawColor(0, 0, 0);
            pdf.line(margin, y, pageWidth - margin, y);
            y += 10;
            
            console.log('PDF header done, starting photo pages...');
            
            // ===== 照片页（只有照片，无文字）=====
            for (var i = 0; i < summary.length; i++) {
                var item = summary[i];
                if (item.inspectedList.length === 0) continue;
                
                for (var j = 0; j < item.inspectedList.length; j++) {
                    var room = item.inspectedList[j];
                    var roomData = this.data[room];
                    
                    if (!roomData || !roomData.photos || roomData.photos.length === 0) continue;
                    
                    for (var k = 0; k < roomData.photos.length; k++) {
                        console.log('Processing photo', k, 'for room', room);
                        // 每张照片一张A4纸，带标题
                        pdf.addPage();
                        
                        // 标题：强电间编号
                        pdf.setFontSize(14);
                        pdf.setFont('helvetica', 'bold');
                        pdf.text(room, margin, margin + 5);
                        
                        try {
                            // 直接添加图片（不转换黑白，避免大图片处理超时）
                            console.log('Adding image to PDF...');
                            pdf.addImage(roomData.photos[k], 'JPEG', margin, margin + 10, pageWidth - margin * 2, pageHeight - margin * 2 - 10);
                            console.log('Image added successfully');
                        } catch(e) {
                            console.error('Image add failed:', e.message);
                            pdf.setFontSize(10);
                            pdf.setFont('helvetica', 'normal');
                            pdf.text('[Photo failed to load]', pageWidth / 2, pageHeight / 2, { align: 'center' });
                        }
                    }
                }
            }
            
            console.log('All photos processed, saving PDF...');
            
            // 通过原生 Android 桥接保存 PDF（避免 WebView blob 下载失效）
            var pdfBlob = pdf.output('blob');
            var reader = new FileReader();
            var selfRef = self;
            var completedDate = selfRef.formatDate(new Date());
            reader.onload = async function(e) {
                var base64 = e.target.result; // 包含 data:application/pdf;base64, 前缀
                
                // 保存PDF到本地
                window.parent.saveFile('强电间巡检_' + completedDate + '.pdf', base64);
                window.androidBridge.shareFile(base64, '强电间巡检_' + completedDate + '.pdf', 'application/pdf');
                console.log('PDF saved via native bridge');
                
                // 上报到服务器
                if (selfRef.context.date) {
                    try {
                        console.log('Uploading report to server...');
                        var reportData = {
                            category: selfRef.context.category,
                            content: '强电间月度巡检 - ' + selfRef.context.date,
                            executor: '',
                            completedDate: completedDate,
                            date: selfRef.context.date,
                            region: selfRef.context.region,
                            moduleId: 'item-6',
                            photos: []
                        };
                        
                        // 收集照片
                        for (var roomId in selfRef.data) {
                            if (selfRef.data[roomId] && selfRef.data[roomId].photos) {
                                reportData.photos = reportData.photos.concat(selfRef.data[roomId].photos);
                            }
                        }
                        
                        var result = await ApiClient.submitReport(reportData);
                        console.log('Report upload result:', result);
                        
                        if (result.success) {
                            // 标记计划为已完成
                            try {
                                var completeData = {
                                    category: selfRef.context.category,
                                    date: selfRef.context.date,
                                    moduleId: 'item-6',
                                    region: selfRef.context.region,
                                    completedDate: completedDate
                                };
                                var completeResult = await ApiClient.completeReport(completeData);
                                console.log('Complete result:', completeResult);
                                if (completeResult.success) {
                                    alert('PDF已保存到手机 Downloads 文件夹\n报告已上传到服务器\n计划已标记为已完成');
                                } else {
                                    alert('PDF已保存到手机 Downloads 文件夹\n报告已上传到服务器\n计划标记完成失败');
                                }
                            } catch(e2) {
                                console.error('Complete error:', e2);
                                alert('PDF已保存到手机 Downloads 文件夹\n报告已上传到服务器\n计划标记完成失败');
                            }
                        } else {
                            alert('PDF已保存到手机 Downloads 文件夹\n报告上传失败: ' + (result.message || ''));
                        }
                    } catch(e) {
                        console.error('Report upload error:', e);
                        alert('PDF已保存到手机 Downloads 文件夹\n报告上传失败: ' + e.message);
                    }
                } else {
                    alert('PDF已保存到手机 Downloads 文件夹');
                }
            };
            reader.onerror = function(e) {
                console.error('FileReader error:', e);
                alert('PDF保存失败');
            };
            reader.readAsDataURL(pdfBlob);
        } catch(e) {
            console.error('PDF generation failed:', e);
            alert('PDF生成失败: ' + e.message);
        }
    },
    
    clearAll: function() {
        if (confirm('确定要清空所有巡检数据吗？')) {
            this.data = {};
            this.selectedFloor = null;
            this.expandedRoom = null;
            this.saveData();
            this.render();
        }
    }
};

document.addEventListener('DOMContentLoaded', function() {
    PowerRoomModule.init();
});
