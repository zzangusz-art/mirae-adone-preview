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
이후 갱신은 상위 폴더의 `deploy-preview.bat` 더블클릭. 미리보기는 전 페이지 `noindex`.
실제 도메인(www.mirae-adone.com)으로 옮길 때: Variables 에 `PRODUCTION=true`, Pages 설정에 사용자 도메인 입력, DNS(CNAME) 변경.
