#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
인사이트(블로그) 썸네일 생성기 — 1200x675(16:9)

스타터즈 build_thumbs.py(600x600)의 구조를 따르되 미래애드원 톤으로 바꿨다.
  배경: tools/thumbs/bg/<theme>.jpg  (CC0 사진 + 미래애드원 포트폴리오 콜라주, 출처는 bg/CREDITS.json)
  입력: content/blog/*.md 머리말(title, cover, category, slug, thumb_bg)
  출력: assets/img/insights/<slug>.jpg  → 목록 카드·글 상단·og:image·JSON-LD 가 모두 이 파일 하나를 쓴다

구성(바꾸지 않는다): 어두운 배경 사진 + 카테고리(오렌지, 자간) + 제목(흰색 Noto Sans KR Bold) + 오렌지 구분선 + 미래애드원 로고
배치 원칙: 모든 좌표는 textbbox/실측 advance로 계산한다. 눈대중 오프셋 금지.

사용법:  python tools/thumbs/build_thumbs.py [--force] [--only <slug>]
         --force 없으면 원본(글·배경·이 스크립트)이 더 최신일 때만 다시 만든다.
"""

import os
import random
import re
import sys

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
POSTS_DIR = os.path.join(ROOT, 'content', 'blog')
BG_DIR = os.path.join(HERE, 'bg')
OUT_DIR = os.path.join(ROOT, 'assets', 'img', 'insights')
LOGO = os.path.join(ROOT, 'assets', 'img', 'brand', 'logo-white.png')
FONT_BOLD = os.path.join(HERE, 'fonts', 'NotoSansKR-Bold.ttf')
FONT_MED = os.path.join(HERE, 'fonts', 'NotoSansKR-Medium.ttf')

W, H = 1200, 675
NAVY = (10, 19, 34)
ORANGE = (247, 163, 111)
ORANGE_RULE = (242, 139, 75)
WHITE = (255, 255, 255)


# ── 머리말 ────────────────────────────────────────────
def front(path):
    s = open(path, encoding='utf-8').read().lstrip('﻿')
    m = re.match(r'^---\r?\n([\s\S]*?)\r?\n---', s)
    meta = {}
    if m:
        for line in m.group(1).splitlines():
            kv = re.match(r'^([a-zA-Z_]+):\s*(.*)$', line)
            if kv:
                meta[kv.group(1)] = kv.group(2).strip().strip('"\'')
    return meta


# ── 실측 텍스트 유틸(스타터즈 생성기와 같은 방식) ─────
def tracked_width(d, s, f, tr):
    return sum(d.textlength(ch, font=f) for ch in s) + tr * max(0, len(s) - 1)


def draw_tracked(d, x, y, s, f, fill, tr):
    for ch in s:
        d.text((x, y), ch, font=f, fill=fill)
        x += d.textlength(ch, font=f) + tr


def wrap_measured(d, s, f, max_w):
    """공백 우선, 넘치면 글자 단위로 실측 줄바꿈."""
    words, lines, cur = s.split(' '), [], ''
    for w in words:
        trial = (cur + ' ' + w).strip()
        if cur and d.textlength(trial, font=f) > max_w:
            lines.append(cur)
            cur = w
        else:
            cur = trial
        while d.textlength(cur, font=f) > max_w and len(cur) > 1:
            cut = len(cur)
            while cut > 1 and d.textlength(cur[:cut], font=f) > max_w:
                cut -= 1
            lines.append(cur[:cut])
            cur = cur[cut:]
    if cur:
        lines.append(cur)
    return lines


def balance(d, lines, f, max_w):
    """두 줄일 때 윗줄만 길고 아랫줄이 한 단어로 남으면 어절을 내려 균형을 맞춘다."""
    if len(lines) != 2:
        return lines
    a, b = lines
    while ' ' in a:
        head, last = a.rsplit(' ', 1)
        nb = last + ' ' + b
        if d.textlength(nb, font=f) > max_w or d.textlength(head, font=f) < d.textlength(nb, font=f):
            break
        a, b = head, nb
    return [a, b]


# ── 표지 문구 ────────────────────────────────────────
def display_title(m):
    """머리말 cover(32자 이내 표지 문구)를 우선 쓰고, 없으면 제목의 앞 절만 쓴다."""
    t = (m.get('thumb_title') or m.get('cover') or '').strip()
    if t:
        return t
    t = (m.get('title') or '').strip()
    for sep in ('—', '–', ' - ', ', '):
        if sep in t and len(t.split(sep)[0].strip()) >= 8:
            t = t.split(sep)[0].strip()
            break
    return t


# ── 배경 테마 ────────────────────────────────────────
# 제목의 강한 신호만 본다. 흔한 단어는 넣지 않는다(배경이 한쪽으로 쏠리는 것을 막기 위해).
THEME_RULES = [
    ('cafe',       r'카페|커피|디저트|베이커리'),
    ('food',       r'음식점|식당|외식|메뉴|맛집|요리'),
    ('kitchen',    r'촬영|사진|영상|숏폼|릴스'),
    ('legal',      r'법률|변호사|법무|세무|노무|의료광고|심의|규정|표시|협찬|공정위|추천·보증|개인정보'),
    ('contract',   r'계약|해지|환불|인계|권한|저작권|약관'),
    ('blog',       r'블로그|원고|포스팅|스킨|글감|주제'),
    ('web',        r'홈페이지|웹사이트|랜딩|리뉴얼|모바일|상담폼|전환|301|유지보수'),
    ('cost',       r'비용|가격|단가|수수료|예산|견적|매체비|1회당|광고비'),
    ('data',       r'AI|GEO|AEO|SEO|ChatGPT|Gemini|구조화|색인|서치어드바이저|llms|GA4|분석|추적|데이터'),
    ('marketing',  r'광고|바이럴|체험단|기자단|카페 바이럴|맘카페|SNS|인스타그램|보도자료|언론'),
    ('storefront', r'플레이스|매장|오픈|가맹점|프랜차이즈|펜션|숙박'),
    ('meeting',    r'상담|보고서|보고|대행사|업체 선택|고르는'),
    ('city',       r'지역|상권|동네'),
]
CAT_THEME = {
    '블로그 마케팅': 'writing',
    'AI 검색·SEO': 'data',
    '검색광고·플레이스': 'cost',
    '홈페이지': 'web',
    'SNS·콘텐츠': 'marketing',
    '업종별 가이드': 'storefront',
}


# 자주 나오는 테마는 배경 2장을 글(slug)마다 번갈아 쓴다
ALTERNATES = {'data': ('data', 'search'), 'cost': ('cost', 'search')}


def pick_theme(m):
    forced = (m.get('thumb_bg') or '').strip()
    if forced and os.path.exists(os.path.join(BG_DIR, forced + '.jpg')):
        return forced
    hay = m.get('title', '')
    theme = None
    for t, pat in THEME_RULES:
        if re.search(pat, hay, re.IGNORECASE):
            theme = t
            break
    theme = theme or CAT_THEME.get((m.get('category') or '').strip(), 'trend')
    alts = ALTERNATES.get(theme)
    return alts[sum(ord(c) for c in m.get('slug', '')) % len(alts)] if alts else theme


# ── 배경 합성 ────────────────────────────────────────
def make_background(theme, seed):
    src = Image.open(os.path.join(BG_DIR, theme + '.jpg')).convert('RGB')
    s = max(W / src.width, H / src.height)
    im = src.resize((max(W, int(src.width * s) + 1), max(H, int(src.height * s) + 1)), Image.LANCZOS)
    rnd0 = random.Random(seed * 7 + 3)
    zoom = 1.0 + rnd0.choice((0.0, 0.08, 0.16))                  # 같은 배경이라도 글마다 다른 구도
    if zoom > 1.0:
        im = im.resize((int(im.width * zoom), int(im.height * zoom)), Image.LANCZOS)
    left = int((im.width - W) * rnd0.choice((0.15, 0.5, 0.85)))
    top = int((im.height - H) * rnd0.choice((0.3, 0.4, 0.55)))
    im = im.crop((left, top, left + W, top + H))
    if theme not in ('web', 'blog') and seed % 2:
        im = im.transpose(Image.FLIP_LEFT_RIGHT)

    # 톤 통일: 채도·밝기를 낮추고 네이비를 살짝 덮어 브랜드 색으로 맞춘다
    im = ImageEnhance.Color(im).enhance(0.55)
    im = ImageEnhance.Brightness(im).enhance(0.62)
    im = ImageEnhance.Contrast(im).enhance(1.05)
    im = Image.blend(im, Image.new('RGB', (W, H), NAVY), 0.28)

    # 세로 그라디언트: 위는 사진이 보이고 아래는 거의 네이비
    grad = Image.new('L', (1, H))
    for y in range(H):
        t = y / (H - 1)
        grad.putpixel((0, y), int(60 + (240 - 60) * (t ** 1.45)))
    grad = grad.resize((W, H))
    im = Image.composite(Image.new('RGB', (W, H), (7, 13, 24)), im, grad)

    # 비네트
    vig = Image.new('L', (W, H), 0)
    ImageDraw.Draw(vig).ellipse((-W * 0.22, -H * 0.36, W * 1.22, H * 1.36), fill=255)
    vig = vig.filter(ImageFilter.GaussianBlur(W * 0.09))
    im = Image.composite(im, Image.new('RGB', (W, H), (5, 9, 16)), vig)

    # 오른쪽 위 CI 블루 빛 번짐(히어로와 같은 결)
    glow = Image.new('L', (W, H), 0)
    ImageDraw.Draw(glow).ellipse((W * 0.62, -H * 0.55, W * 1.25, H * 0.55), fill=120)
    glow = glow.filter(ImageFilter.GaussianBlur(120))
    im = Image.composite(Image.new('RGB', (W, H), (0, 66, 214)), im, glow)

    # 미세 그레인
    rnd = random.Random(seed)
    noise = Image.new('L', (W // 2, H // 2))
    noise.putdata([rnd.randint(112, 143) for _ in range((W // 2) * (H // 2))])
    noise = noise.resize((W, H), Image.BILINEAR)
    return Image.blend(im, Image.merge('RGB', (noise, noise, noise)), 0.04)


# ── 썸네일 1장 ───────────────────────────────────────
def render(m):
    im = make_background(pick_theme(m), sum(ord(c) for c in m['slug']))
    d = ImageDraw.Draw(im, 'RGBA')
    PAD_X = 120
    MAX_W = W - PAD_X * 2

    title = display_title(m)
    for size in (74, 70, 66, 62, 58, 54, 50, 46, 42):
        f_title = ImageFont.truetype(FONT_BOLD, size)
        lines = balance(d, wrap_measured(d, title, f_title, MAX_W), f_title, MAX_W)
        if len(lines) <= 2:
            break
    else:
        lines = lines[:3]
    line_h = round(size * 1.3)

    f_cat = ImageFont.truetype(FONT_MED, 25)
    TRACK_CAT = 5.0
    logo = Image.open(LOGO).convert('RGBA')
    lh = 34
    logo = logo.resize((round(logo.width * lh / logo.height), lh), Image.LANCZOS)

    # 아래에서 위로 쌓아 실제 y좌표 계산
    y_logo = H - 54 - lh
    y_rule = y_logo - 30
    asc, desc = f_title.getmetrics()
    y_title_bottom = y_rule - 34
    y_title_top = y_title_bottom - line_h * len(lines) + (line_h - (asc + desc)) // 2
    cat = (m.get('category') or '인사이트').strip()
    cat_box = d.textbbox((0, 0), cat, font=f_cat)
    y_cat = y_title_top - 26 - (cat_box[3] - cat_box[1])

    # 텍스트 뒤 스크림
    scrim_top = int(y_cat - 70)
    scrim = Image.new('L', (W, H), 0)
    sd = ImageDraw.Draw(scrim)
    for i in range(H - scrim_top):
        t = i / max(1, H - scrim_top - 1)
        sd.line([(0, scrim_top + i), (W, scrim_top + i)], fill=int(165 * min(1.0, t * 1.7)))
    im.paste(Image.new('RGB', (W, H), (6, 11, 20)), (0, 0), scrim)
    d = ImageDraw.Draw(im, 'RGBA')

    # 카테고리(자간, 실측 중앙)
    w_cat = tracked_width(d, cat, f_cat, TRACK_CAT)
    draw_tracked(d, (W - w_cat) / 2, y_cat - cat_box[1], cat, f_cat, ORANGE, TRACK_CAT)

    # 제목(줄마다 실측 중앙)
    y = y_title_top
    for ln in lines:
        d.text(((W - d.textlength(ln, font=f_title)) / 2, y), ln, font=f_title, fill=WHITE)
        y += line_h

    # 오렌지 구분선 + 로고
    rule_w = 64
    d.line([((W - rule_w) / 2, y_rule), ((W + rule_w) / 2, y_rule)], fill=ORANGE_RULE + (230,), width=2)
    a = logo.getchannel('A').point(lambda v: int(v * 0.92))
    logo.putalpha(a)
    im.paste(logo, ((W - logo.width) // 2, y_logo), logo)

    # 얇은 프레임
    d = ImageDraw.Draw(im, 'RGBA')
    d.rectangle([(26, 26), (W - 27, H - 27)], outline=(255, 255, 255, 34), width=1)
    return im


def main():
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
    force = '--force' in sys.argv
    only = sys.argv[sys.argv.index('--only') + 1] if '--only' in sys.argv else None
    os.makedirs(OUT_DIR, exist_ok=True)
    self_mtime = os.path.getmtime(os.path.abspath(__file__))
    made = skipped = 0
    for fn in sorted(os.listdir(POSTS_DIR)):
        if not fn.endswith('.md') or fn.startswith('_'):
            continue
        p = os.path.join(POSTS_DIR, fn)
        m = front(p)
        m['slug'] = m.get('slug') or fn[:-3]
        if only and m['slug'] != only:
            continue
        out = os.path.join(OUT_DIR, m['slug'] + '.jpg')
        if not force and os.path.exists(out):
            newest = max(os.path.getmtime(p), os.path.getmtime(os.path.join(BG_DIR, pick_theme(m) + '.jpg')), self_mtime)
            if os.path.getmtime(out) >= newest:
                skipped += 1
                continue
        render(m).save(out, 'JPEG', quality=84, optimize=True, progressive=True)
        made += 1
        print(f'  {m["slug"]}.jpg  ← {pick_theme(m)} · "{display_title(m)}"')
    total_kb = sum(os.path.getsize(os.path.join(OUT_DIR, f)) for f in os.listdir(OUT_DIR)) // 1024
    print(f'thumb 생성 완료: {made}장 생성 · {skipped}장 스킵 · 총 {total_kb}KB → assets/img/insights/')


if __name__ == '__main__':
    main()
