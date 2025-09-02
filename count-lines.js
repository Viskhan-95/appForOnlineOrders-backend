const fs = require('fs');
const path = require('path');

function countLines(dir) {
  const files = [];
  
  function scan(currentPath) {
    const items = fs.readdirSync(currentPath);
    
    for (const item of items) {
      const fullPath = path.join(currentPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory() && !item.startsWith('node_modules')) {
        scan(fullPath);
      } else if (item.match(/\.(ts|js|prisma)$/)) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n').length;
        files.push({ path: fullPath, lines, name: item });
      }
    }
  }
  
  scan(dir);
  return files.sort((a, b) => b.lines - a.lines);
}

const result = countLines('.');
console.log('Файлы по количеству строк (по убыванию):\n');
result.forEach(file => {
  console.log(`${file.lines.toString().padStart(4)} строк: ${file.name}`);
});