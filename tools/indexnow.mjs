// IndexNow: 새 글·바뀐 페이지 주소를 네이버·Bing 등에 바로 알린다(Google 은 참여하지 않음 — 사이트맵으로 수집)
//   node tools/indexnow.mjs --all            → sitemap.xml 의 모든 주소(운영 시작·대규모 변경 때 한 번)
//   node tools/indexnow.mjs <주소> [<주소> …]  → 지정한 주소만
// 키 확인 파일: https://www.mirae-adone.com/<INDEXNOW_KEY>.txt (build.mjs 가 만든다). 실행 중 서버(tools/serve.mjs)는 예약 글이 공개될 때 자동으로 보낸다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE, INDEXNOW_KEY } from '../src/data.mjs';

const ENDPOINTS = ['https://searchadvisor.naver.com/indexnow', 'https://api.indexnow.org/indexnow'];

export async function submitIndexNow(urls) {
  const host = new URL(SITE).hostname;
  const list = [...new Set(urls)].filter(u => u.startsWith(SITE));
  if (!INDEXNOW_KEY || !list.length) return [];
  const body = JSON.stringify({ host, key: INDEXNOW_KEY, keyLocation: `${SITE}${INDEXNOW_KEY}.txt`, urlList: list });
  return Promise.all(ENDPOINTS.map(async ep => {
    try {
      const r = await fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8' }, body, signal: AbortSignal.timeout(15000) });
      return `${new URL(ep).hostname} ${r.status}`;
    } catch (e) { return `${new URL(ep).hostname} 실패(${e.message})`; }
  }));
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  let urls = args.filter(a => /^https?:\/\//.test(a));
  if (args.includes('--all')) {
    const xml = fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'sitemap.xml'), 'utf8');
    urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
  }
  if (!urls.length) { console.error('보낼 주소가 없습니다. --all 또는 주소를 넣으세요(먼저 node build.mjs).'); process.exit(1); }
  console.log(`IndexNow ${urls.length}개 →`, (await submitIndexNow(urls)).join(' · '));
}
