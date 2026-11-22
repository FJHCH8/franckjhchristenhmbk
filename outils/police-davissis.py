"""
Construit la police « Davissis » (public/fonts/davissis.woff2) à partir des formes
dessinées par Franck. Chaque lettre est un tracé en lignes droites, épaissi en trait régulier :
un alphabet géométrique qui garde la structure du dessin.

On écrit le Davissis en lettres latines ; la police l'affiche dans son écriture :
  aa ii oo ee uu   voyelles longues (lettres)
  a i o e u        voyelles brèves : signes posés au-dessus de la consonne
  sh, ts ou c, ng, x   lettres propres ; j s'écrit comme y
  consonne doublée     la consonne, puis le signe « ∩ » dessous
  '                    barre sous la lettre
  ! . , ; ?            ponctuation du Davissis

Lancer :  python3 outils/police-davissis.py
"""

import json
import math
from pathlib import Path

import pathops
from fontTools.feaLib.builder import addOpenTypeFeaturesFromString
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

UPM = 1000
TRAIT = 58  # épaisseur du trait : fin et régulier
APPROCHE = 46  # espace de chaque côté d'une lettre (chasse proportionnelle)
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

# Version géométrique : uniquement des lignes droites, mêmes structures que le dessin de Franck.
L_ = lambda *pts: [list(pts)]


def redresser(trait, angle=7):
    """Rend parfaitement verticaux ou horizontaux les segments qui le sont presque."""
    pts = [list(p) for p in trait]
    lim = math.tan(math.radians(angle))
    for i in range(len(pts) - 1):
        (x0, y0), (x1, y1) = pts[i], pts[i + 1]
        dx, dy = x1 - x0, y1 - y0
        if abs(dx) <= lim * abs(dy):
            pts[i + 1][0] = x0
        elif abs(dy) <= lim * abs(dx):
            pts[i + 1][1] = y0
    return [tuple(p) for p in pts]


def longueur(trait):
    return sum(math.dist(trait[i], trait[i + 1]) for i in range(len(trait) - 1))


# Les lettres viennent directement du tracé de Franck (outils/davissis-traces.json) :
# le squelette de chaque lettre, simplifié en segments droits.
TRACES = json.loads((Path(__file__).resolve().parent / "davissis-traces.json").read_text())


def lettre(nom):
    traits = [redresser(t) for t in TRACES[nom] if len(t) >= 2]
    # Les petites bavures du squelette (moins d'un dixième de la hauteur) sont retirées.
    gardes = [t for t in traits if longueur(t) > 70] or traits
    return gardes


consonnes = {nom: lettre(nom) for nom in ["g", "k", "p", "n", "t", "m", "v", "f", "s", "d", "r", "sh", "c", "mg", "l", "z", "q", "w", "x", "b", "h", "y"]}
voyelles_longues = {nom: lettre(nom) for nom in ["aa", "ii", "oo", "ee", "uu"]}

# Voyelles brèves : signes au-dessus de la consonne précédente (chasse nulle).
def dessus(pts):
    # Les signes sont centrés sur 0 : la règle « mark » les pose au milieu de leur consonne.
    return [[(x, y) for x, y in t] for t in pts]

signes = {
    "a": dessus([[(-80, 890), (80, 730)]]),
    "i": dessus([[(-80, 730), (80, 890)]]),
    "o": dessus([[(0, 900), (0, 720)]]),
    "e": dessus([[(-65, 900), (-65, 730), (75, 730)]]),
    "u": dessus([[(-95, 810), (95, 810)]]),
}
apostrophe = dessus([[(-110, -130), (110, -130)]])  # la barre de l'apostrophe se pose sous la lettre
double = dessus([[(-100, -270), (-100, -140), (100, -140), (100, -270)]])

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
milieux = {}  # nom -> abscisse du milieu de la lettre (pour poser les voyelles)
bas = {}  # nom -> point le plus bas de la lettre


APLATI = 1.0  # proportions du tracé de Franck, telles quelles
ELARGI = 1.0


def ajouter(nom, traces, chasse, proportionnel=False):
    if traces:
        traces = [[(x * ELARGI, y * APLATI) for x, y in t] for t in traces]
    if traces and proportionnel:
        xs = [x for t in traces for x, _ in t]
        decale = APPROCHE + TRAIT / 2 - min(xs)
        traces = [[(x + decale, y) for x, y in t] for t in traces]
        chasse = round(max(xs) - min(xs) + TRAIT + 2 * APPROCHE)
        milieux[nom] = round(chasse / 2)
        # Le bas de la lettre : les signes du dessous se posent juste en dessous.
        bas[nom] = min(0, round(min(y for t in traces for _, y in t) - TRAIT / 2))
    glyphes[nom] = (epaissir(traces) if traces else pathops.Path(), chasse)


ajouter(".notdef", [[(100, 0), (100, 600), (440, 600), (440, 0), (100, 0)]], 540)
ajouter("space", [], 320)
for nom, t in consonnes.items():
    ajouter(f"c_{nom}", t, LARGEUR, True)
for nom, t in voyelles_longues.items():
    ajouter(f"v_{nom}", t, 0, True)
for nom, t in signes.items():
    ajouter(f"m_{nom}", t, 0)
for nom, t in isolees.items():
    ajouter(f"i_{nom}", t, 0, True)
ajouter("m_apos", apostrophe, 0)
ajouter("m_double", double, 0)
for nom, (t, chasse) in ponctuation.items():
    ajouter(nom, t, chasse, True)

ordre = list(glyphes)
cmap = {32: "space", 0xA0: "space", ord("'"): "m_apos", 0x2019: "m_apos",
        ord("!"): "exclam", ord("."): "period", ord(","): "comma", ord(";"): "semicolon", ord("?"): "question"}
simples = {"g": "g", "k": "k", "p": "p", "n": "n", "t": "t", "m": "m", "y": "y", "v": "v", "f": "f", "s": "s",
           "d": "d", "r": "r", "c": "c", "l": "l", "z": "z", "q": "q", "w": "w", "x": "x", "b": "b", "h": "h"}
for lettre, nom in simples.items():
    cmap[ord(lettre)] = f"c_{nom}"
    cmap[ord(lettre.upper())] = f"c_{nom}"
# J s'écrit comme Y.
cmap[ord("j")] = "c_y"
cmap[ord("J")] = "c_y"
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
  sub c_n c_g by c_mg;
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

table GDEF {{
  GlyphClassDef [{bases} {" ".join(f"i_{v}" for v in "aioeu")}], , [m_a m_i m_o m_e m_u m_apos m_double], ;
}} GDEF;

markClass [m_a m_i m_o m_e m_u] <anchor 0 0> @HAUT;
markClass [m_double m_apos] <anchor 0 0> @BAS;

feature mark {{
{chr(10).join(f"  pos base c_{n} <anchor {milieux[f'c_{n}']} 0> mark @HAUT <anchor {milieux[f'c_{n}']} {bas[f'c_{n}']}> mark @BAS;" for n in consonnes)}
{chr(10).join(f"  pos base v_{n} <anchor {milieux[f'v_{n}']} 0> mark @HAUT;" for n in voyelles_longues)}
}} mark;
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
fb.setupHorizontalHeader(ascent=1100, descent=-1200)
fb.setupNameTable({"familyName": "Davissis", "styleName": "Regular", "copyright": "Franck J.H. Christen"})
fb.setupOS2(sTypoAscender=1100, sTypoDescender=-1200, usWinAscent=1100, usWinDescent=1200)
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
