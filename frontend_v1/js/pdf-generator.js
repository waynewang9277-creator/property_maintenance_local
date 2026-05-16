// PDF Generator - 使用 jsPDF 在浏览器端生成 PDF
const PDFGenerator = {
    // 生成 PDF
    generate(data, callback) {
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', 'a4');
            
            const pageWidth = 210;
            const pageHeight = 297;
            const margin = 25;
            
            let y = margin;
            
            // 标题
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            const title = '应急装置电池放电时间记录表';
            const titleWidth = doc.getTextWidth(title);
            doc.text(title, (pageWidth - titleWidth) / 2, y);
            y += 15;

            // 测试信息
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            
            doc.text(`安装地点：${data.location || ''}`, margin, y);
            y += 7;
            
            const testDate = data.testDate || '';
            const testTime = data.testTime || '';
            doc.text(`测试日期：${testDate} ${testTime}`, margin, y);
            y += 10;

            // 表格标题
            doc.setFillColor(240, 240, 240);
            doc.rect(margin, y - 5, pageWidth - 2 * margin, 8, 'F');
            doc.setFontSize(9);
            doc.text('序号', margin + 3, y);
            doc.text('剩余电量%', margin + 25, y);
            doc.text('测试时间', margin + 60, y);
            doc.text('备注', margin + 100, y);
            y += 8;

            // 表格内容
            doc.setFontSize(9);
            const records = data.records || [];
            records.forEach((record, index) => {
                if (y > pageHeight - 40) {
                    doc.addPage();
                    y = margin;
                }
                
                doc.text(String(index + 1), margin + 3, y);
                doc.text(`${record.voltage}%`, margin + 25, y);
                doc.text(`${index * 20}分钟`, margin + 60, y);
                doc.text(record.note || '-', margin + 100, y);
                
                // 画线
                doc.setDrawColor(200, 200, 200);
                doc.line(margin, y, pageWidth - margin, y);
                
                y += 7;
            });

            // 签字栏
            y += 10;
            doc.setFontSize(9);
            const colWidth = (pageWidth - 2 * margin) / 3;
            
            // 操作者
            doc.text('操作者：', margin, y);
            doc.line(margin + 15, y + 2, margin + colWidth - 5, y + 2);
            y += 8;
            doc.text('日期：', margin, y);
            doc.line(margin + 12, y + 2, margin + colWidth - 5, y + 2);
            
            // 领班
            const col2X = margin + colWidth;
            doc.text('领班：', col2X, y - 8);
            doc.line(col2X + 12, y - 6, col2X + colWidth - 5, y - 6);
            doc.text('日期：', col2X, y);
            doc.line(col2X + 12, y + 2, col2X + colWidth - 5, y + 2);
            
            // 工程主任
            const col3X = margin + colWidth * 2;
            doc.text('工程主任：', col3X, y - 8);
            doc.line(col3X + 18, y - 6, col3X + colWidth - 5, y - 6);
            doc.text('日期：', col3X, y);
            doc.line(col3X + 12, y + 2, col3X + colWidth - 5, y + 2);

            // 表单编号
            y += 15;
            doc.setFontSize(7);
            doc.text('SHKS/R0/2579/REV03/20240630', margin, y);

            // 返回 PDF 数据
            const pdfBlob = doc.output('blob');
            callback({ success: true, blob: pdfBlob, url: URL.createObjectURL(pdfBlob) });
        } catch (error) {
            console.error('PDF generation error:', error);
            callback({ success: false, error: error.message });
        }
    },

    // 下载 PDF
    download(blob, filename) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    },

    // 分享 PDF（通过微信）
    share(blob, filename) {
        // 使用 wx SDK 分享，或者通过 Blob URL 打开
        const url = URL.createObjectURL(blob);
        
        // 创建临时链接供下载
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
};

// 导出给全局使用
window.PDFGenerator = PDFGenerator;