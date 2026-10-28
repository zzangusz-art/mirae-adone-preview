# 미래애드원 홈페이지 (mirae-site)

정적 사이트 + 인사이트(블로그) 하루 3편 AI 자동 발행. 서버·DB 없이 GitHub Pages 등 어디서나 호스팅됩니다.

## 구조
| 경로 | 내용 |
|---|---|
| `src/data.mjs` | **모든 문구·가격·FAQ·포트폴리오·서비스 18종** — 내용 수정은 여기 한 곳 |
| `src/pages.mjs`, `src/blocks.mjs`, `src/layout.mjs` | 페이지·섹션 템플릿 |
| `content/blog/*.md` | 인사이트 글(마크다운). `_topics.json` = 주제 대기열 |
| `assets/css/style.css`, `assets/js/app.js` | 디자인·인터랙션 |
| `assets/js/config.js` | 운영 설정(상담 접수 주소, 전화, 카카오, GA4·네이버 분석) |
| `assets/img/` | 기존 mirae-adone.com 이미지(WebP 변환, `../tools/prepare_assets.py`) |
| `tools/blog-ai/generate.mjs` | AI 글 작성기(Claude API) + 검증기 |
| `tools/check-site.mjs` | 링크·이미지·JSON-LD·제목 중복 점검 |
| `apps-script/` | 상담 신청 → 구글 시트·메일 (설정가이드.md) |
| `.github/workflows/site.yml` | 빌드·배포 + 매일 09·13·18시(KST) 글 1편씩 |

빌드 결과(`index.html`, `about/`, `services/` …)는 자동 생성물이라 git 에 올리지 않습니다.

## 자주 하는 일
- **미리보기**: `node build.mjs` 후 `python -m http.server 5531 --directory .` → http://localhost:5531
- **가격 바꾸기**: `src/data.mjs` 의 `BLOG_PLANS` / `WEB_AI_PLAN` → 홈·가격·서비스 페이지·계산기·구조화 데이터·llms.txt·AI 글 사실목록이 함께 바뀝니다. 홈페이지+AI 검색 금액을 숨기려면 `PRICE_SHOW_WEB_AI = false`.
- **글 직접 쓰기**: `content/blog/새-글.md` (머리말 형식은 기존 글 참고) → `node tools/blog-ai/generate.mjs --check` 로 검증.
- **AI 주제 미리보기**: `node tools/blog-ai/generate.mjs --plan` (API 호출 없음). 대기열이 끝나면 서비스×업종×관점 조합(756개)으로 자동 생성.
- **전체 점검**: `npm run check`

## 하루 3편 발행 — 예약 글 + AI 자동 작성
- **예약 글**: `content/blog/*.md` 의 `date`·`time` 이 미래면 그 시각이 지난 뒤 첫 빌드에서 공개됩니다(09:00·13:00·18:00 KST 예약 실행이 빌드). 2026-10-26 ~ 11-02 분량 24편을 미리 써 두었습니다. 새로 미리 써 둔 글은 `node tools/blog/mark_topics.mjs` 로 주제 대기열에 반영.
- **AI 자동 작성**: 예약 실행마다 그날(KST) 글이 예약 글 포함 3편 미만이면 1편을 써서 채웁니다(`--cap 3`). 예약 글이 있는 날은 쓰지 않습니다.
- **검색어 겹침 방지**: 글마다 머리말 `keyword:`(1순위 검색어)를 하나씩 둡니다. 검증기가 다른 글과 같은 검색어(띄어쓰기·가운뎃점 무시)를 거부하고, 아직 공개 전인 글로 가는 내부 링크도 거부합니다. AI 작성 요청에도 이미 쓰인 검색어 목록이 함께 들어갑니다.
- **노출 우선 검색어 16개**: AEO GEO 마케팅 · 홈페이지 제작 · 블로그관리대행 · 브랜드 블로그 · 블로그 마케팅 · 블로그광고대행 · 블로그운영대행 · 블로그 홍보 · 네이버 블로그 광고 · 인테리어/병원/학원/부동산 · 병원 홈페이지 · 바이럴 마케팅 · 온라인광고대행사 — 2026-11-06까지 각 검색어의 중심 글이 하나씩 있고, 이후 글은 이 중심 글을 내부 링크로 받쳐 주는 세부 검색어로 씁니다.

