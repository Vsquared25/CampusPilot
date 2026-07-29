const { deflateSync } = require("node:zlib");
const { mkdirSync, writeFileSync } = require("node:fs");
const path = require("node:path");

const size = 256;
const pixels = Buffer.alloc(size * size * 4, 0);

function setPixel(x, y, r, g, b, a = 255) {
  if (x < 0 || x >= size || y < 0 || y >= size) return;
  const index = (y * size + x) * 4;
  pixels[index] = r;
  pixels[index + 1] = g;
  pixels[index + 2] = b;
  pixels[index + 3] = a;
}

for (let y = 0; y < size; y += 1) {
  for (let x = 0; x < size; x += 1) {
    const dx = x - 128;
    const dy = y - 128;
    if (dx * dx + dy * dy <= 118 * 118) {
      setPixel(x, y, 187, 12, 47);
    }
  }
}

for (let y = 48; y < 208; y += 1) {
  for (let x = 118; x <= 138; x += 1) setPixel(x, y, 255, 255, 255);
}
for (let y = 118; y <= 138; y += 1) {
  for (let x = 48; x < 208; x += 1) setPixel(x, y, 255, 255, 255);
}
for (let step = 0; step < 94; step += 1) {
  for (let thickness = -9; thickness <= 9; thickness += 1) {
    setPixel(128 + step, 128 - step + thickness, 255, 255, 255);
    setPixel(128 - step, 128 + step + thickness, 255, 255, 255);
  }
}

function crc32(buffer) {
  let value = 0xffffffff;
  for (const byte of buffer) {
    value ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      value = (value >>> 1) ^ (value & 1 ? 0xedb88320 : 0);
    }
  }
  return (value ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const header = Buffer.alloc(8);
  header.writeUInt32BE(data.length, 0);
  header.write(type, 4, 4, "ascii");
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type), data])), 0);
  return Buffer.concat([header, data, checksum]);
}

const scanlines = Buffer.alloc((size * 4 + 1) * size);
for (let y = 0; y < size; y += 1) {
  const offset = y * (size * 4 + 1);
  scanlines[offset] = 0;
  pixels.copy(scanlines, offset + 1, y * size * 4, (y + 1) * size * 4);
}

const png = Buffer.concat([
  Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  chunk("IHDR", Buffer.from([0, 0, 1, 0, 0, 0, 1, 0, 8, 6, 0, 0, 0])),
  chunk("IDAT", deflateSync(scanlines)),
  chunk("IEND", Buffer.alloc(0)),
]);

const outputDirectory = path.join(__dirname, "assets");
mkdirSync(outputDirectory, { recursive: true });
writeFileSync(path.join(outputDirectory, "icon.png"), png);

const icoHeader = Buffer.alloc(22);
icoHeader.writeUInt16LE(0, 0);
icoHeader.writeUInt16LE(1, 2);
icoHeader.writeUInt16LE(1, 4);
icoHeader[6] = 0;
icoHeader[7] = 0;
icoHeader[8] = 0;
icoHeader[9] = 0;
icoHeader.writeUInt16LE(1, 10);
icoHeader.writeUInt16LE(32, 12);
icoHeader.writeUInt32LE(png.length, 14);
icoHeader.writeUInt32LE(22, 18);
writeFileSync(path.join(outputDirectory, "icon.ico"), Buffer.concat([icoHeader, png]));
