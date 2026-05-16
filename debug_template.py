import zipfile

path = 'E:/openclaw_workspace/property_maintenance_local/frontend/assets/templates/capacitor_template_new.xlsx'
with zipfile.ZipFile(path) as z:
    print('Files in zip:')
    for n in z.namelist():
        print(' ', n)

    print('\n=== sheet2.xml first 200 ===')
    s2 = z.read('xl/worksheets/sheet2.xml').decode('utf-8')
    print(s2[:200])
    print('\n=== Content_Types.xml ===')
    print(z.read('[Content_Types].xml').decode('utf-8'))