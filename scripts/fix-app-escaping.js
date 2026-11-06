const fs = require('fs');
let js = fs.readFileSync('app.js', 'utf8');

// Fix string replacement properly
const badLine = "name: animal.name ? (animal.breed && animal.breed !== '-' ? \\ () : animal.name) : this.getAnimalDisplayName(animal),";
const goodLine = "name: animal.name ? (animal.breed && animal.breed !== '-' ? (animal.name + ' (' + animal.breed + ')') : animal.name) : this.getAnimalDisplayName(animal),";

const badLine2 = "const motherTitle = animal.name ? (animal.breed && animal.breed !== '-' ? \\ () : animal.name) : this.getAnimalDisplayName(animal);";
const goodLine2 = "const motherTitle = animal.name ? (animal.breed && animal.breed !== '-' ? (animal.name + ' (' + animal.breed + ')') : animal.name) : this.getAnimalDisplayName(animal);";

js = js.replace(badLine, goodLine);
js = js.replace(badLine2, goodLine2);

fs.writeFileSync('app.js', js, 'utf8');
console.log('✔ Fixed template string escaping in app.js!');
