/**
 * Generate PNG icons từ SVG dùng Canvas API của Node.js
 * Chạy: node generate-icons.js
 */
const fs   = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const outDir = path.join(__dirname, 'src/main/resources/static/icons');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// Nếu không có canvas module, tạo placeholder PNG (1x1 px transparent)
// Người dùng có thể dùng https://realfavicongenerator.net hoặc Squoosh để convert SVG→PNG
function createPlaceholderPNG(size) {
    // PNG header + IHDR + IDAT (1x1 transparent) rồi scale
    // Đây là PNG hợp lệ nhỏ nhất, browsers sẽ scale up
    const W = size, H = size;

    // Tạo PNG đơn giản bằng raw bytes
    function crc32(buf) {
        let crc = -1;
        for (let i = 0; i < buf.length; i++) {
            crc = (crc >>> 8) ^ crc32Table[(crc ^ buf[i]) & 0xff];
        }
        return (crc ^ -1) >>> 0;
    }

    const crc32Table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
        let c = n;
        for (let k = 0; k < 8; k++) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        crc32Table[n] = c;
    }

    function chunk(type, data) {
        const t = Buffer.from(type, 'ascii');
        const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
        const combined = Buffer.concat([t, data]);
        const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(combined), 0);
        return Buffer.concat([len, t, data, crc]);
    }

    const sig = Buffer.from([137,80,78,71,13,10,26,10]);

    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(W, 0); ihdr.writeUInt32BE(H, 4);
    ihdr[8] = 8; ihdr[9] = 2; // bit depth 8, color type RGB
    ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;

    // Create gradient pixel data
    const rows = [];
    for (let y = 0; y < H; y++) {
        const row = [0]; // filter byte
        for (let x = 0; x < W; x++) {
            // Dark gradient background matching theme
            const cx = x / W, cy = y / H;
            const dist = Math.sqrt((cx-0.5)**2 + (cy-0.5)**2);

            // Background: deep indigo-navy
            let r = 15 + Math.round(cx * 20);
            let g = 15 + Math.round(cy * 10);
            let b = 35 + Math.round((1-dist) * 30);

            // Draw circular icon area
            if (dist < 0.45) {
                // Gradient accent overlay
                const blend = Math.max(0, 0.45 - dist) / 0.45;
                r = Math.round(r + blend * (99 - r) * 0.3);
                g = Math.round(g + blend * (102 - g) * 0.3);
                b = Math.round(b + blend * (241 - b) * 0.3);
            }

            // Draw ₫ symbol area (center)
            const nx = (x / W - 0.3), ny = (y / H - 0.45);
            if (Math.abs(nx) < 0.12 && Math.abs(ny) < 0.18) {
                r = Math.round(r * 0.4 + 34 * 0.6);
                g = Math.round(g * 0.4 + 211 * 0.6);
                b = Math.round(b * 0.4 + 238 * 0.6);
            }

            row.push(Math.min(255, r), Math.min(255, g), Math.min(255, b));
        }
        rows.push(Buffer.from(row));
    }

    const zlib = require('zlib');
    const raw = Buffer.concat(rows);
    const compressed = zlib.deflateSync(raw, { level: 6 });
    const idat = chunk('IDAT', compressed);

    return Buffer.concat([sig, chunk('IHDR', ihdr), idat, chunk('IEND', Buffer.alloc(0))]);
}

console.log('Generating PWA icons...\n');

for (const size of sizes) {
    const outPath = path.join(outDir, `icon-${size}.png`);
    try {
        const png = createPlaceholderPNG(size);
        fs.writeFileSync(outPath, png);
        console.log(`  ✓ icon-${size}.png (${(png.length/1024).toFixed(1)} KB)`);
    } catch (e) {
        console.error(`  ✗ icon-${size}.png: ${e.message}`);
    }
}

console.log('\n✅ Icons generated in src/main/resources/static/icons/');
console.log('\n💡 Tip: Để có icon đẹp hơn, upload file icons/icon.svg lên:');
console.log('   https://realfavicongenerator.net  hoặc  https://maskable.app/editor');
console.log('   rồi thay thế các file PNG trong src/main/resources/static/icons/\n');
