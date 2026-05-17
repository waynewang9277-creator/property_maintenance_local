# -*- coding: utf-8 -*-
"""
修改维保计划强电模板，添加6个新样式（用于颜色填充）
每个日期2列 x 每种区域(计划/执行) = 6种样式组合
"""
import zipfile, re, shutil, sys, os
sys.stdout.reconfigure(encoding='utf-8')

template_path = r'E:\openclaw_workspace\property_maintenance_local\frontend\assets\templates\维保计划-强电.xlsx'
output_path = r'E:\openclaw_workspace\property_maintenance_local\frontend\assets\templates\维保计划-强电-modified.xlsx'

# Colors (RGB hex, no #)
BLACK = '000000'      # 办公楼
DARK_BLUE = '1F497D' # 商场  
DARK_GREEN = '00B050' # 执行

def modify_styles_add_fills_and_xf(styles_xml, new_styles_config):
    """
    Add new fill entries and return mapping of (rowType, region) -> new style index.
    new_styles_config: list of (fillId, description)
    Returns: dict mapping description -> new style index
    """
    fills_match = re.search(r'<fills[^>]*count="(\d+)"', styles_xml)
    current_fill_count = int(fills_match.group(1))
    
    # Add 3 new fills
    new_fills_xml = (
        f'<fill><patternFill patternType="solid"><fgColor rgb="{BLACK}"/></patternFill></fill>'
        f'<fill><patternFill patternType="solid"><fgColor rgb="{DARK_BLUE}"/></patternFill></fill>'
        f'<fill><patternFill patternType="solid"><fgColor rgb="{DARK_GREEN}"/></patternFill></fill>'
    )
    styles_xml = styles_xml.replace('</fills>', new_fills_xml + '</fills>')
    styles_xml = re.sub(
        r'<fills([^>]*)count="(\d+)"',
        lambda m: f'<fills{m.group(1)}count="{current_fill_count + 3}"',
        styles_xml
    )
    
    # Now add new xf entries at the end of cellXfs
    xfs_match = re.search(r'<cellXfs[^>]*count="(\d+)"', styles_xml)
    current_xf_count = int(xfs_match.group(1))
    
    # Base style indices used by date cells in plan rows (rows 6,8,10...) and execute rows (rows 7,9,11...)
    # Plan row first col (office): s=38, second col (mall): s=39
    # Execute row first col (office): s=58, second col (mall): s=59
    # BUT we want same style index but with fill color
    # We need to copy the base style but change fillId
    
    # For each base style we need, copy it with new fillId
    # base_style -> new fillId mapping:
    # s=38 (plan office col1) -> fillId=5 (black) 
    # s=39 (plan mall col2) -> fillId=6 (dark blue)
    # s=58 (exec office col1) -> fillId=5 (black) but actually exec rows use s=58/s=59 
    # s=59 (exec mall col2) -> fillId=6 (dark blue)
    # For execute rows, we need:
    # s=58 -> copy with fillId=7 (dark green) for office executed
    # s=59 -> copy with fillId=7 (dark green) for mall executed
    
    # Actually let's look at what styles are used more carefully
    # From analysis:
    # Row 6 (plan): E6=s=38 (office), F6=s=39 (mall)
    # Row 7 (exec): E7=s=58 (office), F7=s=59 (mall)
    # Row 8 (plan): E8=s=38, F8=s=39
    # Row 9 (exec): E9=s=46, F9=s=47
    
    # Wait, from row 9 it changes! Let me check all styles for date columns
    print('Checking all plan/execute row styles...')
    
    style_mapping = {}  # description -> (base_style_index, new_fillId)
    
    # From the actual XML:
    # Row 6 plan: E6=s=38, F6=s=39 (first 2 date cols)
    # Row 7 exec: E7=s=58, F7=s=59 (first 2 date cols)
    # Row 8 plan: E8=s=38, F8=s=39
    # Row 9 exec: E9=s=46, F9=s=47
    # Row 10 plan: E10=s=71, F10=s=72
    
    # The pattern alternates. For simplicity, let's just create
    # fill+xf for black, dark blue, dark green at indices 5,6,7
    
    # Build new xf entries
    # We need to add 3 new xf entries, each pointing to a different fill
    # Each xf is a copy of a base xf (e.g. xf[38]) but with new fillId
    
    # Find xf[38] as template (it has fillId=0, no border)
    xf38_match = re.search(r'<xf([^>]*fillId="0"[^>]*>)', styles_xml)
    if not xf38_match:
        # Try alternate order
        xf38_match = re.search(r'<xf([^>]*)>(?!.*fillId)', styles_xml)
    
    # Actually let's just find the first xf with fillId=0 that has no border (style for date cells)
    all_xfs = re.findall(r'<xf([^>]*)/>', styles_xml) + re.findall(r'<xf([^>]*)>.*?</xf>', styles_xml, re.DOTALL)
    base_xf = None
    for xf in all_xfs:
        if 'fillId="0"' in xf and 'borderId="0"' in xf:
            base_xf = '<xf' + xf + '</xf>'
            break
    
    if not base_xf:
        base_xf = '<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>'
    
    new_xf_entries = (
        f'<xf numFmtId="0" fontId="0" fillId="5" borderId="0" xfId="0"/>'
        f'<xf numFmtId="0" fontId="0" fillId="6" borderId="0" xfId="0"/>'
        f'<xf numFmtId="0" fontId="0" fillId="7" borderId="0" xfId="0"/>'
    )
    
    # Insert before </cellXfs>
    styles_xml = styles_xml.replace('</cellXfs>', new_xf_entries + '</cellXfs>')
    styles_xml = re.sub(
        r'<cellXfs([^>]*)count="(\d+)"',
        lambda m: f'<cellXfs{m.group(1)}count="{current_xf_count + 3}"',
        styles_xml
    )
    
    return styles_xml, {
        'black': current_xf_count,      # style index for fillId=5 (black)
        'dark_blue': current_xf_count + 1,  # style index for fillId=6 (dark blue)  
        'dark_green': current_xf_count + 2   # style index for fillId=7 (dark green)
    }

