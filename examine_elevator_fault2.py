import zipfile, openpyxl, shutil, os, re

src = 'E:/openclaw_workspace/property_maintenance_local/frontend/assets/templates/elevator_fault_report.xlsx'

wb = openpyxl.load_workbook(src)

for i, ws in enumerate(wb.worksheets):
    print(f'\n========== Sheet[{i}]: {repr(ws.title)} ==========')
    print(f'Dimensions: {ws.dimensions}')
    # Print all non-empty rows up to row 50
    for row in ws.iter_rows(min_row=1, max_row=50, values_only=True):
        vals = [str(v)[:20] if v is not None else '' for v in row]
        if any(v for v in vals if v.strip()):
            print(f'  {vals}')

# Read shared strings to decode the Chinese labels
with zipfile.ZipFile(src) as z:
    ss = z.read('xl/sharedStrings.xml').decode('utf-8')
    # Extract all <t> content
    strings = re.findall(r'<t[^>]*>([^<]*)</t>', ss)
    print('\n=== Shared Strings (first 80) ===')
    for idx, s in enumerate(strings[:80]):
        print(f'  [{idx}]: {s}')