import fs from 'fs';
import path from 'path';

function walk(dir) {
  for (const f of fs.readdirSync(dir)) {
    const fp = path.join(dir, f);
    if (fs.statSync(fp).isDirectory()) walk(fp);
    else if (f.endsWith('.js') || f.endsWith('.jsx')) {
      const txt = fs.readFileSync(fp, 'utf8');
      if (txt.includes('AnswerCrate')) console.log(fp);
    }
  }
}
walk('src');

