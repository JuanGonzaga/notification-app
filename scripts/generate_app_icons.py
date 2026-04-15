#!/usr/bin/env python3
"""Gera icon.png, adaptive-icon.png, splash-icon.png e favicon.png para o app de lembretes."""

from __future__ import annotations

import os

from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = os.path.join(ROOT, "assets")


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def draw_gradient_vertical(img: Image.Image, top: tuple, bottom: tuple) -> None:
    px = img.load()
    w, h = img.size
    for y in range(h):
        t = y / max(h - 1, 1)
        r = int(lerp(top[0], bottom[0], t))
        g = int(lerp(top[1], bottom[1], t))
        b = int(lerp(top[2], bottom[2], t))
        for x in range(w):
            px[x, y] = (r, g, b)


def draw_cake(draw: ImageDraw.ImageDraw, cx: int, cy: int, scale: float) -> None:
    s = scale
    # plate
    draw.rounded_rectangle(
        [cx - 140 * s, cy + 95 * s, cx + 140 * s, cy + 115 * s],
        radius=8 * s,
        fill=(248, 250, 252),
        outline=(226, 232, 240),
        width=max(1, int(2 * s)),
    )
    # bottom tier
    draw.rounded_rectangle(
        [cx - 120 * s, cy + 35 * s, cx + 120 * s, cy + 95 * s],
        radius=18 * s,
        fill=(251, 113, 133),
        outline=(225, 29, 72),
        width=max(1, int(3 * s)),
    )
    # middle tier
    draw.rounded_rectangle(
        [cx - 95 * s, cy - 25 * s, cx + 95 * s, cy + 35 * s],
        radius=16 * s,
        fill=(196, 181, 253),
        outline=(124, 58, 237),
        width=max(1, int(3 * s)),
    )
    # top tier
    draw.rounded_rectangle(
        [cx - 65 * s, cy - 75 * s, cx + 65 * s, cy - 25 * s],
        radius=14 * s,
        fill=(253, 224, 71),
        outline=(202, 138, 4),
        width=max(1, int(3 * s)),
    )
    # candle
    draw.rectangle([cx - 6 * s, cy - 115 * s, cx + 6 * s, cy - 75 * s], fill=(255, 255, 255), outline=(148, 163, 184), width=max(1, int(1 * s)))
    # flame
    draw.ellipse([cx - 14 * s, cy - 135 * s, cx + 14 * s, cy - 105 * s], fill=(251, 146, 60))
    draw.ellipse([cx - 8 * s, cy - 128 * s, cx + 8 * s, cy - 110 * s], fill=(253, 224, 71))


def make_icon(size: int, *, compact: bool) -> Image.Image:
    img = Image.new("RGB", (size, size), (255, 182, 193))
    draw_gradient_vertical(img, (255, 120, 150), (167, 139, 250))
    draw = ImageDraw.Draw(img)
    cx = cy = size // 2
    scale = size / 512.0
    if compact:
        # adaptive foreground: keep cake inside ~64% circle visually
        scale *= 0.78
    draw_cake(draw, cx, cy + int(12 * scale), scale)
    # simple sparkles as small diamonds (filled white)
    for dx, dy, w in [
        (-int(180 * scale), -int(110 * scale), int(10 * scale)),
        (int(185 * scale), -int(95 * scale), int(8 * scale)),
        (-int(165 * scale), int(125 * scale), int(9 * scale)),
        (int(175 * scale), int(115 * scale), int(8 * scale)),
        (0, -int(185 * scale), int(9 * scale)),
    ]:
        x, y = cx + dx, cy + dy
        d = w
        draw.polygon([(x, y - d), (x + d, y), (x, y + d), (x - d, y)], fill=(255, 255, 255))
    return img


def make_splash(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    # soft rounded card on transparent (Expo splash often on solid bg)
    draw = ImageDraw.Draw(img)
    margin = int(size * 0.18)
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=int(size * 0.12),
        fill=(255, 241, 246, 255),
        outline=(251, 113, 133, 255),
        width=max(2, size // 128),
    )
    cx = cy = size // 2
    draw_cake(draw, cx, cy + size // 28, (size / 480.0) * 0.95)
    return img


def main() -> None:
    os.makedirs(ASSETS, exist_ok=True)

    icon = make_icon(1024, compact=False)
    icon.save(os.path.join(ASSETS, "icon.png"), "PNG", optimize=True)

    adaptive = make_icon(1024, compact=True)
    adaptive.save(os.path.join(ASSETS, "adaptive-icon.png"), "PNG", optimize=True)

    splash = make_splash(512)
    splash.save(os.path.join(ASSETS, "splash-icon.png"), "PNG", optimize=True)

    fav = make_icon(64, compact=True)
    fav.save(os.path.join(ASSETS, "favicon.png"), "PNG", optimize=True)

    print("Wrote:", "icon.png, adaptive-icon.png, splash-icon.png, favicon.png ->", ASSETS)


if __name__ == "__main__":
    main()
