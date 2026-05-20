# -*- mode: python ; coding: utf-8 -*-

a = Analysis(
    ['E:\\openclaw_workspace\\property_maintenance_local\\launcher\\server_launcher.py'],
    pathex=[],
    binaries=[],
    datas=[
        ('E:\\openclaw_workspace\\property_maintenance_local\\index.html', '.'),
        ('E:\\openclaw_workspace\\property_maintenance_local\\manifest.json', '.'),
        ('E:\\openclaw_workspace\\property_maintenance_local\\modules', 'modules'),
        ('E:\\openclaw_workspace\\property_maintenance_local\\common', 'common'),
        ('E:\\openclaw_workspace\\property_maintenance_local\\assets', 'assets'),
    ],
    hiddenimports=[
        'http.server',
        'socketserver',
        'webbrowser',
        'http',
        'http.server',
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
    optimize=0,
)
pyz = PYZ(a.pure)

exe = EXE(
    pyz,
    a.scripts,
    a.binaries,
    a.datas,
    [],
    name='kelong',
    debug=False,
    bootloader_ignore_signals=False,
    strip=False,
    upx=True,
    upx_exclude=[],
    runtime_tmpdir=None,
    console=True,
    disable_windowed_traceback=False,
    argv_emulation=False,
    target_arch=None,
    codesign_identity=None,
    entitlements_file=None,
)