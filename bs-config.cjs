const { readFileSync } = require('fs');
const { join } = require('path');

const devOverlays = readFileSync(
  join(__dirname, '../../tools/scripts/dev-overlays.js'),
  'utf-8'
);

const injectScript = `<script>${devOverlays}</script>`;

module.exports = {
  server: {
    baseDir: 'dist',
    middleware: [
      function (req, res, next) {
        // Only intercept HTML page requests
        var origEnd = res.end;
        var chunks = [];

        res.write = function (chunk) {
          chunks.push(Buffer.from(chunk));
        };

        res.end = function (chunk) {
          if (chunk) chunks.push(Buffer.from(chunk));
          var body = Buffer.concat(chunks).toString('utf-8');
          var ct = res.getHeader('content-type') || '';
          if (ct.includes('text/html') && body.includes('</body>')) {
            body = body.replace('</body>', injectScript + '</body>');
            res.setHeader('content-length', Buffer.byteLength(body));
          }
          origEnd.call(res, body);
        };

        next();
      },
    ],
  },
  files: ['dist/**/*'],
  port: 3100,
};
