"""종류별 음식 일러스트(귀여운 얼굴이 있는 SVG)를 만든다.
caffeine_db.json 의 image_key 와 같은 이름으로 ../../assets/food/{key}.svg 를 쓴다.
스타일: 120x120, 두께 3 외곽선, 파스텔 단색 면, 공통 얼굴(눈 · 입 · 볼).
"""
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', 'assets', 'food')
OL = '#2B2B2B'
P = {  # 파스텔 팔레트
    'cream': '#FFF6E5', 'white': '#FFFFFF', 'latte': '#E8C9A0', 'coffee': '#B07A52', 'dark': '#7A5134',
    'pink': '#F7C6C7', 'red': '#F29A8E', 'mint': '#CFEFD9', 'teal': '#8FD6C0', 'sky': '#CFE3F7',
    'blue': '#A9C8EE', 'yellow': '#FFE08A', 'lemon': '#FFF1A8', 'orange': '#FFC48A', 'clear': '#EAF4FB',
    'gray': '#E9E7E1', 'choco': '#9C6B4E', 'gold': '#F2CF74', 'green': '#B9E3A0', 'purple': '#D9C8F2',
}
S = f'stroke="{OL}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"'


def face(cx, cy, k=1.0):
    e = 7 * k
    return (f'<circle cx="{cx-e}" cy="{cy}" r="{2.6*k}" fill="{OL}"/><circle cx="{cx+e}" cy="{cy}" r="{2.6*k}" fill="{OL}"/>'
            f'<path d="M {cx-4*k} {cy+5*k} Q {cx} {cy+9*k} {cx+4*k} {cy+5*k}" fill="none" stroke="{OL}" stroke-width="{2.4*k}" stroke-linecap="round"/>'
            f'<ellipse cx="{cx-13*k}" cy="{cy+5*k}" rx="{3.6*k}" ry="{2.3*k}" fill="#F59BA3" opacity="0.85"/>'
            f'<ellipse cx="{cx+13*k}" cy="{cy+5*k}" rx="{3.6*k}" ry="{2.3*k}" fill="#F59BA3" opacity="0.85"/>')


def shadow(w=56):
    return f'<ellipse cx="60" cy="106" rx="{w/2}" ry="5" fill="#000" opacity="0.08"/>'


def steam():
    return (f'<path d="M 52 26 q -5 -6 0 -12 q 5 -6 0 -12" fill="none" {S} stroke-width="2.4"/>'
            f'<path d="M 66 26 q -5 -6 0 -12 q 5 -6 0 -12" fill="none" {S} stroke-width="2.4"/>')


def cup(fill, top=46, bottom=100, wt=48, wb=36):
    l1, r1, l2, r2 = 60 - wt / 2, 60 + wt / 2, 60 - wb / 2, 60 + wb / 2
    return f'<path d="M {l1} {top} L {r1} {top} L {r2} {bottom-6} Q {r2-1} {bottom} {r2-7} {bottom} L {l2+7} {bottom} Q {l2+1} {bottom} {l2} {bottom-6} Z" fill="{fill}" {S}/>'


def can(fill, band=None, x=38, w=44, top=30, bottom=100):
    s = f'<rect x="{x}" y="{top}" width="{w}" height="{bottom-top}" rx="9" fill="{fill}" {S}/>'
    s += f'<path d="M {x+3} {top+8} L {x+w-3} {top+8}" {S} stroke-width="2"/><path d="M {x+3} {bottom-8} L {x+w-3} {bottom-8}" {S} stroke-width="2"/>'
    if band:
        s += f'<path d="M {x+1.5} {top+52} Q {x+w/2} {top+44} {x+w-1.5} {top+52} L {x+w-1.5} {top+60} Q {x+w/2} {top+52} {x+1.5} {top+60} Z" fill="{band}"/>'
    return s


