from pathlib import Path

from PIL import Image


ROOT = Path("/home/ubuntu/mcp-hub")
SOURCE_ICON = Path("/home/ubuntu/upload/icon-1024x1024.png")
SOURCE_BANNER = Path("/home/ubuntu/upload/ChatGPTImageApr27,2026,04_47_40AM.png")
SOURCE_SPLASH = Path("/home/ubuntu/webdev-static-assets/mcp-hub-splash.png")
ASSETS = ROOT / "assets" / "images"


def resample_fit(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    image.thumbnail(size, Image.Resampling.LANCZOS)
    return image


def save_quantized_png(image: Image.Image, path: Path, edge: int) -> None:
    resized = image.convert("RGB").resize((edge, edge), Image.Resampling.LANCZOS)
    optimized = resized.quantize(colors=256, method=Image.Quantize.FASTOCTREE)
    optimized.save(path, format="PNG", optimize=True, compress_level=9)


def save_jpeg(image: Image.Image, path: Path, size: tuple[int, int], quality: int) -> None:
    output = resample_fit(image.convert("RGB"), size)
    output.save(path, format="JPEG", quality=quality, optimize=True, progressive=True)


def main() -> None:
    icon = Image.open(SOURCE_ICON)
    save_quantized_png(icon, ASSETS / "icon.png", 768)
    save_quantized_png(icon, ASSETS / "android-icon-foreground.png", 768)
    save_quantized_png(icon, ASSETS / "favicon.png", 192)

    splash = Image.open(SOURCE_SPLASH)
    save_jpeg(splash, ASSETS / "splash-icon.jpg", (640, 1140), 82)

    banner = Image.open(SOURCE_BANNER)
    save_jpeg(banner, ASSETS / "mcp-hub-command-bunker-banner.jpg", (1280, 400), 84)


if __name__ == "__main__":
    main()
