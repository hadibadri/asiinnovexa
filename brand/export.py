"""Renders brand SVGs to 4K PNG (transparent) + JPG via headless Chrome. Run after build_logo.py."""
import os, re, subprocess
from PIL import Image

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
HERE = os.path.dirname(os.path.abspath(__file__))
EXPORT = os.path.join(HERE, "export")
os.makedirs(EXPORT, exist_ok=True)
JOBS = [  # (svg, target width, jpg background)
    ("asi-innovexa-mark", 4096, "#ECEEE9"),
    ("asi-innovexa-mark-reverse", 4096, "#0E1120"),
    ("asi-innovexa-wordmark", 4096, "#ECEEE9"),
    ("asi-innovexa-wordmark-reverse", 4096, "#0E1120"),
    ("asi-innovexa-lockup", 4096, "#ECEEE9"),
]
for name, W, bg in JOBS:
    src = os.path.join(HERE, name + ".svg")
    vb = re.search(r'viewBox="0 0 ([\d.]+) ([\d.]+)"', open(src, encoding="utf-8").read())
    H = round(W * float(vb.group(2)) / float(vb.group(1)))
    page = os.path.join(EXPORT, "_tmp.html")
    with open(page, "w", encoding="utf-8") as fh:
        fh.write(f'<html><body style="margin:0;background:transparent"><img src="../{name}.svg" '
                 f'style="display:block;width:{W}px;height:{H}px"></body></html>')
    png = os.path.join(EXPORT, name + ".png")
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
                    "--default-background-color=00000000", f"--window-size={W},{H}", f"--screenshot={png}",
                    "file:///" + page.replace("\\", "/")], check=True, capture_output=True)
    im = Image.open(png).convert("RGBA")
    flat = Image.new("RGBA", im.size, bg); flat.alpha_composite(im)
    flat.convert("RGB").save(os.path.join(EXPORT, name + ".jpg"), quality=95, subsampling=0)
    print(name, im.size, im.getextrema()[3])
os.remove(os.path.join(EXPORT, "_tmp.html"))
