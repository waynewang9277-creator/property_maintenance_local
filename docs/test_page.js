// Test page loading with jsPDF
const http = require('http');
const fs = require('fs');
const path = require('path');

const server = http.createServer((req, res) => {
    console.log('Request:', req.url);
    
    let filePath = 'E:/openclaw_workspace/property_maintenance_local/frontend' + req.url;
    filePath = path.normalize(filePath);
    
    if (fs.existsSync(filePath)) {
        const ext = path.extname(filePath);
        const contentType = {
            '.html': 'text/html',
            '.js': 'application/javascript',
            '.css': 'text/css',
            '.json': 'application/json'
        }[ext] || 'text/plain';
        
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(fs.readFileSync(filePath));
    } else {
        console.log('Not found:', filePath);
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(9998, () => {
    console.log('Test server on http://localhost:9998');
    
    // Simple check - load the HTML and check script tags
    const html = fs.readFileSync('E:/openclaw_workspace/property_maintenance_local/frontend/modules/power-room-monthly/index.html', 'utf8');
    
    // Find script tags
    const scriptMatches = html.match(/<script[^>]*src="([^"]*)"[^>]*>/g);
    console.log('\nScript tags found:');
    if (scriptMatches) {
        scriptMatches.forEach(m => console.log('  ', m));
    }
    
    // Check jsPDF URL
    if (html.includes('jspdf.min.js')) {
        console.log('\njsPDF reference found in HTML');
    }
    
    // Check if file exists
    const jspdfPath = 'E:/openclaw_workspace/property_maintenance_local/frontend/common/js/jspdf.min.js';
    console.log('jsPDF file exists:', fs.existsSync(jspdfPath));
    console.log('jsPDF file size:', fs.statSync(jspdfPath).size);
    
    server.close();
});
