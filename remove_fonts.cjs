const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, 'src/resume-builder/components/preview/templates');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsx'));

files.forEach(file => {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove fontFamily: '...', or fontFamily: "...",
  content = content.replace(/fontFamily:\s*['"][^'"]+['"],\s*/g, '');
  content = content.replace(/fontFamily:\s*['"][^'"]+['"]\s*/g, '');
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Updated', file);
});