ICONS = {
    'cafe_hot': lambda: steam() + cup(P['white'], 44) + f'<rect x="33" y="36" width="54" height="11" rx="5.5" fill="{P["coffee"]}" {S}/><rect x="44" y="30" width="32" height="8" rx="4" fill="{P["coffee"]}" {S}/>'
        + f'<path d="M 41 78 L 79 78 L 77.6 90 L 42.4 90 Z" fill="{P["latte"]}" {S} stroke-width="2.4"/>' + face(60, 62),
    'cafe_iced': lambda: f'<path d="M 64 10 L 70 40" {S}/><path d="M 34 40 Q 60 22 86 40 Z" fill="{P["clear"]}" {S}/>' + cup(P['clear'], 40)
        + f'<path d="M 37.5 60 L 82.5 60 L 79 96 Q 78 99 73 99 L 47 99 Q 42 99 41 96 Z" fill="{P["latte"]}"/>'
        + f'<rect x="46" y="54" width="11" height="11" rx="2" fill="{P["white"]}" {S} stroke-width="2" transform="rotate(-12 51 59)"/><rect x="63" y="52" width="11" height="11" rx="2" fill="{P["white"]}" {S} stroke-width="2" transform="rotate(10 68 57)"/>'
        + cup('none', 40) + face(60, 78),
    'cafe_latte': lambda: steam() + f'<path d="M 82 52 q 16 0 14 14 q -2 12 -16 10" fill="none" {S}/><path d="M 30 40 L 84 40 L 80 92 Q 79 100 71 100 L 43 100 Q 35 100 34 92 Z" fill="{P["cream"]}" {S}/>'
        + f'<ellipse cx="57" cy="40" rx="26" ry="6" fill="{P["latte"]}" {S} stroke-width="2.4"/><path d="M 57 43 q -6 -5 -2 -7 q 2 -1 2 2 q 0 -3 2 -2 q 4 2 -2 7 Z" fill="{P["white"]}"/>' + face(57, 66),
    'cafe_tea': lambda: f'<path d="M 74 26 L 74 46" {S} stroke-width="2"/><rect x="69" y="18" width="11" height="10" rx="2" fill="{P["yellow"]}" {S} stroke-width="2"/>'
        + f'<ellipse cx="60" cy="98" rx="38" ry="7" fill="{P["white"]}" {S}/><path d="M 86 56 q 14 0 12 12 q -2 10 -14 8" fill="none" {S}/>'
        + f'<path d="M 30 46 L 90 46 Q 90 92 60 94 Q 30 92 30 46 Z" fill="{P["pink"]}" {S}/><ellipse cx="60" cy="46" rx="30" ry="6" fill="{P["orange"]}" {S} stroke-width="2.4"/>' + face(60, 66),
    'cafe_blended': lambda: f'<path d="M 66 6 L 72 38" {S}/>' + cup(P['clear'], 44)
        + f'<path d="M 38 44 Q 36 30 48 30 Q 50 18 62 22 Q 74 16 76 30 Q 88 30 84 44 Z" fill="{P["white"]}" {S}/><path d="M 46 34 q 6 4 12 0 q 6 -4 12 0" fill="none" stroke="{P["choco"]}" stroke-width="3" stroke-linecap="round"/>'
        + f'<path d="M 38.6 52 L 81.4 52 L 78 94 Q 77 99 72 99 L 48 99 Q 43 99 42 94 Z" fill="{P["purple"]}"/>' + cup('none', 44) + face(60, 70),
    'cafe_ade': lambda: f'<path d="M 66 8 L 70 36" {S}/><path d="M 38 34 L 82 34 L 78 98 Q 77 102 72 102 L 48 102 Q 43 102 42 98 Z" fill="{P["lemon"]}" {S}/>'
        + f'<circle cx="80" cy="34" r="12" fill="{P["yellow"]}" {S}/><path d="M 80 24 L 80 44 M 70 34 L 90 34 M 73 27 L 87 41 M 87 27 L 73 41" stroke="{OL}" stroke-width="1.6"/>'
        + f'<circle cx="50" cy="88" r="3" fill="none" {S} stroke-width="2"/><circle cx="70" cy="84" r="2.4" fill="none" {S} stroke-width="2"/>' + face(60, 62),
    'cafe_espresso': lambda: steam() + f'<ellipse cx="60" cy="96" rx="34" ry="7" fill="{P["white"]}" {S}/><path d="M 80 62 q 12 0 10 10 q -2 8 -12 6" fill="none" {S}/>'
        + f'<path d="M 38 52 L 82 52 Q 82 90 60 92 Q 38 90 38 52 Z" fill="{P["white"]}" {S}/><ellipse cx="60" cy="52" rx="22" ry="5" fill="{P["dark"]}" {S} stroke-width="2.4"/>' + face(60, 70, 0.85),
    'coffee_can': lambda: can(P['coffee'], P['cream']) + face(60, 58),
    'soda_can': lambda: can(P['red'], P['white']) + face(60, 58),
    'energy_can': lambda: can(P['teal'], None, 40, 40, 22, 102) + f'<path d="M 63 66 L 54 80 L 61 80 L 56 94 L 68 76 L 61 76 L 66 66 Z" fill="{P["yellow"]}" {S} stroke-width="2.2"/>' + face(60, 48),
    'coffee_cup_rtd': lambda: f'<rect x="32" y="26" width="56" height="12" rx="4" fill="{P["white"]}" {S}/>' + cup(P['latte'], 38, 102, 50, 38)
        + f'<path d="M 38 56 L 82 56" {S} stroke-width="2"/>' + face(60, 74),
    'coffee_bottle': lambda: f'<rect x="50" y="14" width="20" height="12" rx="3" fill="{P["white"]}" {S}/><path d="M 52 26 L 68 26 L 70 36 Q 84 42 84 56 L 84 94 Q 84 102 76 102 L 44 102 Q 36 102 36 94 L 36 56 Q 36 42 50 36 Z" fill="{P["dark"]}" {S}/>'
        + f'<rect x="36" y="58" width="48" height="28" fill="{P["cream"]}" {S} stroke-width="2.4"/>' + face(60, 70, 0.85),
    'coffee_capsule': lambda: f'<path d="M 30 52 L 90 52 L 80 92 Q 78 98 72 98 L 48 98 Q 42 98 40 92 Z" fill="{P["gold"]}" {S}/><rect x="24" y="44" width="72" height="10" rx="5" fill="{P["coffee"]}" {S}/>' + face(60, 72),
    'coffee_stick': lambda: f'<g transform="rotate(-28 60 62)"><rect x="46" y="10" width="28" height="100" rx="5" fill="{P["yellow"]}" {S}/><path d="M 46 22 L 74 22 M 46 98 L 74 98" {S} stroke-width="2"/>'
        + f'<path d="M 48 10 l 4 -4 l 4 4 l 4 -4 l 4 4 l 4 -4 l 4 4" fill="none" {S} stroke-width="2"/>' + face(60, 58, 0.9) + '</g>',
    'milk_carton': lambda: f'<path d="M 40 40 L 60 20 L 80 40 Z" fill="{P["white"]}" {S}/><rect x="40" y="40" width="40" height="62" rx="3" fill="{P["white"]}" {S}/><rect x="56" y="12" width="8" height="10" fill="{P["white"]}" {S} stroke-width="2"/>'
        + f'<path d="M 40 84 L 80 84 L 80 99 Q 80 102 77 102 L 43 102 Q 40 102 40 99 Z" fill="{P["blue"]}" {S} stroke-width="2.4"/>' + face(60, 62),
    'milk_coffee': lambda: f'<path d="M 34 96 L 60 20 L 86 96 Z" fill="{P["latte"]}" {S}/><path d="M 44 66 L 76 66" {S} stroke-width="2"/>' + face(60, 78, 0.9),
    'yogurt': lambda: f'<ellipse cx="60" cy="44" rx="28" ry="7" fill="{P["gray"]}" {S}/>' + cup(P['pink'], 46, 100, 54, 40) + face(60, 70),
    'chocolate': lambda: f'<g transform="rotate(-8 60 60)"><rect x="30" y="22" width="60" height="80" rx="6" fill="{P["choco"]}" {S}/>'
        + f'<path d="M 30 48 L 90 48 M 30 74 L 90 74 M 50 22 L 50 48 M 70 22 L 70 48" {S} stroke-width="2"/><path d="M 30 70 L 90 64 L 90 96 Q 90 102 84 102 L 36 102 Q 30 102 30 96 Z" fill="{P["gold"]}" {S}/>'
        + face(60, 84, 0.85) + '</g>',
    'cake': lambda: f'<path d="M 24 60 L 96 44 L 96 96 L 24 96 Z" fill="{P["cream"]}" {S}/><path d="M 24 60 L 96 44 L 96 56 L 24 72 Z" fill="{P["pink"]}" {S} stroke-width="2.4"/>'
        + f'<circle cx="80" cy="38" r="8" fill="{P["red"]}" {S}/><path d="M 80 30 l -3 -5 m 3 5 l 4 -4" {S} stroke-width="2"/>' + face(56, 80),
    'icecream': lambda: f'<path d="M 44 62 L 60 106 L 76 62 Z" fill="{P["gold"]}" {S}/><path d="M 49 72 L 71 72 M 53 84 L 67 84" {S} stroke-width="2"/>'
        + f'<path d="M 36 64 Q 32 36 60 30 Q 88 36 84 64 Q 72 70 60 64 Q 48 70 36 64 Z" fill="{P["mint"]}" {S}/><circle cx="66" cy="22" r="6" fill="{P["red"]}" {S}/>' + face(60, 48),
    'cookie': lambda: f'<circle cx="60" cy="62" r="38" fill="{P["latte"]}" {S}/>' + ''.join(f'<circle cx="{x}" cy="{y}" r="3.6" fill="{P["choco"]}"/>' for x, y in [(42, 46), (78, 44), (38, 76), (82, 78), (60, 92)]) + face(60, 62),
    'donut': lambda: f'<circle cx="60" cy="62" r="38" fill="{P["latte"]}" {S}/><path d="M 24 58 Q 26 24 60 24 Q 94 24 96 58 Q 90 70 80 64 Q 70 74 60 66 Q 48 76 40 64 Q 30 72 24 58 Z" fill="{P["pink"]}" {S}/>'
        + f'<circle cx="60" cy="62" r="10" fill="#FFFFFF" {S}/>' + ''.join(f'<path d="M {x} {y} l 4 2" stroke="{c}" stroke-width="3" stroke-linecap="round"/>' for x, y, c in [(40, 40, '#7FB3E8'), (76, 36, '#FFD166'), (52, 32, '#8FD6C0'), (84, 50, '#F29A8E')]) + face(60, 88, 0.8),
    'bread': lambda: f'<path d="M 22 74 Q 20 40 60 38 Q 100 40 98 74 Q 98 96 60 96 Q 22 96 22 74 Z" fill="{P["gold"]}" {S}/><path d="M 40 50 q 4 -6 8 0 M 56 46 q 4 -6 8 0 M 72 50 q 4 -6 8 0" fill="none" {S} stroke-width="2"/>' + face(60, 74),
    'powder_jar': lambda: f'<rect x="34" y="26" width="52" height="14" rx="5" fill="{P["coffee"]}" {S}/><rect x="32" y="38" width="56" height="64" rx="10" fill="{P["clear"]}" {S}/>'
        + f'<rect x="40" y="56" width="40" height="30" rx="4" fill="{P["cream"]}" {S} stroke-width="2.4"/>' + face(60, 70, 0.85),
    'teabag': lambda: f'<path d="M 60 34 L 60 14 L 82 14" fill="none" {S} stroke-width="2"/><rect x="80" y="8" width="14" height="12" rx="2" fill="{P["yellow"]}" {S} stroke-width="2"/>'
        + f'<path d="M 38 40 L 60 32 L 82 40 L 82 96 Q 82 102 76 102 L 44 102 Q 38 102 38 96 Z" fill="{P["green"]}" {S}/>' + face(60, 68),
    'juice': lambda: f'<path d="M 70 26 L 70 8 L 80 4" fill="none" {S}/><rect x="36" y="26" width="48" height="76" rx="5" fill="{P["orange"]}" {S}/><circle cx="60" cy="82" r="10" fill="{P["yellow"]}" {S} stroke-width="2.4"/>' + face(60, 56),
    'water_bottle': lambda: f'<rect x="50" y="10" width="20" height="12" rx="3" fill="{P["blue"]}" {S}/><path d="M 50 22 L 70 22 L 72 32 Q 82 38 82 50 L 82 96 Q 82 104 74 104 L 46 104 Q 38 104 38 96 L 38 50 Q 38 38 48 32 Z" fill="{P["sky"]}" {S}/>'
        + f'<path d="M 38 62 L 82 62 M 38 84 L 82 84" {S} stroke-width="2"/>' + face(60, 72, 0.85),
    'drink_bottle': lambda: f'<rect x="52" y="14" width="16" height="10" rx="2" fill="{P["gold"]}" {S}/><path d="M 53 24 L 67 24 L 67 38 Q 80 44 80 58 L 80 96 Q 80 104 72 104 L 48 104 Q 40 104 40 96 L 40 58 Q 40 44 53 38 Z" fill="{P["orange"]}" {S}/>' + face(60, 74, 0.85),
    'beer': lambda: f'<path d="M 82 52 q 16 0 14 16 q -2 14 -14 12" fill="none" {S}/><rect x="34" y="40" width="48" height="62" rx="6" fill="{P["yellow"]}" {S}/>'
        + f'<path d="M 30 44 Q 28 26 42 28 Q 48 18 60 24 Q 72 18 78 28 Q 90 28 86 44 Z" fill="{P["white"]}" {S}/>' + face(58, 70),
    'cereal': lambda: f'<circle cx="46" cy="48" r="6" fill="{P["gold"]}" {S} stroke-width="2"/><circle cx="62" cy="44" r="6" fill="{P["choco"]}" {S} stroke-width="2"/><circle cx="76" cy="50" r="6" fill="{P["gold"]}" {S} stroke-width="2"/>'
        + f'<path d="M 22 54 L 98 54 Q 96 98 60 100 Q 24 98 22 54 Z" fill="{P["sky"]}" {S}/>' + face(60, 74),
    'drug_tablet': lambda: f'<circle cx="84" cy="80" r="16" fill="{P["sky"]}" {S}/><path d="M 74 90 L 94 70" {S} stroke-width="2"/><circle cx="52" cy="58" r="30" fill="{P["white"]}" {S}/><path d="M 32 58 L 72 58" {S} stroke-width="2"/>' + face(52, 46, 0.8),
    'drug_capsule': lambda: f'<g transform="rotate(-35 60 60)"><path d="M 60 34 L 60 86 L 44 86 Q 30 86 30 72 L 30 48 Q 30 34 44 34 Z" fill="{P["pink"]}" {S}/>'
        + f'<path d="M 60 34 L 76 34 Q 90 34 90 48 L 90 72 Q 90 86 76 86 L 60 86 Z" fill="{P["white"]}" {S}/>' + face(60, 58, 0.8) + '</g>',
    'drug_syrup': lambda: f'<rect x="46" y="14" width="28" height="14" rx="3" fill="{P["white"]}" {S}/><path d="M 48 28 L 72 28 L 74 38 Q 86 44 86 56 L 86 96 Q 86 104 78 104 L 42 104 Q 34 104 34 96 L 34 56 Q 34 44 46 38 Z" fill="{P["red"]}" {S}/>'
        + f'<rect x="40" y="62" width="40" height="28" rx="3" fill="{P["white"]}" {S} stroke-width="2.4"/>' + face(60, 50, 0.8),
    'drug_bottle': lambda: f'<rect x="48" y="14" width="24" height="12" rx="3" fill="{P["gold"]}" {S}/><path d="M 50 26 L 70 26 L 70 38 Q 80 42 80 54 L 80 98 Q 80 104 74 104 L 46 104 Q 40 104 40 98 L 40 54 Q 40 42 50 38 Z" fill="{P["dark"]}" {S}/>'
        + f'<rect x="40" y="58" width="40" height="30" fill="{P["cream"]}" {S} stroke-width="2.4"/>' + face(60, 70, 0.8),
    'drug_powder': lambda: f'<path d="M 30 28 l 6 -6 l 6 6 l 6 -6 l 6 6 l 6 -6 l 6 6 l 6 -6 l 6 6 l 6 -6 l 6 6 L 90 96 Q 90 102 84 102 L 36 102 Q 30 102 30 96 Z" fill="{P["white"]}" {S}/>'
        + f'<rect x="40" y="76" width="40" height="14" rx="3" fill="{P["blue"]}" {S} stroke-width="2.2"/>' + face(60, 56),
    'default': lambda: f'<path d="M 22 82 Q 22 38 60 36 Q 98 38 98 82 Z" fill="{P["gray"]}" {S}/><circle cx="60" cy="30" r="6" fill="{P["gray"]}" {S}/><rect x="16" y="82" width="88" height="10" rx="5" fill="{P["white"]}" {S}/>' + face(60, 62),
}


def svg(key):
    body = ICONS[key]()
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">{shadow()}{body}</svg>\n'


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    for k in ICONS:
        open(os.path.join(OUT, f'{k}.svg'), 'w', encoding='utf-8').write(svg(k))
    print(len(ICONS), 'icons ->', os.path.abspath(OUT))
