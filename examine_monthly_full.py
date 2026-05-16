import zipfile, openpyxl, shutil, os, re

dst = 'E:/openclaw_workspace/property_maintenance_local/frontend/assets/templates/elevator_monthly_report.xlsx'

with zipfile.ZipFile(dst) as z:
    # Sheet1 full content
    s1 = z.read('xl/worksheets/sheet1.xml').decode('utf-8')
    s2 = z.read('xl/worksheets/sheet2.xml').decode('utf-8')

    # Parse shared strings
    ss_xml = z.read('xl/sharedStrings.xml').decode('utf-8')
    strings = re.findall(r'<t[^>]*>([^<]*)</t>', ss_xml)

    def decode_cell(v, t, ss):
        if t == 's' and v is not None:
            try:
                return strings[int(v)]
            except:
                return v
        return v

    print('=== SHEET1 full row data ===')
    # Parse rows
    rows = re.findall(r'<row[^>]*r="(\d+)"[^>]*>(.*?)</row>', s1, re.DOTALL)
    for rnum, rcontent in rows:
        cells = re.findall(r'<c r="([A-Z]+\d+)"([^>]*)>(.*?)</c>', rcontent, re.DOTALL)
        row_data = {}
        for cref, cattr, ccontent in cells:
            t_match = re.search(r't="([^"]+)"', cattr)
            v_match = re.search(r'<v>(\d+)</v>', ccontent)
            t = t_match.group(1) if t_match else ''
            v = v_match.group(1) if v_match else ''
            col = re.match(r'([A-Z]+)', cref).group(1)
            val = decode_cell(v, t, strings) if v else ''
            if val or t:
                row_data[col] = val
        if row_data:
            print(f'Row {rnum}: {row_data}')

    print('\n=== SHEET2 full row data ===')
    rows2 = re.findall(r'<row[^>]*r="(\d+)"[^>]*>(.*?)</row>', s2, re.DOTALL)
    for rnum, rcontent in rows2:
        cells = re.findall(r'<c r="([A-Z]+\d+)"([^>]*)>(.*?)</c>', rcontent, re.DOTALL)
        row_data = {}
        for cref, cattr, ccontent in cells:
            t_match = re.search(r't="([^"]+)"', cattr)
            v_match = re.search(r'<v>(\d+)</v>', ccontent)
            t = t_match.group(1) if t_match else ''
            v = v_match.group(1) if v_match else ''
            col = re.match(r'([A-Z]+)', cref).group(1)
            val = decode_cell(v, t, strings) if v else ''
            if val or t:
                row_data[col] = val
        if row_data:
            print(f'Row {rnum}: {row_data}')