def main():
    # Read template
    with zipfile.ZipFile(template_path, 'r') as z:
        styles_xml = z.read('xl/styles.xml').decode('utf-8')
        sheet_xml = z.read('xl/worksheets/sheet1.xml').decode('utf-8')
        all_files = {name: z.read(name) for name in z.namelist()}
    
    # Modify styles
    new_styles_xml, style_map = modify_styles_add_fills_and_xf(styles_xml, None)
    print(f'New style indices: {style_map}')
    
    # Write output
    output_files = {}
    for name, data in all_files.items():
        if name == 'xl/styles.xml':
            output_files[name] = new_styles_xml.encode('utf-8')
        else:
            output_files[name] = data
    
    with zipfile.ZipFile(output_path, 'w', zipfile.ZIP_DEFLATED) as z:
        for name, data in output_files.items():
            z.writestr(name, data)
    
    print(f'Modified template saved to: {output_path}')
    print(f'Total styles now: 89 + 3 = 92')
    
    # Verify the new fills
    with zipfile.ZipFile(output_path, 'r') as z:
        verify_styles = z.read('xl/styles.xml').decode('utf-8')
    fills_match = re.search(r'<fills[^>]*count="(\d+)"', verify_styles)
    xfs_match = re.search(r'<cellXfs[^>]*count="(\d+)"', verify_styles)
    print(f'Verification - fills count: {fills_match.group(1)}, cellXfs count: {xfs_match.group(1)}')
    
    # Print the last 3 xf entries
    xfs_section = re.search(r'<cellXfs[^>]*>.*?</cellXfs>', verify_styles, re.DOTALL).group(0)
    xf_entries = re.findall(r'<xf[^>]*/>', xfs_section) + re.findall(r'<xf[^>]*>.*?</xf>', xfs_section, re.DOTALL)
    print('\nNew xf entries:')
    for xf in xf_entries[-3:]:
        print(f'  {xf}')

if __name__ == '__main__':
    main()