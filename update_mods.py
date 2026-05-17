# -*- coding: utf-8 -*-
with open(r'E:\openclaw_workspace\property_maintenance_local\frontend\modules\strong-power-plan\index.html', 'r', encoding='utf-8') as f:
    content = f.read()

idx = content.find('const MODS = ')
end = content.find('];', idx) + 2
old_block = content[idx:end]

new_block = """const MODS = [
            { id: 'item-1',  name: '应急装置电池放电时间测试',   icon: '🔋', itemId: 1 },
            { id: 'item-2',  name: '擦窗机保养',                icon: '🪟', itemId: 2 },
            { id: 'item-3',  name: '应急发电机保养',            icon: '⚙️', itemId: 3 },
            { id: 'item-4',  name: '电容检查及测温',            icon: '🔌', itemId: 4 },
            { id: 'item-5',  name: '供电母排检查测温记录表',    icon: '⚡', itemId: 5 },
            { id: 'item-6',  name: '强电间月度巡检',            icon: '📋', itemId: 6 },
            { id: 'item-7',  name: '高压绝缘工具预防性试验',    icon: '🧪', itemId: 7 },
            { id: 'item-8',  name: '高压供电系统检查',          icon: '🔌', itemId: 8 },
            { id: 'item-9',  name: '泛光/景观照明系统检查',     icon: '💡', itemId: 9 },
            { id: 'item-10', name: '外围LOGO灯箱年检及备案',   icon: '📜', itemId: 10 },
            { id: 'item-11', name: '供配电设备电控箱月度检查',  icon: '⚙️', itemId: 11 },
            { id: 'item-12', name: '防雷检测',                  icon: '⛈️', itemId: 12 },
            { id: 'item-13', name: '电梯扶手梯故障报告',        icon: '🛗', itemId: 13 },
            { id: 'item-14', name: '电梯/扶手梯年检',          icon: '🛗', itemId: 14 },
            { id: 'item-15', name: '电扶梯维护保养',            icon: '🛗', itemId: 15 },
            { id: 'item-16', name: '电梯逃生门检查',            icon: '🚪', itemId: 16 }
        ];"""

if old_block in content:
    content = content.replace(old_block, new_block)
    with open(r'E:\openclaw_workspace\property_maintenance_local\frontend\modules\strong-power-plan\index.html', 'w', encoding='utf-8') as f:
        f.write(content)
    print('SUCCESS: replaced')
else:
    print('ERROR: old block not found')