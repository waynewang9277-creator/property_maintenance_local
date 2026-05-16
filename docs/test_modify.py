# -*- coding: utf-8 -*-
import zipfile
import os

# The generated Excel file - need to find it
# For now, let's check if our template when modified works

xlsx_path = r'E:\openclaw_workspace\property_maintenance_local\frontend\assets\templates\busbar_template.xlsx'

with zipfile.ZipFile(xlsx_path, 'r') as z:
    sheet_xml = z.read('xl/worksheets/sheet1.xml').decode('utf-8')

# Simulate what JS code does: modify D6 with value
# Parse XML
import xml.etree.ElementTree as ET
root = ET.fromstring(sheet_xml)
ns = {'x': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}

# Find D6 cell
d6 = root.find('.//x:c[@r="D6"]', ns)
if d6 is not None:
    print('Found D6 cell')
    print('Before:', ET.tostring(d6, encoding='unicode'))
    
    # Remove existing v if any
    v_elem = d6.find('x:v', ns)
    if v_elem is not None:
        d6.remove(v_elem)
    
    # Create new v
    v_new = ET.SubElement(d6, '{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
    v_new.text = 'Test Value'
    d6.set('t', 'str')
    
    print('After:', ET.tostring(d6, encoding='unicode'))
    
    # Serialize
    modified_xml = ET.tostring(root, encoding='unicode')
    
    # Save modified template for testing
    with zipfile.ZipFile(xlsx_path.replace('.xlsx', '_modified.xlsx'), 'w') as z2:
        with zipfile.ZipFile(xlsx_path, 'r') as z1:
            for item in z1.namelist():
                if item == 'xl/worksheets/sheet1.xml':
                    z2.writestr(item, modified_xml.encode('utf-8'))
                else:
                    z2.writestr(item, z1.read(item))
    
    print('\nSaved modified template: busbar_template_modified.xlsx')
