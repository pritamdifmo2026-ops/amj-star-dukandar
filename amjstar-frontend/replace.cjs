const fs = require('fs');
const path = require('path');

const targetColor = 'oklch(0.99 0.01 80)';
const dir = path.resolve('src');

const walk = (dir, done) => {
  let results = [];
  fs.readdir(dir, (err, list) => {
    if (err) return done(err);
    let i = 0;
    (function next() {
      let file = list[i++];
      if (!file) return done(null, results);
      file = path.resolve(dir, file);
      fs.stat(file, (err, stat) => {
        if (stat && stat.isDirectory()) {
          walk(file, (err, res) => {
            results = results.concat(res);
            next();
          });
        } else {
          results.push(file);
          next();
        }
      });
    })();
  });
};

walk(dir, (err, results) => {
  if (err) throw err;
  let count = 0;
  results.forEach(file => {
    if (file.endsWith('.css')) {
      let content = fs.readFileSync(file, 'utf8');
      let modified = content.replace(/#fafafa/gi, targetColor);
      if (content !== modified) {
        fs.writeFileSync(file, modified);
        count++;
        console.log(`Updated ${file}`);
      }
    }
  });
  console.log(`Modified ${count} files.`);
});
