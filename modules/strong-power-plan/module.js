// 强电维保计划模块 - module.js
// 导出功能：JSZip+XML方式，不动模板格式

var StrongPowerPlanModule = {
    STORAGE_KEY: 'plan_strong_power',
    TEMPLATE_URL: '../../templates/维保计划-强电-modified.xlsx',

    // 维保项目列表（共16项）
    ITEMS: [
        { id: 1,  name: '应急装置电池放电时间测试', code: 'SHKS-RO-2579', freq: '每季度一次' },
        { id: 2,  name: '擦窗机保养',               code: '质保商提供',    freq: '质保期内' },
        { id: 3,  name: '应急发电机保养',           code: '质保商提供',    freq: '质保期内' },
        { id: 4,  name: '电容检查及测温',             code: '外判商提供',    freq: '每月' },
        { id: 5,  name: '供电母排检查测温记录表',    code: 'SHKS/RO/2511',  freq: '每月' },
        { id: 6,  name: '强电间月度巡检',            code: 'SHKS-RO-2514',  freq: '每月四次' },
        { id: 7,  name: '高压绝缘工具预防性试验',    code: '年检报告',       freq: '半年/一年一次' },
        { id: 8,  name: '高压供电系统检查',           code: '外判商提供',    freq: '每月每天' },
        { id: 9,  name: '泛光/景观照明系统检查',      code: 'SHKS-RO-2583',  freq: '质保期内' },
        { id: 10, name: '外围LOGO灯箱年检及备案',    code: '年检报告及备案凭证', freq: '一年一次' },
        { id: 11, name: '供配电设备电控箱月度检查',  code: '质保商提供',    freq: '质保期内' },
        { id: 12, name: '防雷检测',                   code: '检测单位提供',  freq: '每年一次' },
        { id: 13, name: '电梯扶手梯故障报告',         code: '质保商提供',    freq: '每月' },
        { id: 14, name: '电梯/扶手梯年检',            code: '政府年检报告合格证', freq: '每台电梯每年一次' },
        { id: 15, name: '电扶梯维护保养',             code: '质保商提供',    freq: '不超过15天保养一次' },
        { id: 16, name: '电梯逃生门检查',             code: 'SHKS-RO-2557',  freq: '每季一次' }
    ],

    // 颜色样式索引（修改后的模板添加的样式）
    STYLE_BLACK: 79,       // 办公楼计划 - 黑色填充 (AK38)
    STYLE_DARK_BLUE: 81,  // 商场计划 - 蓝色填充 (AT38)
    STYLE_DARK_GREEN: 83, // 已执行 - 绿色填充 (BE38)

    // 数据结构: { "2026-05": { items: { 1: { office: [1,2,3], mall: [5,6], exec: { office: [1], mall: [2] } } } } }
    // yearMonth: "2026-05"
    // items[itemId].office: [days planned for office]
    // items[itemId].mall: [days planned for mall]
    // items[itemId].exec: { office: [days executed], mall: [days executed] }

    data: {},

    init: function() {
        this.loadData();
    },

    loadData: function() {
        var stored = localStorage.getItem(this.STORAGE_KEY);
        if (stored) {
            try {
                this.data = JSON.parse(stored);
            } catch(e) {
                this.data = {};
            }
        } else {
            this.data = {};
        }
    },

    saveData: function() {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
    },

    // 获取某月的所有计划数据
    getMonthData: function(yearMonth) {
        // yearMonth = "2026-05"
        var parts = yearMonth.split('-');
        var year = parseInt(parts[0]);
        var month = parseInt(parts[1]);
        var daysInMonth = new Date(year, month, 0).getDate();

        var result = {};
        for (var itemId = 1; itemId <= 16; itemId++) {
            result[itemId] = {
                office: [],
                mall: [],
                exec: { office: [], mall: [] }
            };
        }

        // 从localStorage读取每天的数据
        for (var d = 1; d <= daysInMonth; d++) {
            var dateStr = yearMonth + '-' + String(d).padStart(2, '0');
            var dayData = this.data[dateStr];
            if (!dayData) continue;

            for (var i = 0; i < dayData.length; i++) {
                var entry = dayData[i];
                var itemId = parseInt(entry.moduleId.replace('item-', ''));
                if (!result[itemId]) continue;

                var region = entry.region; // 'office' or 'mall'
                var checked = entry.checked;

                if (region === 'office') {
                    if (checked) {
                        result[itemId].exec.office.push(d);
                    } else {
                        result[itemId].office.push(d);
                    }
                } else if (region === 'mall') {
                    if (checked) {
                        result[itemId].exec.mall.push(d);
                    } else {
                        result[itemId].mall.push(d);
                    }
                }
            }
        }

        return result;
    },

    // 导出Excel
    exportExcel: function(yearMonth) {
        var self = this;
        // 重新加载最新数据
        this.loadData();
        // yearMonth = "2026-05"
        var parts = yearMonth.split('-');
        var year = parseInt(parts[0]);
        var month = parseInt(parts[1]);

        var JSZip = window.JSZip;
        var parser = new DOMParser();
        var NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';

        // Android WebView 不支持 fetch(file://)，改用 XMLHttpRequest
        var xhr = new XMLHttpRequest();
        xhr.open('GET', this.TEMPLATE_URL, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function() {
            if (xhr.status !== 200) {
                alert('模板加载失败: ' + xhr.status);
                return;
            }
            var buf = xhr.response;
            JSZip.loadAsync(buf).then(function(zip) {
                return zip.file('xl/worksheets/sheet1.xml').async('string').then(function(xml) {
                    return { zip: zip, sheetXml: xml };
                });
            }).then(function(data) {
                var zip = data.zip;
                var sheetXml = data.sheetXml;
                var doc = parser.parseFromString(sheetXml, 'text/xml');
                var nsMap = { 'x': NS };

                // 获取月份数据
                var monthData = self.getMonthData(yearMonth);

                // 填表头：AA2=年份, AE2=月份
                self.setCellValue(doc, 'AA2', String(year));
                self.setCellValue(doc, 'AE2', String(month));

                // 填充每天的单元格
                for (var itemId = 1; itemId <= 16; itemId++) {
                    var planRow = 4 + itemId * 2;
                    var execRow = planRow + 1;
                    var itemPlan = monthData[itemId];

                    for (var day = 1; day <= 31; day++) {
                        var col1 = self.dayCol(day, 1);
                        var col2 = self.dayCol(day, 2);

                        // --- 计划行 ---
                        var hasOfficePlan = itemPlan.office.indexOf(day) >= 0;
                        var hasMallPlan = itemPlan.mall.indexOf(day) >= 0;

                        if (hasOfficePlan) {
                            self.setCellValueAndStyle(doc, col1 + planRow, '', self.STYLE_BLACK);
                        }
                        if (hasMallPlan) {
                            self.setCellValueAndStyle(doc, col2 + planRow, '', self.STYLE_DARK_BLUE);
                        }

                        // --- 执行行 ---
                        var hasOfficeExec = itemPlan.exec.office.indexOf(day) >= 0;
                        var hasMallExec = itemPlan.exec.mall.indexOf(day) >= 0;

                        if (hasOfficeExec) {
                            self.setCellValueAndStyle(doc, col1 + execRow, '', self.STYLE_DARK_GREEN);
                        }
                        if (hasMallExec) {
                            self.setCellValueAndStyle(doc, col2 + execRow, '', self.STYLE_DARK_GREEN);
                        }
                    }
                }

                // 序列化修改后的XML
                var serializer = new XMLSerializer();
                var modifiedSheet = serializer.serializeToString(doc);

                zip.file('xl/worksheets/sheet1.xml', modifiedSheet);

                return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
            }).then(function(blob) {
                // 转换为 base64 通过 Android 桥接保存到 Downloads
                var reader = new FileReader();
                reader.onload = function(e) {
                    var base64 = e.target.result;
                    var fileName = '强电维保计划_' + year + '年' + month + '月.xlsx';
                    if (window.androidBridge && window.androidBridge.shareFile) {
                        window.androidBridge.saveFile(base64, fileName);
                        window.androidBridge.shareFile(base64, fileName, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                    } else {
                        // 降级：浏览器直接下载
                        var url = URL.createObjectURL(blob);
                        var link = document.createElement('a');
                        link.download = fileName;
                        link.href = url;
                        link.click();
                    }
                    alert('导出成功！');
                };
                reader.readAsDataURL(blob);
            }).catch(function(e) {
                alert('导出失败: ' + e.message);
            });
        };
        xhr.onerror = function() {
            alert('模板加载失败，请检查网络或文件路径');
        };
        xhr.send();
    },

    // 根据日期计算列字母 (day 1-31, colType 1=办公楼/奇数列, 2=商场/偶数列)
    dayCol: function(day, colType) {
        var colIndex;
        if (colType === 1) {
            colIndex = 5 + (day - 1) * 2;
        } else {
            colIndex = 6 + (day - 1) * 2;
        }
        return this.colIndexToLetter(colIndex);
    },

    // 列索引转字母 (1=A, 2=B, ... 26=Z, 27=AA, 28=AB...)
    colIndexToLetter: function(colIndex) {
        var letter = '';
        while (colIndex > 0) {
            var mod = (colIndex - 1) % 26;
            letter = String.fromCharCode(65 + mod) + letter;
            colIndex = Math.floor((colIndex - 1) / 26);
        }
        return letter;
    },

    // 设置单元格值（保留原样式，只改内容）
    setCellValue: function(doc, cellRef, value) {
        var cell = doc.querySelector('c[r="' + cellRef + '"]');
        if (!cell) {
            console.warn('Cell not found:', cellRef);
            return;
        }
        cell.removeAttribute('t');
        var existingV = cell.querySelector('v');
        if (existingV) cell.removeChild(existingV);
        var v = doc.createElementNS('http://schemas.openxmlformats.org/spreadsheetml/2006/main', 'v');
        v.textContent = value;
        cell.appendChild(v);
    },

    // 设置单元格值和样式（style是xf索引）
    setCellValueAndStyle: function(doc, cellRef, value, styleIndex) {
        var cell = doc.querySelector('c[r="' + cellRef + '"]');
        if (!cell) {
            console.warn('Cell not found:', cellRef);
            return;
        }
        cell.setAttribute('s', String(styleIndex));
        cell.removeAttribute('t');
        var existingV = cell.querySelector('v');
        if (existingV) cell.removeChild(existingV);
        if (value) {
            var v = doc.createElementNS('http://schemas.openxmlformats.org/spreadsheetml/2006/main', 'v');
            v.textContent = value;
            cell.appendChild(v);
        }
    },

    base64ToUint8Array: function(base64) {
        var data = base64.split(',')[1] || base64;
        var binary = atob(data);
        var bytes = new Uint8Array(binary.length);
        for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        return bytes;
    }
};

document.addEventListener('DOMContentLoaded', function() {
    StrongPowerPlanModule.init();
});
