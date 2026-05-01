# -*- coding: utf-8 -*-
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# Register Chinese fonts
pdfmetrics.registerFont(TTFont('SimHei', 'C:/Windows/Fonts/simhei.ttf'))
pdfmetrics.registerFont(TTFont('SimSun', 'C:/Windows/Fonts/simsun.ttc'))

# Read markdown content
with open(r'E:\android studio\projects\PropertyMaintenance\问题总结.md', 'r', encoding='utf-8') as f:
    content = f.read()

# Create PDF
doc = SimpleDocTemplate(
    r'E:\android studio\projects\PropertyMaintenance\问题总结.pdf',
    pagesize=A4,
    leftMargin=2*cm,
    rightMargin=2*cm,
    topMargin=2*cm,
    bottomMargin=2*cm
)

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(
    name='ChineseTitle',
    fontName='SimHei',
    fontSize=18,
    leading=24,
    alignment=TA_CENTER,
    spaceAfter=20
))
styles.add(ParagraphStyle(
    name='ChineseBody',
    fontName='SimSun',
    fontSize=10,
    leading=16,
    alignment=TA_LEFT,
    spaceAfter=10
))
styles.add(ParagraphStyle(
    name='ChineseH1',
    fontName='SimHei',
    fontSize=14,
    leading=20,
    spaceBefore=15,
    spaceAfter=10
))
styles.add(ParagraphStyle(
    name='ChineseH2',
    fontName='SimHei',
    fontSize=12,
    leading=16,
    spaceBefore=10,
    spaceAfter=8
))
styles.add(ParagraphStyle(
    name='ChineseCode',
    fontName='Courier',
    fontSize=8,
    leading=12,
    backColor=colors.lightgrey,
    leftIndent=10,
    rightIndent=10,
    spaceBefore=5,
    spaceAfter=5
))

story = []
lines = content.split('\n')
i = 0
while i < len(lines):
    line = lines[i].strip()
    
    if line.startswith('# ') and '问题总结' in line:
        story.append(Paragraph(line.replace('# ', ''), styles['ChineseTitle']))
    elif line.startswith('## '):
        story.append(Spacer(1, 10))
        story.append(Paragraph(line.replace('## ', ''), styles['ChineseH1']))
    elif line.startswith('### '):
        story.append(Spacer(1, 8))
        story.append(Paragraph(line.replace('### ', ''), styles['ChineseH2']))
    elif line.startswith('| '):
        cells = [c.strip() for c in line.split('|')[1:-1]]
        story.append(Spacer(1, 3))
        story.append(Paragraph(' | '.join(cells), styles['ChineseBody']))
    elif line.startswith('- '):
        story.append(Paragraph(line, styles['ChineseBody']))
    elif line.startswith('```'):
        code_lines = []
        i += 1
        while i < len(lines) and not lines[i].strip().startswith('```'):
            code_lines.append(lines[i])
            i += 1
        code_text = '\n'.join(code_lines)
        story.append(Paragraph(code_text.replace('<', '&lt;').replace('>', '&gt;'), styles['ChineseCode']))
    elif line.startswith('**') and line.endswith('**'):
        story.append(Paragraph(line.replace('**', ''), styles['ChineseBody']))
    elif line:
        story.append(Paragraph(line, styles['ChineseBody']))
    else:
        story.append(Spacer(1, 5))
    i += 1

doc.build(story)
print("PDF created successfully!")