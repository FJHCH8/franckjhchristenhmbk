"""
Construit la police « Davissis » (public/fonts/davissis.woff2) à partir des formes
dessinées par Franck. Chaque lettre est un tracé central, épaissi en trait régulier
aux bouts arrondis : un style moderne qui garde les formes du dessin.

On écrit le Davissis en lettres latines ; la police l'affiche dans son écriture :
  aa ii oo ee uu   voyelles longues (lettres)
  a i o e u        voyelles brèves : signes posés au-dessus de la consonne
  sh, ts ou c, mg, x   lettres propres
  consonne doublée     la consonne, puis le signe « ∩ » dessous
  '                    trait haut
  ! . , ; ?            ponctuation du Davissis

Lancer :  python3 outils/police-davissis.py
"""

import math
from pathlib import Path

import pathops
from fontTools.feaLib.builder import addOpenTypeFeaturesFromString
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

UPM = 1000
TRAIT = 74  # épaisseur du trait
LARGEUR = 640  # chasse commune des consonnes : les signes s'y posent au centre
CENTRE = -LARGEUR / 2


# ───────────── Tracés ─────────────

def ligne(*pts):
    return [list(pts)]


def courbe(p0, p1, p2, p3, n=28):
    out = []
    for i in range(n + 1):
        t = i / n
        a = (1 - t) ** 3
        b = 3 * (1 - t) ** 2 * t
        c = 3 * (1 - t) * t ** 2
        d = t ** 3
        out.append((a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]))
    return out


def trace(*morceaux):
    """Enchaîne des morceaux (listes de points) en un seul tracé continu."""
    pts = []
    for m in morceaux:
        if pts and m and math.dist(pts[-1], m[0]) < 1e-6:
            m = m[1:]
        pts.extend(m)
    return [pts]


def cercle_poly(cx, cy, r, n=20):
    return [(cx + r * math.cos(2 * math.pi * i / n), cy + r * math.sin(2 * math.pi * i / n)) for i in range(n)]


def epaissir(traces, w=TRAIT):
    """Union de segments épais et de disques aux jonctions : un trait régulier aux bouts ronds."""
    r = w / 2
    chemin = pathops.Path()
    for pts in traces:
        if len(pts) == 1:
            pts = [pts[0], (pts[0][0] + 0.01, pts[0][1])]
        for i in range(len(pts)):
            poly = cercle_poly(*pts[i], r)
            p = pathops.Path()
            p.moveTo(*poly[0])
            for q in poly[1:]:
                p.lineTo(*q)
            p.close()
            chemin = pathops.op(chemin, p, pathops.PathOp.UNION)
            if i + 1 < len(pts):
                (x0, y0), (x1, y1) = pts[i], pts[i + 1]
                dx, dy = x1 - x0, y1 - y0
                n = math.hypot(dx, dy) or 1
                nx, ny = -dy / n * r, dx / n * r
                p = pathops.Path()
                p.moveTo(x0 + nx, y0 + ny)
                p.lineTo(x1 + nx, y1 + ny)
                p.lineTo(x1 - nx, y1 - ny)
                p.lineTo(x0 - nx, y0 - ny)
                p.close()
                chemin = pathops.op(chemin, p, pathops.PathOp.UNION)
    chemin.simplify()
    return chemin


C = courbe

# ───────────── Les lettres ─────────────
# Corps de la lettre : x de 90 à 550, y de 0 (ligne) à 620 ; jambages jusqu'à -260.

