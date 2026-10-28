/* =========================================================
   미래애드원 사이트 설정 — 운영 중 바꿀 값은 이 파일만 고치면 됩니다
   ========================================================= */
window.MA_CONFIG = {
  /* 1) 상담 신청 수신 주소 (Google Apps Script 웹앱 URL, .../exec)
        apps-script/설정가이드.md 순서대로 배포한 뒤 붙여넣으세요.
        비어 있으면 신청 내용을 정리해 보여 주고 전화·카카오톡으로 연결합니다(저장되지 않음). */
  LEAD_ENDPOINT: '',

  /* 2) 연락처 */
  PHONE: '02-6481-6603',
  KAKAO: 'https://open.kakao.com/o/glzPMi4f',

  /* 3) 방문·전환 추적 — 있는 것만 입력. 비워 두면 그 스크립트는 불러오지 않습니다(assets/js/track.js).
        아래 TRACK_HOSTS 주소에서만 켜집니다. 미리보기 주소에서 시험하려면 주소 끝에 ?track=on (끄기 ?track=off)
        보내는 이벤트와 각 도구 설정 방법: README.md 「방문·전환 추적」 */
  GTM_ID: 'GTM-M8LBJ85R',      // Google 태그 관리자 (미래애드원 계정 · www.mirae-adone.com 컨테이너). GA4 는 아래 GA4_ID 로 직접 보내므로 GTM 안에 GA4 구성 태그를 또 만들지 마세요(중복 집계)
  GA4_ID: 'G-Q9407C4DEY',      // Google 애널리틱스 4 (미래애드원 계정 · 미래애드원 홈페이지 속성)
  GOOGLE_ADS_ID: '',           // Google Ads 전환 추적 ID (예: AW-123456789)
  GOOGLE_ADS_LEAD_LABEL: '',   // Google Ads 「상담 신청」 전환 라벨
  NAVER_ANALYTICS_ID: '',      // 네이버 애널리틱스(analytics.naver.com) 사이트 키
  NAVER_WCS_ID: '',            // 네이버 검색광고 전환추적·프리미엄 로그분석 AccountId (예: s_xxxxxxxxxxxx) — 상담 신청 lead, 전화 custom001, 카카오 custom002
  CLARITY_ID: '',              // Microsoft Clarity 프로젝트 ID (히트맵·세션 녹화, 입력값은 자동 가림)
  META_PIXEL_ID: '',           // 메타(페이스북·인스타그램) 픽셀 ID
  KAKAO_PIXEL_ID: '',          // 카카오 픽셀(카카오모먼트) 트랙 ID
  TRACK_HOSTS: ['www.mirae-adone.com', 'mirae-adone.com']
};
