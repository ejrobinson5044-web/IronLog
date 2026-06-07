const fs = require('fs');
const path = require('path');

const sourcePath = path.join('.github', 'codex-unilateral-variants-20260607.js');
const fixedPath = path.join('.github', 'codex-unilateral-variants-fixed-20260607.js');
let source = fs.readFileSync(sourcePath, 'utf8');
source = source.split('\n').map((line) => {
  if (line.includes('return \\`${prefix}')) return "  return prefix+' '+SIDE_OPTIONS[cleanSide].label+' '+base;";
  if (line.includes('return sideOf(ex) ? \\`${String(ex.eq')) return "  return sideOf(ex) ? (String(ex.eq||'Other').trim()||'Other')+' '+stripSidePrefix(ex.name, ex.eq) : (ex&&ex.name);";
  return line;
}).join('\n');
fs.writeFileSync(fixedPath, source);
require('./codex-unilateral-variants-fixed-20260607.js');