consonnes = {
    "g": trace(C((230, 560), (250, 670), (420, 670), (420, 520)), ligne((420, 520), (420, 130))[0],
               C((420, 130), (420, -20), (140, -30), (140, 140)), C((140, 140), (140, 300), (390, 300), (420, 210))),
    "k": trace(C((110, 0), (140, 520), (330, 700), (430, 440)), ligne((430, 440), (545, 180))[0]),
    "p": trace(C((470, 440), (470, 640), (130, 640), (130, 440)), C((130, 440), (130, 250), (470, 250), (470, 440)),
               C((470, 440), (470, 100), (380, -190), (170, -230))),
    "n": trace(ligne((120, 300), (480, 300))[0], C((480, 300), (480, 570), (130, 570), (130, 300)),
               C((130, 300), (130, 30), (400, -10), (565, 120))),
    "t": ligne((110, 620), (110, 150)) + trace(C((110, 150), (110, -10), (320, -10), (320, 150))) + ligne((320, 150), (320, 520))
    + trace(C((320, 150), (320, -10), (530, -10), (530, 150))) + ligne((530, 620), (530, -250)),
    "m": ligne((110, 620), (110, 150)) + trace(C((110, 150), (110, -10), (320, -10), (320, 150))) + ligne((320, 150), (320, 520))
    + trace(C((320, 150), (320, -10), (530, -10), (530, 150))) + ligne((530, 150), (530, 620)),
    "y": trace(ligne((140, 620), (140, 230))[0], C((140, 230), (140, -20), (500, -20), (500, 230)), ligne((500, 230), (500, 620))[0]),
    "v": ligne((110, 0), (110, 430)) + trace(C((110, 430), (110, 660), (320, 660), (320, 430))) + ligne((320, 430), (320, 0))
    + trace(C((320, 430), (320, 660), (530, 660), (530, 430))) + ligne((530, 430), (530, 0)),
    "f": trace(C((140, 520), (160, 690), (400, 690), (400, 500)), ligne((400, 500), (400, 90))[0], C((400, 90), (400, 0), (470, -10), (545, 25))),
    "s": trace(C((500, 600), (190, 690), (150, 360), (380, 330)), C((380, 330), (110, 320), (150, -70), (510, 40))),
    "d": trace(ligne((160, 620), (160, 230))[0], C((160, 230), (160, -20), (480, -20), (480, 230)), ligne((480, 230), (480, 620))[0])
    + ligne((320, 660), (320, 90)),
    "r": trace(C((150, 600), (400, 710), (565, 480), (320, 385)), C((320, 385), (560, 300), (480, -40), (470, -90)), ligne((470, -90), (470, -250))[0]),
    "sh": trace(ligne((140, 620), (140, 250))[0], C((140, 250), (140, 40), (480, 40), (480, 250))) + trace(
        ligne((480, 620), (480, -110))[0], C((480, -110), (480, -270), (250, -270), (200, -180))),
    "c": trace(C((480, 600), (390, 710), (150, 570), (150, 270)), C((150, 270), (150, -30), (380, -50), (530, 40))),
    "mg": trace(ligne((150, -120), (150, 420))[0], C((150, 420), (150, 720), (490, 720), (490, 420)), ligne((490, 420), (490, -120))[0]),
    "l": [[(130, 0), (130, 600), (510, 600), (510, 170)]],
    "z": [[(110, 0), (300, 620), (565, -250)]],
    "q": [[(170, 640), (530, 0)], [(340, 330), (120, 0)]],
    "w": [[(120, 600), (510, 600), (210, -230)]],
    "x": ligne((110, 0), (110, 430)) + trace(C((110, 430), (110, 660), (320, 660), (320, 430))) + ligne((320, 430), (320, 0))
    + trace(C((320, 430), (320, 660), (530, 660), (530, 430)), ligne((530, 430), (530, -90))[0], C((530, -90), (530, -270), (320, -270), (290, -170))),
    "b": trace(C((150, 600), (400, 710), (565, 480), (320, 385)), C((320, 385), (560, 300), (500, 40), (330, -20)), ligne((330, -20), (110, -230))[0]),
    "h": trace(C((140, 600), (570, 650), (570, -30), (140, 20))),
}

voyelles_longues = {
    "aa": trace(C((130, 470), (150, 650), (440, 670), (440, 450)), ligne((440, 450), (440, 0))[0]),
    "ii": trace(ligne((420, 620), (420, 150))[0], C((420, 150), (420, -30), (200, -40), (150, 120))),
    "oo": ligne((320, 620), (320, 0)),
    "ee": ligne((180, 660), (180, 0)) + trace(C((180, 300), (250, 430), (500, 410), (500, 190)), C((500, 190), (500, -20), (220, -10), (180, 60))),
    "uu": ligne((110, 310), (530, 310)),
}

# Voyelles brèves : signes au-dessus de la consonne précédente (chasse nulle).
def dessus(pts):
    return [[(CENTRE + x, y) for x, y in t] for t in pts]

signes = {
    "a": dessus([[(-80, 890), (80, 730)]]),
    "i": dessus([[(-80, 730), (80, 890)]]),
    "o": dessus([[(0, 900), (0, 720)]]),
    "e": dessus([[(-65, 900), (-65, 730), (75, 730)]]),
    "u": dessus([[(-95, 810), (95, 810)]]),
}
apostrophe = dessus([[(-110, 965), (110, 965)]])
double = dessus(trace(ligne((-105, -310), (-105, -230))[0], C((-105, -230), (-105, -120), (105, -120), (105, -230)), ligne((105, -230), (105, -310))[0]))

# Forme isolée d'une voyelle brève (en début de mot) : le signe à taille de lettre.
isolees = {
    "a": [[(150, 600), (430, 20)]],
    "i": [[(150, 20), (430, 600)]],
    "o": [[(290, 600), (290, 20)]],
    "e": [[(170, 600), (170, 30), (430, 30)]],
    "u": [[(110, 310), (470, 310)]],
}

ponctuation = {
    "exclam": ([[(180, 620), (180, 0)], [(360, 620), (360, 0)]], 540),
    "period": ([[(200, 380), (200, 0)]], 400),
    "comma": ([[(200, 120)]], 400),
    "semicolon": ([[(200, 120)]], 400),
    "question": ([[(110, 0), (350, 620)]], 460),
}