### AI 자동 작성 켜기
1. 저장소 **Settings → Secrets and variables → Actions → New repository secret** → `ANTHROPIC_API_KEY` (대표님 계정 키를 직접 입력).
2. **Actions → site → Run workflow** 로 1편 시험 생성 → `content/blog/` 에 글이 생기고 사이트에 반영되는지 확인(수동 실행은 상한 없이 지정한 편수만큼 씀).
3. 이후 09:00·13:00·18:00(KST) 자동 실행(GitHub 예약 실행은 몇 분~2시간 가까이 늦을 수 있음).
- 모델: 기본 `claude-opus-5-5`(effort high, 거절 시 서버 측 대체 모델). 비용을 줄이려면 Variables 에 `BLOG_MODEL=claude-sonnet-5-5`.
- 검증 실패(금지 표현·사실 목록에 없는 수치·외부 링크 등) 글은 발행하지 않고 `content/drafts/` 에 남습니다.

## 처음 배포 (GitHub Pages 미리보기)
```
cd mirae-site
git init -b main
git add -A && git commit -m "미래애드원 사이트"
gh repo create <계정>/mirae-adone-preview --public --source . --push
gh api -X POST repos/<계정>/mirae-adone-preview/pages -f build_type=workflow
```
이후 갱신은 상위 폴더의 `deploy.bat` 더블클릭(빌드·점검 → 커밋 → AI 글 받아오기 → 푸시 → GitHub Pages·Railway 배포 결과까지 확인). 미리보기는 전 페이지 `noindex`.
실제 도메인(www.mirae-adone.com)은 Railway 로 서빙 중(아래 「Railway 배포」). GitHub Pages 는 미리보기 전용으로 유지.

## Railway 배포
저장소를 Railway 에 연결하면 푸시마다 자동 배포됩니다. 설정은 `railway.json`(코드로 관리) — 화면에서 따로 고칠 것은 없습니다.
- 빌드: `npm run railway:build` = `build.mjs` + 내보내기(`_site`, 소스·도구·글 원고 제외). 깨진 상태면 여기서 멈춰 이전 배포가 그대로 유지됩니다.
- 실행: `npm start` = `tools/serve.mjs`(의존성 없는 정적 서버, `PORT`). 동영상 Range·gzip·404 페이지 처리.
- 예약 글: 서버가 09:00·13:00·18:00(KST)마다 다시 빌드해 그 시각 글을 공개합니다(푸시가 없어도).
- 색인은 접속 주소로 나뉩니다: **www.mirae-adone.com = 운영(색인 허용)**, `*.up.railway.app`·그 밖 = 미리보기(noindex·robots 차단 — 같은 내용이 두 주소로 색인되는 것 방지). `mirae-adone.com` → `https://www.mirae-adone.com` 301. 모든 주소를 한쪽으로 고정하려면 Railway Variables 에 `PRODUCTION=true` 또는 `false`.
- 로컬에서 똑같이 띄워 보기: `npm start` → http://localhost:8080 (미리보기 모드)

## 방문·전환 추적
아이디는 `assets/js/config.js` 한 곳에만 넣고 `deploy.bat`. 비어 있는 도구는 불러오지 않습니다. 운영 주소(`TRACK_HOSTS`)에서만 켜지고, 미리보기에서 시험하려면 주소 끝에 `?track=on`(콘솔에 `[track]` 로그, 끄기 `?track=off`). 코드는 `assets/js/track.js`.

