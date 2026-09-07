#!/usr/bin/env python3
"""Resize the web app mark into Android launcher mipmaps."""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
WEB_ICON = ROOT / "public" / "icons" / "icon-512.png"
MASKABLE = ROOT / "public" / "icons" / "icon-512-maskable.png"
RES = ROOT / "android" / "app" / "src" / "main" / "res"
BRAND = (0, 179, 105, 255)

# Legacy launcher bitmap (dp) and adaptive foreground (108dp).
DENSITIES = {
    "mdpi": (48, 108),
    "hdpi": (72, 162),
    "xhdpi": (96, 216),
    "xxhdpi": (144, 324),
    "xxxhdpi": (192, 432),
}


def fill_dark_corners(im: Image.Image) -> Image.Image:
    """Turn the black letterbox around the green squircle into brand green."""
    rgba = im.convert("RGBA")
    px = rgba.load()
    w, h = rgba.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if r < 24 and g < 24 and b < 24:
                px[x, y] = BRAND
    return rgba


def resize(im: Image.Image, size: int) -> Image.Image:
    return im.resize((size, size), Image.Resampling.LANCZOS)


def main() -> None:
    launcher = fill_dark_corners(Image.open(WEB_ICON))
    foreground = Image.open(MASKABLE).convert("RGBA")
    for density, (icon_px, fg_px) in DENSITIES.items():
        folder = RES / f"mipmap-{density}"
        folder.mkdir(parents=True, exist_ok=True)
        icon = resize(launcher, icon_px)
        icon.save(folder / "ic_launcher.png", "PNG")
        icon.save(folder / "ic_launcher_round.png", "PNG")
        resize(foreground, fg_px).save(folder / "ic_launcher_foreground.png", "PNG")
        print(f"{density}: {icon_px} launcher, {fg_px} foreground")


if __name__ == "__main__":
    main()
