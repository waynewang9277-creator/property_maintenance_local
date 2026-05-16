import shutil, os, re, zipfile, openpyxl

inbound_dir = 'C:/Users/wq/.openclaw/media/inbound'
files = [f for f in os.listdir(inbound_dir) if f.endswith('.xlsx')]
files.sort(key=lambda f: os.path.getmtime(os.path.join(inbound_dir, f)), reverse=True)
recent = files[0]
print('File:', recent)

src = os.path.join(inbound_dir, recent)
dst = 'E:/openclaw_workspace/property_maintenance_local/frontend/assets/templates/elevator_monthly_report.xlsx'
shutil.copy(src, dst)
print('Copied to:', dst)

# Examine structure
wb = openpyxl.load_workbook(dst)
print('Sheets:')
for i, ws in enumerate(wb.worksheets):
    print(f'  [{i}] {repr(ws.title)} dim={ws.dimensions}')

with zipfile.ZipFile(dst) as z:
    wb_xml = z.read('xl/workbook.xml').decode('utf-8')
    sheets = re.findall(r'name="([^"]+)"', wb_xml)
    print('Sheet names from XML:', sheets[:5])
    wb_rels = z.read('xl/_rels/workbook.xml.rels').decode('utf-8')
    print('Rels:', wb_rels[:600])
    ss_xml = z.read('xl/sharedStrings.xml').decode('utf-8')
    strings = re.findall(r'<t[^>]*>([^<]*)</t>', ss_xml)
    print('Shared strings count:', len(strings))
    for idx, s in enumerate(strings[:30]):
        print(f'  [{idx}]: {s}')