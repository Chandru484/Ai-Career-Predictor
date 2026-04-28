const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.jsx') || file.endsWith('.js') || file.endsWith('.css')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src/resume-builder'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content
    .replace(/rgba\(99,102,241,/g, 'rgba(150,230,48,')
    .replace(/#6366f1/gi, '#96e630')
    .replace(/#8b5cf6/gi, '#c8f03e')
    .replace(/#818cf8/gi, '#c8f03e')
    .replace(/rgba\(129,140,248,/g, 'rgba(200,240,62,');
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Updated:', file);
  }
});
