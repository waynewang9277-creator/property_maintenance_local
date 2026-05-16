# -*- coding: utf-8 -*-
import os
import sys

d = r'E:\openclaw_workspace\property_maintenance_local\package\assets\templates'

# Keep these exact names (correct ones)
keep = {'busbar_template.xlsx', 'capacitor_template.xlsx', 'capacitor_template_new.xlsx', 
        'elevator_monthly_report.xlsx', 'elevator_monthly_stat.xlsx', 'generator_template.xlsx'}

for f in os.listdir(d):
    if not f.endswith('.xlsx'):
        continue
    if f not in keep:
        full = os.path.join(d, f)
        try:
            print(f'Deleting: {f}')
        except:
            print('Deleting a file')
        os.remove(full)

# Delete rename.bat
bat = os.path.join(d, 'rename.bat')
if os.path.exists(bat):
    os.remove(bat)

print('--- Templates remaining:')
for f in sorted(os.listdir(d)):
    if f.endswith('.xlsx'):
        print(f)
