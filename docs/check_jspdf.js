var fs = require('fs');
var content = fs.readFileSync('E:/openclaw_workspace/property_maintenance_local/frontend/common/js/jspdf.min.js', 'utf8');

// Check what global it creates
var windowMatch = content.match(/window\.(\w+)\s*=/);
console.log('window.*= assignment:', windowMatch ? windowMatch[1] : 'none');

var globalMatch = content.match(/global\.(\w+)\s*=/);
console.log('global.*= assignment:', globalMatch ? globalMatch[1] : 'none');

// Check first 500 chars for jsPDF reference
console.log('\nFirst 500 chars:');
console.log(content.substring(0, 500));
