// 빌드 공용 도우미: 이스케이프, 금액, 이미지 크기(WebP/PNG 헤더), 아이콘
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const won = n => Number(n).toLocaleString('ko-KR') + '원';
export const man = n => (n % 10000 === 0 ? (n / 10000).toLocaleString('ko-KR') + '만원' : won(n));
export const ld = obj => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

const sizeCache = new Map();
export function imgSize(rel) {
  if (sizeCache.has(rel)) return sizeCache.get(rel);
  const f = path.join(ROOT, 'assets/img', rel);
  if (!fs.existsSync(f)) throw new Error(`이미지 없음: assets/img/${rel}`);
  const b = fs.readFileSync(f);
  let w = 0, h = 0;
  if (b.toString('ascii', 0, 4) === 'RIFF') {
    const t = b.toString('ascii', 12, 16);
    if (t === 'VP8 ') { w = b.readUInt16LE(26) & 0x3fff; h = b.readUInt16LE(28) & 0x3fff; }
    else if (t === 'VP8L') { const [b0, b1, b2, b3] = [b[21], b[22], b[23], b[24]]; w = 1 + (((b1 & 0x3f) << 8) | b0); h = 1 + (((b3 & 0xf) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6)); }
    else if (t === 'VP8X') { w = 1 + b.readUIntLE(24, 3); h = 1 + b.readUIntLE(27, 3); }
  } else if (b.readUInt32BE(0) === 0x89504e47) { w = b.readUInt32BE(16); h = b.readUInt32BE(20); }
  else if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2; while (i < b.length) { if (b[i] !== 0xff) { i++; continue; } const m = b[i + 1]; const len = b.readUInt16BE(i + 2); if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) { h = b.readUInt16BE(i + 5); w = b.readUInt16BE(i + 7); break; } i += 2 + len; }
  }
  if (!w || !h) throw new Error(`크기 읽기 실패: ${rel}`);
  const r = { w, h }; sizeCache.set(rel, r); return r;
}

// 스켈레톤 래퍼가 있는 지연 로딩 이미지. R = 상대 경로 접두사
export function img(R, rel, alt, { cls = '', eager = false, sizes = '', frame = true } = {}) {
  const { w, h } = imgSize(rel);
  const tag = `<img src="${R}assets/img/${rel}" width="${w}" height="${h}" alt="${esc(alt)}"${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async"${sizes ? ` sizes="${sizes}"` : ''}>`;
  return frame ? `<span class="sk ${cls}" style="aspect-ratio:${w}/${h}">${tag}</span>` : tag;
}

export const icon = (id, cls = '') => `<svg class="i ${cls}" aria-hidden="true"><use href="#i-${id}"/></svg>`;
