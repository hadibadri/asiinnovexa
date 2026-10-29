"""Renders the agency seal SVGs to 2048px transparent PNG (high res) and 480px WebP (used on the site)."""
import os, subprocess
from PIL import Image

CHROME = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
HERE = os.path.dirname(os.path.abspath(__file__))
SRC, PNG = os.path.join(HERE, "svg"), os.path.join(HERE, "png")
W = 2048
for f in sorted(os.listdir(SRC)):
    name = f[:-4]
    page = os.path.join(HERE, "_tmp.html")
    with open(page, "w", encoding="utf-8") as fh:
        fh.write(f'<html><body style="margin:0;background:transparent"><img src="svg/{f}" '
                 f'style="display:block;width:{W}px;height:{W}px;object-fit:contain"></body></html>')
    png = os.path.join(PNG, name + ".png")
    subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
                    "--default-background-color=00000000", f"--window-size={W},{W}", f"--screenshot={png}",
                    "file:///" + page.replace("\\", "/")], check=True, capture_output=True)
    im = Image.open(png).convert("RGBA")
    im = im.crop(im.getbbox())                       # trim, then re-square on a transparent canvas
    side = max(im.size); sq = Image.new("RGBA", (side, side)); sq.paste(im, ((side - im.width) // 2, (side - im.height) // 2))
    sq.resize((W, W), Image.LANCZOS).save(png, optimize=True)
    sq.resize((480, 480), Image.LANCZOS).save(os.path.join(HERE, name + ".webp"), quality=90, method=6)
    print(name, im.size)
os.remove(os.path.join(HERE, "_tmp.html"))
