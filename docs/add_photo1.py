# -*- coding: utf-8 -*-
import os

js_path = r'E:\openclaw_workspace\property_maintenance_local\frontend\modules\busbar-check\module.js'

with open(js_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Add base64ToUint8Array after clearAll function
old = '''    clearAll: function() {
        if (confirm('确定要清空所有数据吗？')) {
            this.data = {};
            this.selectedGroup = null;
            this.expandedDevice = null;
            this.saveData();
            this.render();
        }
    }
};'''

new = '''    base64ToUint8Array: function(base64) {
        var base64Data = base64.split(',')[1] || base64;
        var binaryString = atob(base64Data);
        var bytes = new Uint8Array(binaryString.length);
        for (var i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        return bytes;
    },
    
    clearAll: function() {
        if (confirm('确定要清空所有数据吗？')) {
            this.data = {};
            this.selectedGroup = null;
            this.expandedDevice = null;
            this.saveData();
            this.render();
        }
    }
};'''

content = content.replace(old, new)

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(content)

print('Added base64ToUint8Array function')
