import zipfile, openpyxl, shutil, os, re

# Find the most recent file in media inbound
inbound_dir = 'C:/Users/wq/.openclaw/media/inbound'
files = [f for f in os.listdir(inbound_dir) if f.endswith('.xlsx')]
files.sort(key=lambda f: os.path.getmtime(os.path.join(inbound_dir, f)), reverse=True)
recent = files[0]

src = os.path.join(inbound_dir, recent)
dst = 'E:/openclaw_workspace/property_maintenance_local/frontend/assets/templates/elevator_fault_report.xlsx'
shutil.copy(src, dst)

# Examine
wb = openpyxl.load_workbook(dst)
print('=== Sheets ===')
for i, ws in enumerate(wb.worksheets):
    print(f'Sheet[{i}]: dim={ws.dimensions}')

for i, ws in enumerate(wb.worksheets):
    print(f'\n=== Sheet[{i}] rows 1-15 ===')
    for row in ws.iter_rows(min_row=1, max_row=15, values_only=True):
        vals = [str(v)[:18] if v else '' for v in row]
        if any(v for v in vals if v):
            print(vals)

with zipfile.ZipFile(dst) as z:
    print('\n=== ZIP structure ===')
    for n in z.namelist():
        print(' ', n)
    wb_xml = z.read('xl/workbook.xml').decode('utf-8')
    sheets = re.findall(r'name="([^"]+)"', wb_xml)
    print('\nSheets:', sheets)
    wb_rels = z.read('xl/_rels/workbook.xml.rels').decode('utf-8')
    print('Rels:', wb_rels[:800])