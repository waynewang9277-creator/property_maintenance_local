// 强电维保计划模块 - module.js
// 导出功能：JSZip+XML方式，不动模板格式

var StrongPowerPlanModule = {
    STORAGE_KEY: 'plan_strong_power',
    TEMPLATE_URL: '../../assets/templates/维保计划-强电-modified.xlsx',
    
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
        
        console.log('getMonthData called, yearMonth:', yearMonth, 'daysInMonth:', daysInMonth);
        console.log('localStorage data keys:', Object.keys(this.data));
        
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
            console.log('day', d, 'dateStr:', dateStr, 'dayData:', JSON.stringify(dayData));
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

        fetch(this.TEMPLATE_URL)
            .then(function(res) { return res.arrayBuffer(); })
            .then(function(buf) { return JSZip.loadAsync(buf); })
            .then(function(zip) {
                return zip.file('xl/worksheets/sheet1.xml').async('string').then(function(xml) {
                    return { zip: zip, sheetXml: xml };
                });
            })
            .then(function(data) {
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
                // 日期列规律：E=day1_col1, F=day1_col2, G=day2_col1, H=day2_col2...
                // 对于每个日期(day 1-31)，列对(col1, col2):
                //   col1 (奇数列) = 办公楼
                //   col2 (偶数列) = 商场
                // 行规律：每项2行，计划行(奇数行如6,8,10...)，执行行(偶数如7,9,11...)
                // itemId=1 -> 计划行6, 执行行7
                // itemId=2 -> 计划行8, 执行行9
                // ...
                // itemId=n -> 计划行=5+n*2, 执行行=6+n*2

                alert('self.data: ' + typeof self.data + ', self.STORAGE_KEY: ' + self.STORAGE_KEY);

                for (var itemId = 1; itemId <= 16; itemId++) {
                    var planRow = 4 + itemId * 2;   // e.g. item1=6, item2=8...
                    var execRow = planRow + 1;         // e.g. item1=7, item2=9...
                    var itemPlan = monthData[itemId];

                    // 日期列填充 (day 1-31)
                    for (var day = 1; day <= 31; day++) {
                        var col1 = self.dayCol(day, 1); // 奇数列 -> 办公楼
                        var col2 = self.dayCol(day, 2); // 偶数列 -> 商场
                        
                        // --- 计划行 ---
                        var hasOfficePlan = itemPlan.office.indexOf(day) >= 0;
                        var hasMallPlan = itemPlan.mall.indexOf(day) >= 0;

                        if (hasOfficePlan || hasMallPlan) {
                            alert('itemId=' + itemId + ', day=' + day + ', hasOffice=' + hasOfficePlan + ', hasMall=' + hasMallPlan + ', office=' + JSON.stringify(itemPlan.office) + ', mall=' + JSON.stringify(itemPlan.mall));
                        }

                        if (hasOfficePlan) {
                            var cellRef = col1 + planRow;
                            // 调试：写入 day 和 itemId 作为单元格值（临时调试用）
                            self.setCellValueAndStyle(doc, cellRef, '', self.STYLE_BLACK);
                        }
                        if (hasMallPlan) {
                            var cellRef = col2 + planRow;
                            self.setCellValueAndStyle(doc, cellRef, '', self.STYLE_DARK_BLUE);
                        }

                        // --- 执行行 ---
                        var hasOfficeExec = itemPlan.exec.office.indexOf(day) >= 0;
                        var hasMallExec = itemPlan.exec.mall.indexOf(day) >= 0;

                        if (hasOfficeExec) {
                            var cellRef = col1 + execRow;
                            self.setCellValueAndStyle(doc, cellRef, '', self.STYLE_DARK_GREEN);
                        }
                        if (hasMallExec) {
                            var cellRef = col2 + execRow;
                            self.setCellValueAndStyle(doc, cellRef, '', self.STYLE_DARK_GREEN);
                        }
                    }
                }

                // 序列化修改后的XML
                var serializer = new XMLSerializer();
                var modifiedSheet = serializer.serializeToString(doc);
                
                zip.file('xl/worksheets/sheet1.xml', modifiedSheet);

                return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
            })
            .then(function(blob) {
                var url = URL.createObjectURL(blob);
                var link = document.createElement('a');
                link.download = '强电维保计划_' + year + '年' + month + '月.xlsx';
                link.href = url;
                link.click();
            })
            .catch(function(e) {
                console.error('Export error:', e);
                alert('导出失败: ' + e.message);
            });
    },

    // 根据日期计算列字母 (day 1-31, colType 1=办公楼/奇数列, 2=商场/偶数列)
    // day1=E(5), F(6); day2=G(7), H(8); day3=I(9), J(10)...
    // 规律: day_n col1 = column(5 + (n-1)*2), col2 = column(6 + (n-1)*2)
    dayCol: function(day, colType) {
        var colIndex;
        if (colType === 1) {
            colIndex = 5 + (day - 1) * 2;       // 奇数列
        } else {
            colIndex = 6 + (day - 1) * 2;       // 偶数列
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
        // Remove type attribute if present (we're setting plain string/number)
        cell.removeAttribute('t');
        // Remove existing v
        var existingV = cell.querySelector('v');
        if (existingV) cell.removeChild(existingV);
        // Add new v
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
        // Change style
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