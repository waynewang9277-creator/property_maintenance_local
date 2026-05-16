# -*- coding: utf-8 -*-
import os

js_path = r'E:\openclaw_workspace\property_maintenance_local\frontend\modules\busbar-check\module.js'

with open(js_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the temperature writing section and add photo code after it
old = '''                // 序列化并保存
                var serializer = new XMLSerializer();
                zip.file('xl/worksheets/sheet1.xml', serializer.serializeToString(xmlDoc));
                
                return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });'''

new = '''                // ---- 填入照片 ----
                var photoCount = 0;
                for (var i = 0; i < self.DEVICES.length; i++) {
                    var device = self.DEVICES[i];
                    var devData = self.data[device.id];
                    if (devData && devData.photo) {
                        photoCount++;
                        zip.file('xl/media/photo_' + device.id + '.png', self.base64ToUint8Array(devData.photo));
                    }
                }
                
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
                        
                        var photoCol = device.col + 1; // 照片列 = 位置列 + 1
                        var photoColLetter = String.fromCharCode(64 + photoCol);
                        
                        drawingRels += '<Relationship Id="rId' + imgIdx + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="/xl/media/photo_' + device.id + '.png"/>';
                        
                        wsDrContent += '<oneCellAnchor editAs="oneCell">' +
                            '<from><col>' + photoCol + '</col><colOff>0</colOff><row>' + device.row + '</row><rowOff>0</rowOff></from>' +
                            '<ext cx="1124712" cy="1216152"/>' +
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
                
                // 序列化并保存
                var serializer = new XMLSerializer();
                zip.file('xl/worksheets/sheet1.xml', serializer.serializeToString(xmlDoc));
                
                return zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });'''

content = content.replace(old, new)

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Added photo embedding code')
