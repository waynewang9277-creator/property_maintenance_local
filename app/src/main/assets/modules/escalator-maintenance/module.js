// EscalatorMaintenance - 电扶梯维护保养模块
var EscalatorModule = {
    STORAGE_KEY: 'escalator_maintenance_data',
    DATA_VERSION: '1.0',
    
    // 两个检查项
    CHECK_ITEMS: [
        { id: 'fence', name: '检查围挡是否符合要求', icon: '🚧' },
        { id: 'work_photo', name: '上传工作照片', icon: '📷' }
    ],
    
    // 数据: { itemId: { photo: 'base64', date: 'YYYY-MM-DD' } }
    data: {},
    
    init: function() {
        this.loadData();
        this.render();
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
        try {
            var dataToSave = {};
            for (var itemId in this.data) {
                if (this.data.hasOwnProperty(itemId)) {
                    dataToSave[itemId] = {
                        date: this.data[itemId].date
                        // 不保存照片到localStorage，避免配额问题
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
            console.warn('saveData: localStorage write failed:', e.message);
        }
    },
    
    render: function() {
        var main = document.getElementById('photo-cards');
        if (!main) return;
        
        var html = '';
        for (var i = 0; i < this.CHECK_ITEMS.length; i++) {
            var item = this.CHECK_ITEMS[i];
            var itemData = this.data[item.id];
            var hasPhoto = itemData && itemData.photo;
            
            html += '<div class="photo-card">';
            html += '<div class="photo-card-header">';
            html += '<span class="photo-card-title">' + item.icon + ' ' + item.name + '</span>';
            html += '<span class="photo-card-badge ' + (hasPhoto ? 'has-photo' : 'no-photo') + '">' + (hasPhoto ? '✓ 已拍照' : '○ 待拍照') + '</span>';
            html += '</div>';
            
            html += '<div class="photo-card-body">';
            
            if (hasPhoto) {
                html += '<img class="photo-preview" src="' + itemData.photo + '" onclick="EscalatorModule.previewPhoto(\'' + this.escapeHtml(item.id) + '\')">';
                html += '<div class="photo-info">';
                html += '<div class="photo-info-label">拍照时间：' + itemData.date + '</div>';
                html += '<button class="btn-retake-photo" onclick="EscalatorModule.takePhoto(\'' + this.escapeHtml(item.id) + '\')">📷 重拍</button>';
                html += '<button class="btn-delete-photo" onclick="EscalatorModule.deletePhoto(\'' + this.escapeHtml(item.id) + '\')">🗑 删除</button>';
                html += '</div>';
            } else {
                html += '<div class="photo-preview-placeholder" onclick="EscalatorModule.takePhoto(\'' + this.escapeHtml(item.id) + '\')">📷</div>';
                html += '<div class="photo-info">';
                html += '<div class="photo-info-label">点击拍照按钮进行拍摄</div>';
                html += '<button class="btn-take-photo" onclick="EscalatorModule.takePhoto(\'' + this.escapeHtml(item.id) + '\')">📷 拍照</button>';
                html += '</div>';
            }
            
            html += '</div></div>';
        }
        
        main.innerHTML = html;
    },
    
    takePhoto: function(itemId) {
        window.parent.requestFileChoose(itemId, function(itemId, base64) {
            if (base64) {
                EscalatorModule.addPhoto(itemId, base64);
            }
        });
    },
    
    addPhoto: function(itemId, photoData) {
        var self = this;
        // 压缩照片
        this.compressImage(photoData, function(compressedPhoto) {
            console.log('Photo compressed, original size:', photoData.length, 'compressed size:', compressedPhoto.length);
            self.data[itemId] = {
                photo: compressedPhoto,
                date: self.formatDate(new Date())
            };
            self.saveData();
            self.render();
        });
    },
    
    // 压缩图片到100KB左右
    compressImage: function(dataUrl, callback) {
        var img = new Image();
        img.crossOrigin = 'anonymous';
        
        var cleanDataUrl = dataUrl.replace(/[\r\n\s]/g, '');
        
        img.onload = function() {
            console.log('compressImage: img loaded, original size:', cleanDataUrl.length, 'dims:', img.width, 'x', img.height);
            
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
    
    deletePhoto: function(itemId) {
        if (confirm('确定要删除这张照片吗？')) {
            delete this.data[itemId];
            this.saveData();
            this.render();
        }
    },
    
    previewPhoto: function(itemId) {
        var data = this.data[itemId];
        if (data && data.photo) {
            window.open(data.photo, '_blank');
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
    
    generatePDF: function() {
        var self = this;
        console.log('generatePDF called, data keys:', Object.keys(this.data));
        
        var JsPDF = typeof jsPDF !== 'undefined' ? jsPDF : (window.jsPDF || self.jsPDF);
        console.log('JsPDF available:', typeof JsPDF !== 'undefined', typeof JsPDF);
        
        if (typeof JsPDF === 'undefined') {
            alert('PDF库加载失败，请刷新页面重试');
            return;
        }
        
        try {
            console.log('Starting PDF generation...');
            
            var pdf = new JsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });
            
            var pageWidth = pdf.internal.pageSize.getWidth();
            var pageHeight = pdf.internal.pageSize.getHeight();
            var margin = 15;
            var y = margin;
            
            // ===== 封面页：标题 + 检查项勾选表 =====
            pdf.setFontSize(18);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Escalator Maintenance Report', pageWidth / 2, y, { align: 'center' });
            y += 12;
            
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'normal');
            pdf.text('Date: ' + this.formatDate(new Date()), margin, y);
            y += 15;
            
            // 检查项列表
            pdf.setFontSize(12);
            pdf.setFont('helvetica', 'bold');
            pdf.text('Inspection Items:', margin, y);
            y += 10;
            
            pdf.setFont('helvetica', 'normal');
            for (var i = 0; i < this.CHECK_ITEMS.length; i++) {
                var item = this.CHECK_ITEMS[i];
                var itemData = this.data[item.id];
                var hasPhoto = itemData && itemData.photo;
                
                // 勾选框
                pdf.setDrawColor(0, 0, 0);
                pdf.rect(margin, y - 4, 5, 5);
                if (hasPhoto) {
                    pdf.setFontSize(12);
                    pdf.text('✓', margin + 0.5, y + 1);
                }
                
                pdf.setFontSize(11);
                pdf.text(item.icon + ' ' + item.name, margin + 8, y);
                
                if (hasPhoto) {
                    pdf.setTextColor(76, 175, 80);
                    pdf.text(' - Completed', margin + 120, y);
                    pdf.setTextColor(0, 0, 0);
                } else {
                    pdf.setTextColor(255, 152, 0);
                    pdf.text(' - Pending', margin + 120, y);
                    pdf.setTextColor(0, 0, 0);
                }
                
                y += 10;
            }
            
            y += 10;
            
            // 分隔线
            pdf.setDrawColor(200, 200, 200);
            pdf.line(margin, y, pageWidth - margin, y);
            y += 15;
            
            // ===== 照片页 =====
            console.log('PDF header done, starting photo pages...');
            
            for (var i = 0; i < this.CHECK_ITEMS.length; i++) {
                var item = this.CHECK_ITEMS[i];
                var itemData = this.data[item.id];
                
                if (!itemData || !itemData.photo) continue;
                
                console.log('Processing photo for:', item.name);
                pdf.addPage();
                
                // 标题
                pdf.setFontSize(14);
                pdf.setFont('helvetica', 'bold');
                pdf.text(item.icon + ' ' + item.name, margin, margin + 5);
                
                // 拍照时间
                pdf.setFontSize(10);
                pdf.setFont('helvetica', 'normal');
                pdf.text('Photo taken: ' + itemData.date, margin, margin + 12);
                
                try {
                    console.log('Adding image to PDF...');
                    pdf.addImage(itemData.photo, 'JPEG', margin, margin + 18, pageWidth - margin * 2, pageHeight - margin * 2 - 18);
                    console.log('Image added successfully');
                } catch(e) {
                    console.error('Image add failed:', e.message);
                    pdf.setFontSize(10);
                    pdf.setFont('helvetica', 'normal');
                    pdf.text('[Photo failed to load]', pageWidth / 2, pageHeight / 2, { align: 'center' });
                }
            }
            
            console.log('All photos processed, saving PDF...');
            
            // 通过原生 Android 桥接保存 PDF
            var pdfBlob = pdf.output('blob');
            var reader = new FileReader();
            reader.onload = function(e) {
                var base64 = e.target.result;
                window.parent.saveFile('电扶梯维护保养_' + self.formatDate(new Date()) + '.pdf', base64);
                window.androidBridge.shareFile(base64, '电扶梯维护保养_' + self.formatDate(new Date()) + '.pdf', 'application/pdf');
                console.log('PDF saved via native bridge');
                alert('PDF已保存到手机 Downloads 文件夹');
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
        if (confirm('确定要清空所有数据吗？')) {
            this.data = {};
            this.saveData();
            this.render();
        }
    }
};

document.addEventListener('DOMContentLoaded', function() {
    EscalatorModule.init();
});
