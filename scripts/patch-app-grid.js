const fs = require('fs');
let js = fs.readFileSync('app.js', 'utf8');

if (!js.includes('const harvestCardsGrid =')) {
  const target = `const milkChartCard = document.getElementById('milkProductionChartCard');\r\n    if (milkChartCard) {\r\n      milkChartCard.style.display = hasCattle ? '' : 'none';\r\n    }`;
  const targetLF = `const milkChartCard = document.getElementById('milkProductionChartCard');\n    if (milkChartCard) {\n      milkChartCard.style.display = hasCattle ? '' : 'none';\n    }`;
  
  const addition = `\n\n    const harvestCardsGrid = document.querySelector('.harvest-cards-grid');\n    if (harvestCardsGrid) {\n      harvestCardsGrid.style.display = (hasPoultry || hasCattle) ? '' : 'none';\n    }`;

  if (js.includes(target)) {
    js = js.replace(target, target + addition);
  } else if (js.includes(targetLF)) {
    js = js.replace(targetLF, targetLF + addition);
  }
  fs.writeFileSync('app.js', js, 'utf8');
  console.log('harvestCardsGrid toggle added to app.js');
} else {
  console.log('Already present in app.js');
}
