const fs = require('fs');
let css = fs.readFileSync('styles.css', 'utf8');

const newStyles = `
/* Gestation & Maternity / Births Card Styling */
.gestation-card {
  border-color: rgba(236, 72, 153, 0.35);
  background: linear-gradient(135deg, rgba(236, 72, 153, 0.05), rgba(244, 63, 94, 0.03));
}
.gestation-card:hover {
  border-color: rgba(236, 72, 153, 0.65);
  box-shadow: 0 6px 20px rgba(236, 72, 153, 0.15);
}
.gestation-progress-fill {
  background: linear-gradient(90deg, #ec4899, #f43f5e) !important;
}
.reproduction-filter-btn {
  background: transparent;
  color: var(--text-muted);
  border: 1px solid transparent;
  padding: 0.3rem 0.75rem;
  font-size: 0.78rem;
  border-radius: var(--radius-sm);
  transition: all 0.2s ease;
  cursor: pointer;
}
.reproduction-filter-btn:hover {
  color: var(--text-main);
  background: rgba(255, 255, 255, 0.05);
}
.reproduction-filter-btn.active {
  background: var(--primary) !important;
  color: #ffffff !important;
  border-color: var(--primary) !important;
  box-shadow: 0 2px 8px var(--primary-glow);
}
`;

if (!css.includes('.gestation-card {')) {
  css += newStyles;
  fs.writeFileSync('styles.css', css, 'utf8');
  console.log('✔ Gestation card styles appended to styles.css!');
} else {
  console.log('Gestation styles already present');
}