# ───────────── Assemblage ─────────────

glyphes = {}  # nom -> (chemin, chasse)


def ajouter(nom, traces, chasse):
    glyphes[nom] = (epaissir(traces) if traces else pathops.Path(), chasse)


ajouter(".notdef", [[(100, 0), (100, 600), (440, 600), (440, 0), (100, 0)]], 540)
ajouter("space", [], 320)
for nom, t in consonnes.items():
    ajouter(f"c_{nom}", t, LARGEUR)
for nom, t in voyelles_longues.items():
    ajouter(f"v_{nom}", t, 560 if nom != "oo" else 420)
for nom, t in signes.items():
    ajouter(f"m_{nom}", t, 0)
for nom, t in isolees.items():
    ajouter(f"i_{nom}", t, 560 if nom != "o" else 420)
ajouter("m_apos", apostrophe, 0)
ajouter("m_double", double, 0)
for nom, (t, chasse) in ponctuation.items():
    ajouter(nom, t, chasse)

ordre = list(glyphes)
cmap = {32: "space", 0xA0: "space", ord("'"): "m_apos", 0x2019: "m_apos",
        ord("!"): "exclam", ord("."): "period", ord(","): "comma", ord(";"): "semicolon", ord("?"): "question"}
simples = {"g": "g", "k": "k", "p": "p", "n": "n", "t": "t", "m": "m", "y": "y", "v": "v", "f": "f", "s": "s",
           "d": "d", "r": "r", "c": "c", "l": "l", "z": "z", "q": "q", "w": "w", "x": "x", "b": "b", "h": "h"}
for lettre, nom in simples.items():
    cmap[ord(lettre)] = f"c_{nom}"
    cmap[ord(lettre.upper())] = f"c_{nom}"
for v in "aioeu":
    cmap[ord(v)] = f"m_{v}"
    cmap[ord(v.upper())] = f"m_{v}"
for v, accents in {"a": "àâä", "i": "îï", "o": "ôö", "e": "éèêë", "u": "ùûü"}.items():
    for a in accents:
        cmap[ord(a)] = f"m_{v}"
        cmap[ord(a.upper())] = f"m_{v}"

consonnes_glyphes = " ".join(f"c_{n}" for n in consonnes)
bases = consonnes_glyphes + " " + " ".join(f"v_{n}" for n in voyelles_longues)
features = f"""
languagesystem DFLT dflt;
languagesystem latn dflt;

@Base = [{bases}];

lookup Longues {{
  sub m_a m_a by v_aa;
  sub m_i m_i by v_ii;
  sub m_o m_o by v_oo;
  sub m_e m_e by v_ee;
  sub m_u m_u by v_uu;
  sub c_s c_h by c_sh;
  sub c_t c_s by c_c;
  sub c_m c_g by c_mg;
  sub c_k c_s by c_x;
}} Longues;

lookup Doubles {{
{chr(10).join(f"  sub c_{n} c_{n}' by m_double;" for n in consonnes)}
}} Doubles;

lookup Initiales {{
{chr(10).join(f"  ignore sub [@Base m_double m_apos] m_{v}'; sub m_{v}' by i_{v};" for v in "aioeu")}
}} Initiales;

feature liga {{ lookup Longues; }} liga;
feature calt {{ lookup Doubles; lookup Initiales; }} calt;
"""

fb = FontBuilder(UPM, isTTF=True)
fb.setupGlyphOrder(ordre)
fb.setupCharacterMap(cmap)
contours = {}
for nom, (chemin, _) in glyphes.items():
    pen = TTGlyphPen(None)
    chemin.draw(pen)
    contours[nom] = pen.glyph()
fb.setupGlyf(contours)
metriques = {}
for nom, (chemin, chasse) in glyphes.items():
    g = contours[nom]
    g.recalcBounds(fb.font["glyf"]) if hasattr(g, "recalcBounds") else None
    metriques[nom] = (chasse, getattr(g, "xMin", 0) or 0)
fb.setupHorizontalMetrics(metriques)
fb.setupHorizontalHeader(ascent=1000, descent=-330)
fb.setupNameTable({"familyName": "Davissis", "styleName": "Regular", "copyright": "Franck J.H. Christen"})
fb.setupOS2(sTypoAscender=1000, sTypoDescender=-330, usWinAscent=1000, usWinDescent=330)
fb.setupPost()
addOpenTypeFeaturesFromString(fb.font, features)

racine = Path(__file__).resolve().parent.parent
sortie = racine / "public" / "fonts"
sortie.mkdir(parents=True, exist_ok=True)
fb.font.flavor = "woff2"
fb.save(str(sortie / "davissis.woff2"))
fb.font.flavor = None
fb.save(str(sortie / "davissis.ttf"))
print("ok :", sortie / "davissis.woff2")
