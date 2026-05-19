const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get all .tsx files with module.css imports
const result = execSync(
  'Get-ChildItem -Path src -Recurse -Filter "*.tsx" | Select-String -Pattern "from \'.*\\.module\\.css\'" | Select-Object -ExpandProperty Path',
  { cwd: 'D:\\AMJ_Store\\amjstar-frontend', shell: 'powershell.exe', encoding: 'utf8' }
).trim().split('\n').map(f => f.trim()).filter(Boolean);

console.log(`Found ${result.length} files with module.css imports`);

let filesWithRemainingStyles = [];

result.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Remove import lines for module.css
  content = content.replace(/^import\s+\w+\s+from\s+'[^']*\.module\.css';\r?\n/gm, '');
  content = content.replace(/^import\s+\w+\s+from\s+"[^"]*\.module\.css";\r?\n/gm, '');
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Removed import from: ${path.basename(filePath)}`);
    
    // Check if styles.xxx usage remains
    if (content.includes('styles.') || content.includes('localStyles.')) {
      filesWithRemainingStyles.push(filePath);
    }
  }
});

console.log('\n=== Files still using styles.xxx (need manual Tailwind conversion) ===');
filesWithRemainingStyles.forEach(f => console.log(' -', path.basename(f)));
console.log(`\nTotal: ${filesWithRemainingStyles.length} files need manual work`);
