const fs = require('fs');
const appJs = fs.readFileSync('app.js', 'utf8');

const targets = [
  1282, 1678, 1956, 1982, 2035, 2084, 2128, 4792, 4850, 5812, 6524, 7280, 7471, 7955
];

const lines = appJs.split('\n');

targets.forEach(lineNum => {
  const start = Math.max(0, lineNum - 10);
  const end = Math.min(lines.length - 1, lineNum + 25);
  const chunk = lines.slice(start, end).join('\n');
  console.log(`\n=================== BLOCK AROUND LINE ${lineNum} ===================`);
  console.log(chunk);
});
