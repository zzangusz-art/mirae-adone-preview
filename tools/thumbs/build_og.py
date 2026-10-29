#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
페이지별 공유 썸네일(og:image) 생성기 — 1200x630

카카오톡·페이스북·네이버 블로그 등에 링크를 붙였을 때 보이는 큰 이미지. 기존 assets/img/og.jpg 와 같은 톤
(네이비 그라디언트 + 옅은 격자 + 로고 + 흰 제목 + 오렌지 구분선)으로, 페이지마다 핵심 검색어를 크게 넣는다.
  입력: src/data.mjs 의 SEO[키].card = { tag, lines: [큰 제목 1~2줄], sub }
  출력: assets/img/og/<키>.jpg  (키의 ':' 는 '-' 로 — svc:brand-blog → svc-brand-blog.jpg)
        src/pages.mjs 가 파일이 있으면 그 페이지의 og:image 로 쓰고, 없으면 og.jpg 를 쓴다.
글(인사이트) 썸네일은 build_thumbs.py 가 따로 만든다.

사용법:  python tools/thumbs/build_og.py [--force] [--only <키>]
        문구(card)가 그대로인 썸네일은 건너뛴다(JPEG 주석에 문구를 적어 두고 비교). deploy.bat 이 매번 실행한다.
"""

import functools
import json
import os
import subprocess
import sys

from PIL import Image, ImageDraw, ImageFilter, ImageFont

sys.dont_write_bytecode = True  # 저장소에 __pycache__ 를 남기지 않게
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))  # python -I 로 실행해도 build_thumbs 를 찾게
from build_thumbs import FONT_BOLD, FONT_MED, LOGO, ROOT, ORANGE, ORANGE_RULE, WHITE, tracked_width, draw_tracked

OUT_DIR = os.path.join(ROOT, 'assets', 'img', 'og')
W, H = 1200, 630
PAD_X = 84
MAX_W = W - PAD_X * 2
SUB = (196, 207, 226)
VERSION = 'og-v1'  # 그림 모양을 바꾸면 올린다(전부 다시 그림)


def load_cards():
    js = "import('./src/data.mjs').then(D => process.stdout.write(JSON.stringify(Object.fromEntries(Object.entries(D.SEO).filter(([, v]) => v.card).map(([k, v]) => [k, v.card])))))"
    out = subprocess.run(['node', '--input-type=module', '-e', js], cwd=ROOT, capture_output=True, check=True)
    return json.loads(out.stdout.decode('utf-8'))


@functools.lru_cache(maxsize=1)
def background():
    # 왼쪽 아래 짙은 네이비 → 오른쪽 위 CI 블루(og.jpg 와 같은 방향)
    im = Image.new('RGB', (W, H))
    px = im.load()
    a, b = (8, 13, 26), (14, 46, 122)
    for y in range(H):
        for x in range(0, W, 2):
            t = max(0.0, min(1.0, (x / W) * 0.75 + (1 - y / H) * 0.45 - 0.2)) ** 1.6
            c = tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))
            px[x, y] = c
            if x + 1 < W:
                px[x + 1, y] = c
    # 옅은 격자 — 오른쪽으로 갈수록 보이게
    grid = Image.new('L', (W, H), 0)
    gd = ImageDraw.Draw(grid)
    for x in range(0, W, 60):
        gd.line([(x, 0), (x, H)], fill=255)
    for y in range(0, H, 60):
        gd.line([(0, y), (W, y)], fill=255)
    fade = Image.linear_gradient('L').rotate(90).resize((W, H)).point(lambda v: int((255 - v) * 0.07))
    grid = Image.composite(grid.point(lambda v: 0), fade, grid.point(lambda v: 255 - v))
    im.paste(Image.new('RGB', (W, H), (150, 180, 255)), (0, 0), grid)
    # 오른쪽 위 빛 번짐
    glow = Image.new('L', (W, H), 0)
    ImageDraw.Draw(glow).ellipse((W * 0.55, -H * 0.6, W * 1.3, H * 0.6), fill=90)
    glow = glow.filter(ImageFilter.GaussianBlur(140))
    return Image.composite(Image.new('RGB', (W, H), (20, 80, 230)), im, glow)


def fit_title(d, lines):
    for size in range(88, 50, -2):
        f = ImageFont.truetype(FONT_BOLD, size)
        if all(d.textlength(ln, font=f) <= MAX_W for ln in lines):
            return f, size
    return ImageFont.truetype(FONT_BOLD, 50), 50


def render(card):
    im = background().copy()
    d = ImageDraw.Draw(im, 'RGBA')

    logo = Image.open(LOGO).convert('RGBA')
    lh = 42
    logo = logo.resize((round(logo.width * lh / logo.height), lh), Image.LANCZOS)
    im.paste(logo, (PAD_X, 70), logo)

    lines = card['lines'][:2]
    f_title, size = fit_title(d, lines)
    line_h = round(size * 1.24)
    f_tag = ImageFont.truetype(FONT_MED, 26)
    TRACK = 3.0
    f_sub = ImageFont.truetype(FONT_MED, 28)
    sub = card.get('sub', '')
    while sub and d.textlength(sub, font=f_sub) > MAX_W and f_sub.size > 20:
        f_sub = ImageFont.truetype(FONT_MED, f_sub.size - 1)

    # 실측 높이로 블록 전체를 로고 아래 영역(160~590)의 가운데에 놓는다
    tag_box = d.textbbox((0, 0), card['tag'], font=f_tag)
    tag_h = tag_box[3] - tag_box[1]
    asc, desc = f_title.getmetrics()
    title_h = line_h * (len(lines) - 1) + asc + desc
    sub_box = d.textbbox((0, 0), sub or '가', font=f_sub)
    sub_h = sub_box[3] - sub_box[1]
    gap_tag, gap_sub, gap_rule, rule_h = 24, 30, 34, 6
    total = tag_h + gap_tag + title_h + (gap_sub + sub_h if sub else 0) + gap_rule + rule_h
    top = 160 + (430 - total) // 2

    draw_tracked(d, PAD_X, top - tag_box[1], card['tag'], f_tag, ORANGE, TRACK)
    y = top + tag_h + gap_tag
    for ln in lines:
        d.text((PAD_X, y), ln, font=f_title, fill=WHITE)
        y += line_h
    y = y - line_h + asc + desc
    if sub:
        y += gap_sub
        d.text((PAD_X, y - sub_box[1]), sub, font=f_sub, fill=SUB)
        y += sub_h
    y += gap_rule
    d.rectangle([(PAD_X, y), (PAD_X + 120, y + rule_h)], fill=ORANGE_RULE)
    return im


def main():
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass
    force = '--force' in sys.argv
    only = sys.argv[sys.argv.index('--only') + 1] if '--only' in sys.argv else None
    os.makedirs(OUT_DIR, exist_ok=True)
    cards = load_cards()
    made = skipped = 0
    for key, card in cards.items():
        if only and key != only:
            continue
        name = key.replace(':', '-') + '.jpg'
        out = os.path.join(OUT_DIR, name)
        sig = (VERSION + ' ' + json.dumps(card, ensure_ascii=False, sort_keys=True)).encode('utf-8')
        if not force and os.path.exists(out):
            with Image.open(out) as old:
                if old.info.get('comment') == sig:
                    skipped += 1
                    continue
        render(card).save(out, 'JPEG', quality=86, optimize=True, progressive=True, comment=sig)
        made += 1
        print(f'  {name}  ← {" / ".join(card["lines"])}')
    # data.mjs 에서 카드가 빠진 키의 옛 파일은 지운다(페이지가 엉뚱한 썸네일을 쓰지 않게)
    keep = {k.replace(':', '-') + '.jpg' for k in cards}
    for f in os.listdir(OUT_DIR):
        if f.endswith('.jpg') and f not in keep and not only:
            os.remove(os.path.join(OUT_DIR, f))
            print(f'  삭제: {f}')
    kb = sum(os.path.getsize(os.path.join(OUT_DIR, f)) for f in os.listdir(OUT_DIR)) // 1024
    print(f'og 썸네일 {made}장 생성 · {skipped}장 그대로 · 총 {kb}KB → assets/img/og/')


if __name__ == '__main__':
    main()
