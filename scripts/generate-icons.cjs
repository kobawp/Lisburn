const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

function getSvg(size, isMaskable = false) {
  // For maskable icon, keep within 80% safe zone
  const fontSize = isMaskable ? Math.round(size * 0.48) : Math.round(size * 0.64);
  const dotSize = Math.round(fontSize * 0.9);
  const x = Math.round(size * 0.48);
  const y = Math.round(size * (isMaskable ? 0.67 : 0.70));
  const letterSpacing = isMaskable ? '-1.5px' : '-3px';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <defs>
      <radialGradient id="tabBg" cx="30%" cy="20%" r="95%">
        <stop offset="0%" stop-color="#3A1C48"/>
        <stop offset="45%" stop-color="#1E0C27"/>
        <stop offset="100%" stop-color="#0A050D"/>
      </radialGradient>
    </defs>
    <rect width="${size}" height="${size}" fill="url(#tabBg)"/>
    <text x="${x}" y="${y}" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" font-weight="900" font-size="${fontSize}" fill="#FFFFFF" letter-spacing="${letterSpacing}">L<tspan fill="#AB70D5" font-size="${dotSize}">.</tspan></text>
  </svg>`;
}

function createIco(pngBuffers) {
  const count = pngBuffers.length;
  const header = Buffer.alloc(6 + count * 16);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // icon type
  header.writeUInt16LE(count, 4); // count

  let offset = 6 + count * 16;
  const dataBuffers = [];

  for (let i = 0; i < count; i++) {
    const { buf, width, height } = pngBuffers[i];
    const entryOffset = 6 + i * 16;
    header.writeUInt8(width >= 256 ? 0 : width, entryOffset);
    header.writeUInt8(height >= 256 ? 0 : height, entryOffset + 1);
    header.writeUInt8(0, entryOffset + 2); // palette
    header.writeUInt8(0, entryOffset + 3); // reserved
    header.writeUInt16LE(1, entryOffset + 4); // color planes
    header.writeUInt16LE(32, entryOffset + 6); // bpp
    header.writeUInt32LE(buf.length, entryOffset + 8); // size
    header.writeUInt32LE(offset, entryOffset + 12); // offset
    dataBuffers.push(buf);
    offset += buf.length;
  }

  return Buffer.concat([header, ...dataBuffers]);
}

async function main() {
  const publicDir = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  console.log('Generating high-res PNG icons for iOS and PWA...');

  // 1. Apple Touch Icons (Opaque RGB PNGs as mandated by iOS Safari guidelines)
  const appleSizes = [180, 152, 167, 120];
  for (const size of appleSizes) {
    const svg = getSvg(size, false);
    const buf = await sharp(Buffer.from(svg))
      .removeAlpha()
      .png({ compressionLevel: 9 })
      .toBuffer();
    
    if (size === 180) {
      fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), buf);
      fs.writeFileSync(path.join(publicDir, 'apple-touch-icon-precomposed.png'), buf);
      fs.writeFileSync(path.join(publicDir, 'apple-touch-icon-180x180.png'), buf);
    } else {
      fs.writeFileSync(path.join(publicDir, `apple-touch-icon-${size}x${size}.png`), buf);
    }
  }

  // 2. Standard PWA Icons (192 and 512)
  const pwa192 = await sharp(Buffer.from(getSvg(192, false)))
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pwa192);
  fs.writeFileSync(path.join(publicDir, 'favicon.png'), pwa192);

  const pwa512 = await sharp(Buffer.from(getSvg(512, false)))
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pwa512);
  fs.writeFileSync(path.join(publicDir, 'icon.png'), pwa512);

  // 3. Maskable PWA Icon with 80% safe zone padding
  const pwaMaskable512 = await sharp(Buffer.from(getSvg(512, true)))
    .removeAlpha()
    .png({ compressionLevel: 9 })
    .toBuffer();
  fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pwaMaskable512);

  // 4. Favicon PNGs (16, 32, 48)
  const icoBuffers = [];
  for (const size of [16, 32, 48]) {
    const buf = await sharp(Buffer.from(getSvg(size, false)))
      .png({ compressionLevel: 9 })
      .toBuffer();
    fs.writeFileSync(path.join(publicDir, `favicon-${size}x${size}.png`), buf);
    icoBuffers.push({ buf, width: size, height: size });
  }

  // 5. Favicon ICO
  const icoFile = createIco(icoBuffers);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoFile);

  console.log('Successfully generated all icons!');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
