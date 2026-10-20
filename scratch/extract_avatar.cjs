const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

async function main() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true
  });
  const page = await browser.newPage();
  const imgPath = 'C:/Users/tuann/.gemini/antigravity-ide/brain/48996716-e2c6-4687-a96a-abaebd14b0a1/.user_uploaded/media_1790519472495.png';
  const imgBase64 = fs.readFileSync(imgPath).toString('base64');

  await page.setContent(`
    <!DOCTYPE html>
    <html>
      <body style="margin:0; padding:0; background:transparent;">
        <canvas id="cvs"></canvas>
        <img id="img" src="data:image/png;base64,${imgBase64}" />
      </body>
    </html>
  `);

  await page.evaluate(() => {
    return new Promise((resolve) => {
      const img = document.getElementById('img');
      if (img.complete) resolve();
      else img.onload = resolve;
    });
  });

  const res = await page.evaluate(() => {
    const img = document.getElementById('img');
    const outC = document.createElement('canvas');
    const sx = 44;
    const sy = 41;
    const sw = 100;
    const sh = 104;
    outC.width = sw;
    outC.height = sh;
    const ctx = outC.getContext('2d');
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

    // Make pixels outside the circle and outside the badge transparent
    const imgData = ctx.getImageData(0, 0, sw, sh);
    const d = imgData.data;
    const cx = sw / 2;
    const cy = 48; // center of circle
    const r = 48.5;

    // Badge bounds relative to (0,0):
    // Badge is roughly x: 9 to 90, y: 83 to 103
    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const idx = (y * sw + x) * 4;
        const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
        const inCircle = dist <= r;
        const inBadge = (x >= 9 && x <= 90 && y >= 83 && y <= 103);
        if (!inCircle && !inBadge) {
          d[idx + 3] = 0; // transparent
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);
    return outC.toDataURL('image/png');
  });

  const base64Data = res.replace(/^data:image\/png;base64,/, '');
  const outPath = path.resolve('public/shopee-shop-avatar.png');
  fs.writeFileSync(outPath, base64Data, 'base64');
  console.log('Saved transparent avatar + badge to:', outPath);

  await browser.close();
}

main().catch(console.error);