| 설정 | 어디서 받나 |
|---|---|
| `GA4_ID` | analytics.google.com → 관리 → 데이터 스트림(웹, `https://www.mirae-adone.com`) → 측정 ID `G-…` |
| `GTM_ID` | tagmanager.google.com → 컨테이너(웹) `GTM-…`. GA4 를 `GA4_ID` 로 넣었다면 GTM 안에 GA4 구성 태그를 또 만들지 않기(중복 집계). 아래 이벤트는 GTM 「맞춤 이벤트」 트리거로 같은 이름 그대로 받을 수 있음 |
| `GOOGLE_ADS_ID`·`GOOGLE_ADS_LEAD_LABEL` | Google Ads → 목표 → 전환 → 웹사이트 전환 「직접 코드 설치」의 `AW-…` / 라벨 |
| `NAVER_ANALYTICS_ID` | analytics.naver.com → 사이트 등록 → 사이트 키 |
| `NAVER_WCS_ID` | 네이버 검색광고 → 도구 → 전환추적 신청 → 안내 메일의 AccountId `s_…` (새 전환 스크립트 `wcs.trans` 사용: 상담 신청 `lead`, 전화 `custom001`, 카카오톡 `custom002`) |
| `CLARITY_ID` | clarity.microsoft.com → 새 프로젝트 → 설정 → 프로젝트 ID (히트맵·세션 녹화, 입력값 자동 가림) |
| `META_PIXEL_ID` · `KAKAO_PIXEL_ID` | 메타 이벤트 관리자 픽셀 ID · 카카오모먼트 픽셀 & SDK 트랙 ID |

보내는 이벤트(이름·연락처 등 상담 내용은 어떤 도구에도 보내지 않음):

| 이벤트 | 시점 | 광고 전환 |
|---|---|---|
| `generate_lead` | 상담 신청 실제 접수(`LEAD_ENDPOINT` 저장 성공). 값: services·industry·budget | GA4 주요 이벤트로 표시 · Google Ads 전환 · 네이버 `lead` · 메타 `Lead` · 카카오 `participation` |
| `lead_draft` | 접수 주소가 없어 신청 내용만 정리해 보여 준 경우(실제 접수 아님) | 없음 |
| `click_tel` · `click_kakao` | 전화·카카오톡 버튼(값 location: header·dock·footer·drawer·섹션 id) | 네이버 `custom001`·`custom002` · 메타 `Contact` |
| `open_quote` · `click_contact` | 상담 창 열기(값 service) · 상담 페이지로 가는 버튼 | 없음 |
| `form_start` · `form_step` | 상담 폼 첫 입력 · 다음 단계(step 2·3) | 없음 |
| `calc_use` · `scroll_depth` | 비용 계산기 사용 · 스크롤 25/50/75/100% | 없음 |

GA4 에서 할 일: 관리 → 이벤트 → `generate_lead` 를 「주요 이벤트」로 표시, 데이터 보관 기간 14개월, Search Console 연결(관리 → 제품 링크).
**상담 신청 접수 주소(`LEAD_ENDPOINT`)가 비어 있는 동안은 `generate_lead`(광고 전환)가 생기지 않습니다** — `apps-script/설정가이드.md` 먼저.

## 검색엔진 등록
- 소유 확인 값은 `src/data.mjs` 의 `SITE_VERIFICATION`(네이버 값은 기존 사이트 것 유지 중). 넣고 `deploy.bat`.
- **Google Search Console**: 「도메인」 속성 `mirae-adone.com` 추가 → DNS 가 Cloudflare 라 「Cloudflare 로 확인」 버튼으로 자동 확인(가장 간단). 또는 「URL 접두어」 `https://www.mirae-adone.com/` → HTML 태그 값을 `SITE_VERIFICATION.google` 에. 이후 사이트맵 `sitemap.xml` 제출.
- **네이버 서치어드바이저**: 사이트 `https://www.mirae-adone.com` (기존 등록·확인 태그 유지) → 요청 → 사이트맵 `https://www.mirae-adone.com/sitemap.xml`, RSS `https://www.mirae-adone.com/insights/feed.xml` 제출 → 웹 페이지 수집 요청(홈·서비스) → 검증 → robots.txt 확인.
- **Bing 웹마스터 도구**: Search Console 에서 가져오기(소유 확인·사이트맵 자동). **다음 웹마스터도구**: 받은 한 줄을 `SITE_VERIFICATION.daum`(robots.txt 에 들어감).
- **IndexNow**(네이버·Bing 즉시 알림): 키 파일 `/<INDEXNOW_KEY>.txt` 자동 생성. 서버가 그날 공개된 인사이트 글을 자동으로 알림. 전체 한 번 보내기: `node build.mjs && node tools/indexnow.mjs --all`.
