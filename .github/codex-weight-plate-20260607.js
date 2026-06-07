const fs = require('fs');

const read = (file) => fs.readFileSync(file, 'utf8');
const write = (file, content) => fs.writeFileSync(file, content);

let html = read('index.html');
if (!html.includes("'Weight Plate':{c:")) {
  html = html.replace("Band:{c:'#4dd0c7'},Landmine:{c:'#e8915a'}", "Band:{c:'#4dd0c7'},'Weight Plate':{c:'#c084fc'},Landmine:{c:'#e8915a'}");
}
write('index.html', html);

let sw = read('service-worker.js');
sw = sw.replace(/ironlog-v\d+/, 'ironlog-v26');
write('service-worker.js', sw);

let smoke = read('tests/smoke-check.js');
if (!smoke.includes('weight plate equipment option exists')) {
  smoke = smoke.replace(
    "check('compiled v2 shell removes browser Babel'",
    "check('weight plate equipment option exists', index.includes(\"'Weight Plate':{c:\") && index.includes('Object.keys(EQUIP)'));\ncheck('compiled v2 shell removes browser Babel'"
  );
}
write('tests/smoke-check.js', smoke);

console.log('Weight Plate equipment patch applied.');
