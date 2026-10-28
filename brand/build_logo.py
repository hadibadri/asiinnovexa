"""Generates the ASI Innovexa identity as pure geometric SVG.

Mark — "Nova": a disc (the mission, the globe) cut into four quadrants by a cross set on the
golden section. Each quadrant's inner corner is a continuous-curvature (squircle) corner, so the
channels flow into a slender four-point star of negative space: the guiding star born between
technology, talent, contracting and consulting. The smallest quadrant (north-east, growth) is signal blue.

Wordmark — light, wide-set geometric capitals drawn as hairline strokes. The A's lose their
crossbar; the Nova star hangs where the bar would be.
Run: python build_logo.py  (writes SVGs next to this file)
"""
import math
import os

PHI = (1 + 5 ** 0.5) / 2
INK, SIGNAL = "#0E1120", "#1F2EDB"
OUT = os.path.dirname(os.path.abspath(__file__))

SMOOTH_P = 1.45   # a smoothed corner starts 1.45x further from the vertex than a circular one,
SMOOTH_H = 0.72   # with long handles, so curvature eases in instead of jumping (as on Apple hardware).


def f(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")


def quad(x0, y0, x1, y1, corner, r):
    """Rectangle with one continuous-curvature corner: corner in {'tl','tr','br','bl'}."""
    p, h = r * SMOOTH_P, r * SMOOTH_P * SMOOTH_H
    pts = {"tl": (x0, y0), "tr": (x1, y0), "br": (x1, y1), "bl": (x0, y1)}
    order = ["tl", "tr", "br", "bl"]
    d = []
    for i, k in enumerate(order):
        cx, cy = pts[k]
        prev, nxt = pts[order[i - 1]], pts[order[(i + 1) % 4]]
        if k != corner:
            d.append(("M" if i == 0 else "L") + f"{f(cx)} {f(cy)}")
            continue
        ux, uy = (prev[0] - cx, prev[1] - cy)          # towards previous vertex
        vx, vy = (nxt[0] - cx, nxt[1] - cy)            # towards next vertex
        lu, lv = math.hypot(ux, uy), math.hypot(vx, vy)
        ux, uy, vx, vy = ux / lu, uy / lu, vx / lv, vy / lv
        a = (cx + ux * p, cy + uy * p)
        b = (cx + vx * p, cy + vy * p)
        c1 = (a[0] - ux * h, a[1] - uy * h)
        c2 = (b[0] - vx * h, b[1] - vy * h)
        d.append(("M" if i == 0 else "L") + f"{f(a[0])} {f(a[1])}")
        d.append(f"C{f(c1[0])} {f(c1[1])} {f(c2[0])} {f(c2[1])} {f(b[0])} {f(b[1])}")
    return " ".join(d) + " Z"


def star(cx, cy, r, k=0.16):
    """Slender four-point star: each side a cubic pulled towards the centre."""
    q = r * k
    return (f"M{f(cx)} {f(cy - r)} C{f(cx + q)} {f(cy - q)} {f(cx + q)} {f(cy - q)} {f(cx + r)} {f(cy)} "
            f"C{f(cx + q)} {f(cy + q)} {f(cx + q)} {f(cy + q)} {f(cx)} {f(cy + r)} "
            f"C{f(cx - q)} {f(cy + q)} {f(cx - q)} {f(cy + q)} {f(cx - r)} {f(cy)} "
            f"C{f(cx - q)} {f(cy - q)} {f(cx - q)} {f(cy - q)} {f(cx)} {f(cy - r)} Z")


# ---------- mark (viewBox 0 0 1000 1000, disc r=420) ----------
def mark_group(ink=INK, accent=SIGNAL, uid="m"):
    c, R = 500, 420
    x0, y0, x1, y1 = c - R, c - R, c + R, c + R
    px = x0 + 2 * R / PHI           # cross sits on the golden section: 61.8% across,
    py = y0 + 2 * R / PHI ** 2      # 38.2% down, so the star rises to the upper right
    g = 2 * R / PHI ** 8.5          # hairline channels
    a = 2 * R / PHI ** 3.1          # corner size; smoothing stretches it into a slender star
    q = [
        ("q q--nw", quad(x0, y0, px - g / 2, py - g / 2, "br", a), ink),
        ("q q--ne", quad(px + g / 2, y0, x1, py - g / 2, "bl", a), accent),
        ("q q--sw", quad(x0, py + g / 2, px - g / 2, y1, "tr", a), ink),
        ("q q--se", quad(px + g / 2, py + g / 2, x1, y1, "tl", a), ink),
    ]
    body = "".join(f'<path class="{cls}" d="{d}" fill="{col}"/>' for cls, d, col in q)
    return (f'<defs><clipPath id="disc-{uid}"><circle cx="{c}" cy="{c}" r="{R}"/></clipPath></defs>'
            f'<g clip-path="url(#disc-{uid})">{body}</g>'), (px, py)


# ---------- wordmark: hairline geometric capitals ----------
CAP, SW = 200, 13.5        # cap height, stroke (6.75% of cap: a light weight)
H = SW / 2
TRACK, SPACE = 60, 196


def ext(p0, p1, e=SW * 2):
    """Extend a segment past both ends so the cap-band clip trims it flat."""
    dx, dy = p1[0] - p0[0], p1[1] - p0[1]
    L = math.hypot(dx, dy)
    ux, uy = dx / L, dy / L
    return (p0[0] - ux * e, p0[1] - uy * e), (p1[0] + ux * e, p1[1] + uy * e)


def poly(points):
    """Polyline with extended free ends."""
    pts = list(points)
    pts[0] = ext(pts[0], pts[1])[0]
    pts[-1] = ext(pts[-2], pts[-1])[1]
    return "M" + " L".join(f"{f(x)} {f(y)}" for x, y in pts)


def glyph(ch, x):
    """Returns (clipped strokes, free strokes, accents, advance)."""
    if ch == "A":
        W = 192
        d = poly([(x, CAP), (x + W / 2, 0), (x + W, CAP)])
        acc = star(x + W / 2, CAP * .64, CAP * .13)
        return [d], [], [acc], W
    if ch == "V":
        W = 192
        return [poly([(x, 0), (x + W / 2, CAP), (x + W, 0)])], [], [], W
    if ch == "I":
        return [f"M{f(x + H)} {-SW} V{CAP + SW}"], [], [], SW
    if ch == "N":
        W = 172
        return [poly([(x + H, CAP), (x + H, 0), (x + W - H, CAP), (x + W - H, 0)])], [], [], W
    if ch == "E":
        W = 124
        return [f"M{f(x + H)} {-SW} V{CAP + SW} M{f(x)} {f(H)} H{f(x + W)} "
                f"M{f(x)} {CAP / 2} H{f(x + W * .9)} M{f(x)} {f(CAP - H)} H{f(x + W)}"], [], [], W
    if ch == "X":
        W = 178
        a1, b1 = ext((x, 0), (x + W, CAP))
        a2, b2 = ext((x + W, 0), (x, CAP))
        return [f"M{f(a1[0])} {f(a1[1])} L{f(b1[0])} {f(b1[1])} M{f(a2[0])} {f(a2[1])} L{f(b2[0])} {f(b2[1])}"], [], [], W
    if ch == "O":
        o = 3                                  # optical overshoot past the cap band
        r = (CAP - SW) / 2 + o
        return [], [f'<circle cx="{f(x + r + H)}" cy="{CAP / 2}" r="{f(r)}"/>'], [], 2 * r + SW
    if ch == "S":
        o = 3
        top, bot = H - o, CAP - H + o
        r1 = (bot - top) * .47 / 2             # upper bowl a touch smaller: optical balance
        r2 = (bot - top) / 2 - r1
        k = 1.24                               # bowls drawn as ellipses so S holds its width beside O
        cx = x + r2 * k + H
        c1, c2 = (cx, top + r1), (cx, bot - r2)
        t0, t1 = math.radians(-36), math.radians(144)
        s_ = (c1[0] + r1 * k * math.cos(t0), c1[1] + r1 * math.sin(t0))
        m = (cx, top + 2 * r1)
        e = (c2[0] + r2 * k * math.cos(t1), c2[1] + r2 * math.sin(t1))
        d = (f"M{f(s_[0])} {f(s_[1])} A{f(r1 * k)} {f(r1)} 0 1 0 {f(m[0])} {f(m[1])} "
             f"A{f(r2 * k)} {f(r2)} 0 1 1 {f(e[0])} {f(e[1])}")
        return [], [f'<path d="{d}"/>'], [], 2 * r2 * k + SW
    raise ValueError(ch)


def wordmark_group(ink=INK, accent=SIGNAL, uid="w"):
    clipped, free, accents, x = [], [], [], 0.0
    for wi, word in enumerate(["ASI", "INNOVEXA"]):
        if wi:
            x += SPACE
        for i, ch in enumerate(word):
            c_, f_, a_, adv = glyph(ch, x)
            clipped += c_; free += f_; accents += a_
            x += adv + (TRACK if i < len(word) - 1 else 0)
    style = f'fill="none" stroke="{ink}" stroke-width="{SW}" stroke-linecap="butt" stroke-linejoin="miter" stroke-miterlimit="40"'
    body = (f'<defs><clipPath id="cap-{uid}"><rect x="-40" y="0" width="{f(x + 80)}" height="{CAP}"/></clipPath></defs>'
            f'<g {style}><g clip-path="url(#cap-{uid})">' + "".join(f'<path d="{d}"/>' for d in clipped) + "</g>"
            + "".join(free) + "</g>"
            + "".join(f'<path class="dot" d="{d}" fill="{accent}"/>' for d in accents))
    return body, x


def svg(w, h, inner, vb=None):
    vb = vb or f"0 0 {f(w)} {f(h)}"
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" width="{f(w)}" height="{f(h)}">{inner}</svg>\n'


def write(name, content):
    with open(os.path.join(OUT, name), "w", encoding="utf-8") as fh:
        fh.write(content)


if __name__ == "__main__":
    write("asi-innovexa-mark.svg", svg(1000, 1000, mark_group()[0]))
    write("asi-innovexa-mark-reverse.svg", svg(1000, 1000, mark_group("#F4F5F1", "#6E7BFF")[0]))

    pad = 60
    for suffix, ink, acc in (("", INK, SIGNAL), ("-reverse", "#F4F5F1", "#6E7BFF")):
        wm, wm_w = wordmark_group(ink, acc, uid="w" + suffix)
        write(f"asi-innovexa-wordmark{suffix}.svg",
              svg(wm_w + 2 * pad, CAP + 2 * pad, f'<g transform="translate({pad} {pad})">{wm}</g>'))

    # Lockup: disc diameter = cap height x phi^2; wordmark centred on the disc, gap = cap height.
    wm, wm_w = wordmark_group(uid="lk")
    D = CAP * PHI ** 2
    s = D / 840
    gap = CAP * 1.0
    inner = (f'<g transform="translate({f(pad - 80 * s)} {f(pad - 80 * s)}) scale({s:.5f})">{mark_group(uid="l")[0]}</g>'
             f'<g transform="translate({f(pad + D + gap)} {f(pad + (D - CAP) / 2)})">{wm}</g>')
    write("asi-innovexa-lockup.svg", svg(pad * 2 + D + gap + wm_w, D + 2 * pad, inner))
    print("ok", round(wm_w))
