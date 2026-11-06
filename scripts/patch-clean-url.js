const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf8');

const redirectScript = `  <script>
    // Clean public domain redirect: remove personal vercel account slug from URL
    (function() {
      try {
        var h = window.location.hostname;
        if (h && (h.indexOf('ahmedhajjem') !== -1 || h.indexOf('-projects.vercel.app') !== -1)) {
          window.location.replace('https://fermegestpro.vercel.app' + window.location.pathname + window.location.search + window.location.hash);
        }
      } catch(e) {}
    })();
  </script>\n`;

if (!html.includes('Clean public domain redirect')) {
  html = html.replace('<head>\n', '<head>\n' + redirectScript);
  html = html.replace('<head>\r\n', '<head>\r\n' + redirectScript);
  fs.writeFileSync('index.html', html, 'utf8');
  console.log('✔ Clean public domain redirect added to index.html!');
} else {
  console.log('Redirect script already present');
}
