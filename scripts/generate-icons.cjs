const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

function createPng(width, height, r, g, b) {
  // Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // bit depth 8
  ihdrData.writeUInt8(6, 9); // RGBA
  ihdrData.writeUInt8(0, 10);
  ihdrData.writeUInt8(0, 11);
  ihdrData.writeUInt8(0, 12);
  const ihdr = makeChunk('IHDR', ihdrData);

  // Scanlines: width * 4 bytes + 1 filter byte per line
  const rawData = Buffer.alloc(height * (width * 4 + 1));
  let pos = 0;
  for (let y = 0; y < height; y++) {
    rawData.writeUInt8(0, pos++); // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      // Draw amber background (#f59e0b) with white medical cross in center
      const inCrossV = Math.abs(x - width / 2) < width * 0.08 && Math.abs(y - height / 2) < height * 0.35;
      const inCrossH = Math.abs(y - height / 2) < height * 0.08 && Math.abs(x - width / 2) < width * 0.35;
      const inCenterRing = Math.hypot(x - width / 2, y - height / 2) < width * 0.12;
      
      if (inCenterRing) {
        rawData.writeUInt8(217, pos++); // #d97706
        rawData.writeUInt8(119, pos++);
        rawData.writeUInt8(6, pos++);
        rawData.writeUInt8(255, pos++);
      } else if (inCrossV || inCrossH) {
        rawData.writeUInt8(255, pos++); // White cross
        rawData.writeUInt8(255, pos++);
        rawData.writeUInt8(255, pos++);
        rawData.writeUInt8(255, pos++);
      } else {
        rawData.writeUInt8(245, pos++); // Amber #f59e0b
        rawData.writeUInt8(158, pos++);
        rawData.writeUInt8(11, pos++);
        rawData.writeUInt8(255, pos++);
      }
    }
  }

  const idat = makeChunk('IDAT', zlib.deflateSync(rawData));
  const iend = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdr, idat, iend]);
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

// Simple CRC32 implementation
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c = (c >>> 8) ^ table[(c ^ buf[i]) & 0xff];
  }
  return (~c) >>> 0;
}

const table = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  table[i] = c >>> 0;
}

const pubDir = path.join(__dirname, '../public');
if (!fs.existsSync(pubDir)) fs.mkdirSync(pubDir, { recursive: true });

fs.writeFileSync(path.join(pubDir, 'pwa-192x192.png'), createPng(192, 192, 245, 158, 11));
fs.writeFileSync(path.join(pubDir, 'pwa-512x512.png'), createPng(512, 512, 245, 158, 11));
fs.writeFileSync(path.join(pubDir, 'apple-touch-icon.png'), createPng(180, 180, 245, 158, 11));
fs.writeFileSync(path.join(pubDir, 'pwa-maskable-512x512.png'), createPng(512, 512, 245, 158, 11));
console.log('Icons generated successfully in public/');
