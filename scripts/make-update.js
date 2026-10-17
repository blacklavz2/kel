const fs = require('fs'), crypto = require('crypto');
const [ver, repo] = process.argv.slice(2);
const buf = fs.readFileSync('dist/keltostv.exe');
const sha256 = crypto.createHash('sha256').update(buf).digest('hex');
const size = Math.max(1, Math.round(buf.length / 1048576)) + ' MB';
let lines = [];
try { lines = fs.readFileSync('surum-notlari.txt', 'utf8').split(/\r?\n/).map(s => s.trim()).filter(Boolean); } catch (e) {}
const force = lines.some(l => l.toLowerCase() === '[zorunlu]');
const notes = lines.filter(l => l.toLowerCase() !== '[zorunlu]');
const url = `https://github.com/${repo}/releases/download/v${ver}/keltostv.exe`;
fs.writeFileSync('update.json', JSON.stringify({ version: ver, size, force, url, sha256, notes }, null, 2) + '\n');
console.log('update.json yazıldı:', ver, size, sha256);
