/**
 * 미래애드원 상담 신청 수신 — Google Apps Script 웹앱
 * 홈페이지 상담 신청서 → 구글 시트 저장 → 메일 알림 (+ 선택: 슬랙)
 * 인프케어 홈페이지용 Code.gs 를 바탕으로 기획서 11장 항목(업종·지역·관심 서비스·예산·현재 사이트·상태값)에 맞춰 수정
 * 설정 방법은 같은 폴더의 「설정가이드.md」 참고
 */
const CONFIG = {
  SHEET_NAME: '상담신청',
  NOTIFY_TO: '',            // 알림 받을 메일. 여러 명이면 쉼표로: 'a@x.com,b@y.com'  (비우면 메일 생략)
};

const HEAD = ['접수일시', '접수번호', '상태', '담당자', '메모', '이름/업체명', '연락처', '업종', '지역', '관심 서비스', '월 예산', '현재 사이트·블로그', '문의 내용',
  'utm_source', 'utm_medium', 'utm_campaign', '검색어(utm_term/n_query)', 'gclid', '유입 referrer', '첫 랜딩', '신청 페이지', '기기', '작성시간(초)'];
const STATUS = ['신규', '연락완료', '상담중', '견적발송', '계약', '보류', '종료'];

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    const d = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (d.hp) return out_({ ok: true, id: '-' });                          // 스팸봇(숨김 필드 입력)
    if (!d.name || !d.phone) return out_({ ok: false, error: '필수값 누락' });
    const digits = String(d.phone).replace(/\D/g, '');
    if (!/^0\d{8,10}$/.test(digits)) return out_({ ok: false, error: '전화번호 형식 오류' });
    if (!d.agree) return out_({ ok: false, error: '개인정보 동의 필요' });

    const cache = CacheService.getScriptCache();                        // 같은 번호 2분 안 중복 제출 방지
    const prev = cache.get('p_' + digits);
    if (prev) return out_({ ok: true, id: prev, dup: true });

    lock.waitLock(20000);
    const sh = sheet_();
    const id = 'MA' + Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyMMdd') + '-' + String(sh.getLastRow()).padStart(4, '0');
    const a = d.attr || {};
    sh.appendRow([
      new Date(), id, '신규', '', '', d.name, "'" + d.phone, d.industry || '', d.region || '', (d.services || []).join(', '), d.budget || '', d.url || '', d.message || '',
      a.utm_source || '', a.utm_medium || '', a.utm_campaign || '', a.utm_term || a.n_query || '', a.gclid || '', a.referrer || '', a.landing || '', d.page || '',
      /Mobi|Android|iPhone/i.test(d.ua || '') ? '모바일' : 'PC', Math.round((d.dwell || 0) / 1000)
    ]);
    SpreadsheetApp.flush();
    cache.put('p_' + digits, id, 120);
    lock.releaseLock();

    try { notify_(id, d); } catch (err) { console.error('알림 실패(접수는 저장됨)', err); }
    return out_({ ok: true, id: id });
  } catch (err) {
    console.error(err);
    return out_({ ok: false, error: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (e) { }
  }
}

function doGet() { return out_({ ok: true, service: 'mirae-adone-leads' }); }

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(CONFIG.SHEET_NAME);
  if (!sh) {
    sh = ss.insertSheet(CONFIG.SHEET_NAME);
    sh.appendRow(HEAD);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEAD.length).setFontWeight('bold').setBackground('#111D30').setFontColor('#ffffff');
    sh.getRange('C2:C').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(STATUS, true).build());
    sh.setColumnWidth(1, 150); sh.setColumnWidth(10, 240); sh.setColumnWidth(13, 320);
  }
  return sh;
}

function notify_(id, d) {
  if (!CONFIG.NOTIFY_TO) return;
  const a = d.attr || {};
  const rows = [['접수번호', id], ['이름/업체명', d.name], ['연락처', d.phone], ['업종', d.industry], ['지역', d.region], ['관심 서비스', (d.services || []).join(', ')],
    ['월 예산', d.budget], ['현재 사이트', d.url], ['문의 내용', d.message], ['유입', [a.utm_source, a.utm_term || a.n_query, a.referrer].filter(String).join(' / ')], ['신청 페이지', d.page]].filter(r => r[1]);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const html = '<h2 style="font-family:sans-serif">미래애드원 새 상담 신청</h2><table style="font-family:sans-serif;border-collapse:collapse">' +
    rows.map(r => '<tr><td style="padding:6px 12px;background:#F3F6F8;font-weight:bold">' + r[0] + '</td><td style="padding:6px 12px">' + esc(r[1]) + '</td></tr>').join('') +
    '</table><p style="font-family:sans-serif"><a href="' + SpreadsheetApp.getActiveSpreadsheet().getUrl() + '">구글 시트에서 보기</a></p>';
  MailApp.sendEmail({ to: CONFIG.NOTIFY_TO, subject: '[미래애드원] 새 상담 신청 · ' + d.name + ' · ' + ((d.services || []).join(', ') || '서비스 미선택'), htmlBody: html, name: '미래애드원 홈페이지' });

  const hook = PropertiesService.getScriptProperties().getProperty('SLACK_WEBHOOK');  // 선택: 슬랙 알림(URL은 서버에만 보관)
  if (hook) UrlFetchApp.fetch(hook, { method: 'post', contentType: 'application/json', muteHttpExceptions: true, payload: JSON.stringify({ text: '📩 미래애드원 새 상담 신청 ' + id + '\n' + rows.map(r => '*' + r[0] + '*: ' + r[1]).join('\n') }) });
}

function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }

/* 편집기에서 한 번 실행: 시트 만들기 + 메일 권한 요청 */
function setup() {
  sheet_();
  Logger.log('시트 준비 완료. 오늘 남은 메일 발송량: ' + MailApp.getRemainingDailyQuota());
}
