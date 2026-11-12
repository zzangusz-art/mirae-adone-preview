// 관리자 페이지 측정 데이터 암호화(AES-256-GCM) — 저장소가 공개라서 data.enc 는 이 키 없이는 읽을 수 없다
// 키: 32바이트 base64. 이 PC 는 상위 폴더 .admin-data-key, 운영 서버는 Railway 변수 ADMIN_DATA_KEY
// 형식: 'MAD1' + iv(12) + tag(16) + 암호문(gzip 한 JSON)
import crypto from 'node:crypto';
import zlib from 'node:zlib';

const MAGIC = Buffer.from('MAD1');
const AAD = Buffer.from('mirae-admin-data');

export const newKey = () => crypto.randomBytes(32).toString('base64');

export function parseKey(s) {
  const b = Buffer.from(String(s || '').trim(), 'base64');
  if (b.length !== 32) throw new Error('ADMIN_DATA_KEY 는 32바이트 base64 값이어야 합니다');
  return b;
}

export function seal(obj, key) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv('aes-256-gcm', key, iv);
  c.setAAD(AAD);
  const body = Buffer.concat([c.update(zlib.gzipSync(Buffer.from(JSON.stringify(obj)), { level: 9 })), c.final()]);
  return Buffer.concat([MAGIC, iv, c.getAuthTag(), body]);
}

export function open(buf, key) {
  if (buf.length < 33 || !buf.subarray(0, 4).equals(MAGIC)) throw new Error('data.enc 형식이 아닙니다');
  const d = crypto.createDecipheriv('aes-256-gcm', key, buf.subarray(4, 16));
  d.setAAD(AAD);
  d.setAuthTag(buf.subarray(16, 32));
  const plain = Buffer.concat([d.update(buf.subarray(32)), d.final()]); // 키가 다르면 여기서 오류
  return JSON.parse(zlib.gunzipSync(plain).toString('utf8'));
}
