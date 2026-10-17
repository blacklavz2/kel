const { app, BrowserWindow, ipcMain, dialog } = require('electron');
let win;
app.whenReady().then(() => {
  win = new BrowserWindow({
    width: 1195, height: 850, minWidth: 900, minHeight: 600,
    frame: false, backgroundColor: '#050d09',
    webPreferences: { nodeIntegration: true, contextIsolation: false }
  });
  win.setMenu(null);
  win.loadFile('index.html');
});
ipcMain.on('win', (_, a) => {
  if (a === 'min') win.minimize();
  if (a === 'close') win.close();
});
ipcMain.on('login-item', (_, v) => app.setLoginItemSettings({ openAtLogin: !!v }));
ipcMain.handle('pick-dir', async () => {
  const r = await dialog.showOpenDialog(win, { properties: ['openDirectory', 'createDirectory'] });
  return r.canceled ? null : r.filePaths[0];
});
const https = require('https'), fs = require('fs'), path = require('path'), os = require('os'), crypto = require('crypto');
const { spawn } = require('child_process');
function download(url, dest, n = 0) {
  return new Promise((res, rej) => {
    if (!/^https:\/\//.test(url)) return rej(new Error('Güvenli olmayan adres'));
    if (n > 5) return rej(new Error('Çok fazla yönlendirme'));
    https.get(url, r => {
      if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location) {
        r.resume();
        return download(new URL(r.headers.location, url).href, dest, n + 1).then(res, rej);
      }
      if (r.statusCode !== 200) { r.resume(); return rej(new Error('İndirilemedi: ' + r.statusCode)); }
      const f = fs.createWriteStream(dest);
      r.pipe(f);
      f.on('finish', () => f.close(res));
      f.on('error', rej);
    }).on('error', rej);
  });
}
ipcMain.handle('do-update', async (_, { url, sha256 }) => {
  const target = process.env.PORTABLE_EXECUTABLE_FILE;
  if (!target) throw new Error('Otomatik güncelleme sadece exe sürümünde çalışır');
  if (!url || !sha256) throw new Error('Güncelleme bilgisi eksik');
  const tmp = path.join(os.tmpdir(), 'kel-update.exe');
  await download(url, tmp);
  const h = crypto.createHash('sha256').update(fs.readFileSync(tmp)).digest('hex');
  if (h !== String(sha256).toLowerCase()) { fs.rmSync(tmp, { force: true }); throw new Error('İndirilen dosya doğrulanamadı'); }
  const bat = path.join(os.tmpdir(), 'kel-update.bat');
  fs.writeFileSync(bat, `@echo off\r\ntimeout /t 2 /nobreak >nul\r\ncopy /y "${tmp}" "${target}" >nul\r\nstart "" "${target}"\r\ndel "${tmp}"\r\n(goto) 2>nul & del "%~f0"\r\n`);
  spawn('cmd.exe', ['/c', bat], { detached: true, stdio: 'ignore', windowsHide: true }).unref();
  app.quit();
});
app.on('window-all-closed', () => app.quit());
