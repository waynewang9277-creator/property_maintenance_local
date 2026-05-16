import zipfile, openpyxl, re

dst = 'E:/openclaw_workspace/property_maintenance_local/frontend/assets/templates/elevator_monthly_report.xlsx'

with zipfile.ZipFile(dst) as z:
    ss_xml = z.read('xl/sharedStrings.xml').decode('utf-8')
    strings = re.findall(r'<t[^>]*>([^<]*)</t>', ss_xml)
    print('All strings:')
    for idx, s in enumerate(strings):
        print('  [%d]: %s' % (idx, s))

    s1 = z.read('xl/worksheets/sheet1.xml').decode('utf-8')
    rows = re.findall(r'<row[^>]*r="(\d+)"[^>]*>(.*?)</row>', s1, re.DOTALL)
    print('\n=== Sheet1 row data ===')
    for rnum, rcontent in rows[:50]:
        cells = re.findall(r'<c r="([A-Z]+\d+)"([^>]*)>(.*?)</c>', rcontent, re.DOTALL)
        row_data = {}
        for cref, cattr, ccontent in cells:
            v_match = re.search(r'<v>(\d+)</v>', ccontent)
            t_match = re.search(r't="([^"]+)"', cattr)
            v = v_match.group(1) if v_match else ''
            t = t_match.group(1) if t_match else ''
            col = re.match(r'([A-Z]+)', cref).group(1)
            if t == 's' and v:
                try:
                    val = strings[int(v)]
                except:
                    val = v
            elif v:
                val = v
            else:
                val = ''
            if val:
                row_data[col] = val
        if row_data:
            print('Row %s: %s' % (rnum, row_data))