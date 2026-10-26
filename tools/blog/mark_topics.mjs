// 미리 써 둔(예약) 글을 주제 대기열에 반영: 글 머리말의 topic 값과 같은 주제를 done 으로, slug·date 기록
//   node tools/blog/mark_topics.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontmatter } from './lib.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const BLOG = path.join(ROOT, 'content/blog'), TOPICS = path.join(BLOG, '_topics.json');
const topics = JSON.parse(fs.readFileSync(TOPICS, 'utf8'));
let n = 0;
for (const f of fs.readdirSync(BLOG).filter(f => f.endsWith('.md') && !f.startsWith('_'))) {
  const { meta } = parseFrontmatter(fs.readFileSync(path.join(BLOG, f), 'utf8'));
  const t = meta.topic && topics.find(x => x.id === meta.topic);
  if (t && t.status !== 'done') { t.status = 'done'; t.slug = meta.slug; t.date = meta.date; t.time = meta.time; n++; }
}
fs.writeFileSync(TOPICS, JSON.stringify(topics, null, 2) + '\n');
console.log('done 표시', n, '· 남은 대기 주제', topics.filter(t => t.status === 'todo').length);
