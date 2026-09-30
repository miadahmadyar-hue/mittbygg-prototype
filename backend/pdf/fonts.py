"""Resolve Unicode fonts on Linux hosts and local Windows development."""
import os
from pathlib import Path

def font_path(bold: bool = False) -> str:
    directory = Path(os.getenv("PDF_FONT_DIR", "/usr/share/fonts/truetype/dejavu"))
    preferred = directory / ("DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf")
    if preferred.is_file():
        return str(preferred)
    windows = Path(os.getenv("WINDIR", "C:/Windows")) / "Fonts" / ("arialbd.ttf" if bold else "arial.ttf")
    if windows.is_file():
        return str(windows)
    raise RuntimeError("PDF Unicode fonts unavailable; configure PDF_FONT_DIR")
