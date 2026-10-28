"""대표 음식 사진 후보를 위키미디어 공용(Wikimedia Commons)에서 찾는다.
상업적 사용 + 출처 표기만으로 쓸 수 있는 라이선스(CC0, 퍼블릭 도메인, CC BY, CC BY-SA)만 받는다.
일반 음식은 브랜드 없는 사진을 같은 종류의 여러 항목(item_ids)에 연결하고,
브랜드 제품(BRANDS)은 사용자가 직접 찍어 CC로 올린 제품 사진을 쓴다.

python collect_photos.py search   # 후보 검색 + 썸네일 + 비교용 모음 이미지(../cache/photos/sheets)
python collect_photos.py pick     # PICKS에 고른 후보 원본을 ../../assets/photos 로 받고 credits 기록
"""
import csv, io, json, os, re, sys, time, urllib.parse, urllib.request
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, '..', 'cache', 'photos')
OUT_DIR = os.path.join(HERE, '..', '..', 'assets', 'photos')
UA = {'User-Agent': 'caffeine-finder-student-project/0.1 (portfolio)'}

# (photo_key, 한국어 이름, 검색어, 연결할 항목 id)
CONCEPTS = [
    ('milk_tea', '밀크티', 'milk tea cup', ['caf-00313', 'caf-00312', 'caf-00316', 'caf-00311']),
    ('cola_glass', '콜라 (잔)', 'cola glass ice', ['caf-00025', 'caf-00299', 'caf-01541', 'caf-00026']),
    ('cola_zero', '제로 콜라 (캔)', 'soda can', ['caf-00319', 'caf-00317', 'caf-00320', 'caf-01542']),
    ('energy_drink', '에너지드링크', 'energy drink can', ['caf-00029', 'caf-00038', 'caf-00302', 'caf-01549', 'caf-00035']),
    ('americano', '아메리카노', 'black coffee cup', ['caf-01528', 'caf-00304']),
    ('iced_americano', '아이스 아메리카노', 'iced coffee glass', ['caf-00304']),
    ('espresso', '에스프레소', 'espresso', ['caf-01529']),
    ('cafe_latte', '카페라떼', 'latte art', ['caf-01531']),
    ('iced_latte', '아이스 라떼', 'iced latte', ['caf-01532']),
    ('cappuccino', '카푸치노', 'cappuccino', ['caf-01574']),
    ('cafe_mocha', '카페모카', 'cafe mocha whipped cream', ['caf-01575']),
    ('coffee_mix', '커피믹스', 'instant coffee sachet', ['caf-00301', 'caf-01578']),
    ('coffee_milk', '커피우유', 'coffee milk', ['caf-00300', 'caf-00001']),
    ('canned_coffee', '캔커피', 'canned coffee', ['caf-00303']),
    ('cold_brew', '콜드브루', 'cold brew coffee', ['caf-00349']),
    ('matcha_latte', '말차 라떼', 'matcha latte', ['caf-00307', 'caf-00306', 'caf-00308', 'caf-00305']),
    ('green_tea', '녹차', 'green tea cup', ['caf-01536', 'caf-00298']),
    ('black_tea', '홍차', 'black tea cup', ['caf-01534']),
    ('oolong_tea', '우롱차', 'oolong tea', ['caf-01537']),
    ('iced_tea', '아이스티', 'iced tea lemon', ['caf-01538']),
    ('kombucha', '콤부차', 'kombucha', ['caf-01581']),
    ('herbal_tea', '허브차·캐모마일', 'chamomile tea', ['caf-01540', 'caf-01539']),
    ('barley_tea', '보리차', 'barley tea', ['caf-01601']),
    ('dark_chocolate', '다크초콜릿', 'dark chocolate', ['caf-01550', 'caf-01551', 'caf-01552']),
    ('milk_chocolate', '밀크초콜릿', 'milk chocolate bar', ['caf-01553', 'caf-00331', 'caf-00345']),
    ('white_chocolate', '화이트초콜릿', 'white chocolate', ['caf-01554']),
    ('hot_chocolate', '핫초코', 'hot chocolate mug', ['caf-01559']),
    ('chocolate_milk', '초코우유', 'chocolate milk glass', ['caf-01560']),
    ('cocoa_powder', '코코아 가루', 'cocoa powder', ['caf-01558']),
    ('tiramisu', '티라미수', 'tiramisu', ['caf-01564']),
    ('chocolate_icecream', '초코 아이스크림', 'chocolate ice cream', ['caf-01562']),
    ('greentea_icecream', '녹차 아이스크림', 'green tea ice cream', []),
    ('matcha_cookie', '말차 쿠키', 'matcha cookies', []),
    ('chocochip_cookie', '초코칩 쿠키', 'chocolate chip cookie', ['caf-01565']),
    ('brownie', '브라우니', 'brownie', ['caf-01567']),
    ('chocolate_cake', '초코 케이크', 'chocolate cake slice', ['caf-01568']),
    ('chocolate_donut', '초코 도넛', 'chocolate donut', ['caf-01569']),
    ('pills', '두통약(알약)', 'pills tablets', []),   # 의약품 항목은 앱에서 drug_tablet 그룹에 연결
    ('milk', '우유', 'glass of milk', ['caf-01582']),
    ('orange_juice', '오렌지 주스', 'orange juice glass', ['caf-01591']),
    ('water', '생수', 'glass of water', ['caf-01595']),
    ('cider', '사이다', 'lemon lime soda glass', ['caf-01545']),
]

# 브랜드 제품: 제조사 공식 사진(저작권이 제조사에 있음)은 쓰지 않고,
# 사용자가 직접 찍어 CC 라이선스로 올린 제품 사진만 쓴다. 상표는 '이 제품이 무엇인지' 알려주는 용도로만 보여준다.
BRANDS = [
    ('brand_coca_cola', '코카콜라', 'Coca-Cola can', ['caf-00025']),
    ('brand_coke_zero', '코카콜라 제로', 'Coca-Cola Zero can', ['caf-00319']),
    ('brand_pepsi', '펩시', 'Pepsi can', ['caf-00026']),
    ('brand_pepsi_zero', '펩시 제로슈가', 'Pepsi Zero Sugar', ['caf-00320']),
    ('brand_mountain_dew', '마운틴듀', 'Mountain Dew can', ['caf-00027']),
    ('brand_dr_pepper', '닥터페퍼', 'Dr Pepper can', ['caf-00028', 'caf-00318']),
    ('brand_monster', '몬스터 에너지', 'Monster Energy drink can', ['caf-00029', 'caf-00030', 'caf-00031', 'caf-00032',
                                                               'caf-00033', 'caf-00034', 'caf-00379', 'caf-00380']),
    ('brand_red_bull', '레드불', 'Red Bull can', ['caf-00038', 'caf-00375', 'caf-00376', 'caf-00377']),
    ('brand_hot_six', '핫식스', 'Hot6 energy drink', ['caf-00035', 'caf-00036', 'caf-00037', 'caf-00388', 'caf-00389', 'caf-00390']),
    ('brand_starbucks', '스타벅스 음료', 'Starbucks cup drink', ['caf-00313']),
    ('brand_seoul_milk_coffee', '서울우유 커피', 'Seoul Milk coffee', ['caf-00001', 'caf-00002', 'caf-00003']),
    ('brand_accafela', '아카페라', 'Accafela', ['caf-00019', 'caf-00020', 'caf-00021', 'caf-00022', 'caf-00023', 'caf-00351']),
    ('brand_maxim_top', '맥심 TOP', 'Maxim TOP coffee', ['caf-00348', 'caf-00354']),
    ('brand_cantata', '칸타타', 'Cantata coffee', ['caf-00353', 'caf-00356']),
    ('brand_georgia', '조지아', 'Georgia coffee can', ['caf-00352', 'caf-00355']),
    ('brand_hersheys', '허쉬 밀크초콜릿', "Hershey's milk chocolate bar", ['caf-00343']),
    ('brand_kisses', '허쉬 키세스', "Hershey's Kisses", ['caf-00344']),
    ('brand_ghana', '가나 초콜릿', 'Lotte Ghana chocolate', ['caf-00331']),
    ('brand_lindor', '린트 린도볼', 'Lindt Lindor', ['caf-00336']),
    ('brand_toblerone', '토블론', 'Toblerone', ['caf-00342']),
    ('brand_milka', '밀카', 'Milka chocolate', ['caf-00339']),
    ('brand_bacchus', '박카스F', 'Bacchus drink', ['caf-01508']),   # 사진이 박카스F라 F에만 연결
]
CONCEPTS += BRANDS

# 첫 검색어로 결과가 나쁠 때 바꾼 검색어
QUERY_FIX = {
    'energy_drink': 'energy drink glass ice',
    'iced_americano': 'iced black coffee',
    'coffee_mix': 'instant coffee cup granules',
    'brownie': 'chocolate brownies plate',
    'milk': 'glass of milk dairy',
    'iced_latte': 'iced coffee with milk',
    'brand_pepsi': 'Pepsi can',
    'brand_monster': 'Monster Energy',
    'brand_red_bull': 'Red Bull Energy Drink',
    'brand_hot_six': '핫식스',
    'brand_seoul_milk_coffee': '서울우유',
    'brand_accafela': '아카페라',
    'brand_maxim_top': '맥심',
    'brand_cantata': '칸타타',
    'brand_georgia': '조지아 커피',
    'brand_ghana': '가나 초콜릿',
    'brand_bacchus': '박카스',
}

# search 결과를 보고 고른 후보 번호 (photo_key -> 0부터 시작하는 후보 순번)
# 브랜드 로고가 크게 보이는 후보만 있던 것(제로콜라 캔, 에너지드링크, 캔커피, 커피믹스, 콜드브루, 우유)은
# 사진 없이 일러스트로 두거나 비슷한 사진에 연결한다 (EXTRA_IDS).
PICKS = {
    'milk_tea': 6, 'cola_glass': 0, 'americano': 'w1', 'iced_americano': 3, 'espresso': 0, 'cafe_latte': 3,
    'iced_latte': 5, 'cappuccino': 'w0', 'cafe_mocha': 1, 'coffee_milk': 4, 'matcha_latte': 3, 'green_tea': 4,
    'black_tea': 3, 'oolong_tea': 4, 'iced_tea': 11, 'kombucha': 3, 'herbal_tea': 1, 'barley_tea': 0,
    'dark_chocolate': 1, 'milk_chocolate': 2, 'white_chocolate': 'w7', 'hot_chocolate': 1, 'chocolate_milk': 0,
    'cocoa_powder': 4, 'tiramisu': 'w0', 'chocolate_icecream': 0, 'greentea_icecream': 0, 'matcha_cookie': 2,
    'chocochip_cookie': 0, 'brownie': 6, 'chocolate_cake': 8, 'chocolate_donut': 0, 'pills': 6,
    'orange_juice': 0, 'water': 6, 'cider': 0,
    # 브랜드 제품. 한국 제품(핫식스, 서울우유, 아카페라, 맥심, 칸타타)은 공용에 사진이 없고,
    # 조지아·가나는 일본판 제품 사진뿐이라 국내 제품과 달라서 뺐다. 펩시(일반)는 단독 캔 사진이 없다.
    # 손이 잡고 있거나 다른 물건·사람이 같이 찍힌 사진은 단독 제품 사진으로 바꿨다
    'brand_coca_cola': 2, 'brand_pepsi': 'w2', 'brand_coke_zero': 10, 'brand_pepsi_zero': 3,   # 마운틴듀는 풀이 캔을 가린 사진뿐이라 뺌
    'brand_dr_pepper': 2, 'brand_monster': 0, 'brand_red_bull': 3, 'brand_starbucks': 1,
    'brand_hersheys': 4, 'brand_kisses': 1, 'brand_toblerone': 0, 'brand_milka': 1,   # 린트는 진열대 더미 사진뿐이라 뺌
    'brand_bacchus': 0,
}
EXTRA_IDS = {'cola_glass': ['caf-00319', 'caf-00317', 'caf-00320', 'caf-01542'],   # 제로콜라도 콜라 잔 사진
             'iced_americano': ['caf-00349']}                                     # 콜드브루


def get(url, tries=3):
    for i in range(tries):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40).read()
        except Exception as e:
            if i == tries - 1:
                raise
            time.sleep(3 * (i + 1))


OK_LICENSE = re.compile(r'^(CC0|Public domain|PD|CC BY(-SA)? [\d.]+)', re.I)


def strip_html(s):
    return re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', '', s or '')).strip()


def commons(q, n=12):
    """위키미디어 공용 검색. 라이선스·작가를 사진마다 같이 받는다."""
    url = 'https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode({
        'action': 'query', 'format': 'json', 'generator': 'search', 'gsrnamespace': 6,
        'gsrsearch': f'{q} filetype:bitmap', 'gsrlimit': 30, 'prop': 'imageinfo',
        'iiprop': 'url|size|extmetadata', 'iiurlwidth': 1200})
    pages = sorted(json.loads(get(url)).get('query', {}).get('pages', {}).values(), key=lambda p: p['index'])
    out = []
    for p in pages:
        ii = p['imageinfo'][0]; m = ii.get('extmetadata', {})
        lic = m.get('LicenseShortName', {}).get('value', '')
        if not OK_LICENSE.match(lic) or ii['width'] < 800:
            continue
        out.append({'id': p['pageid'], 'title': p['title'].replace('File:', ''), 'url': ii['thumburl'],
                    'thumbnail': ii['thumburl'].replace('/1200px-', '/330px-'),
                    'creator': strip_html(m.get('Artist', {}).get('value')), 'license': lic,
                    'license_url': m.get('LicenseUrl', {}).get('value', ''),
                    'foreign_landing_url': ii['descriptionurl'], 'source': 'Wikimedia Commons',
                    'attribution_required': m.get('AttributionRequired', {}).get('value', ''),
                    'width': ii['width'], 'height': ii['height']})
        if len(out) >= n:
            break
    return out


def search():
    os.makedirs(os.path.join(CACHE, 'thumbs'), exist_ok=True)
    os.makedirs(os.path.join(CACHE, 'sheets'), exist_ok=True)
    args = sys.argv[2:]
    white = '--white' in args   # 흰 배경 스튜디오 사진만 따로 찾기 → 후보 키에 '_w'가 붙는다
    only = [a for a in args if a != '--white']   # 일부 키만 다시 검색할 때
    path = os.path.join(CACHE, 'candidates.json')
    allres = json.load(open(path, encoding='utf-8')) if os.path.exists(path) else {}
    for key, ko, q, _ in CONCEPTS:
        if only and key not in only:
            continue
        q = QUERY_FIX.get(key, q)
        if white:
            key, q = key + '_w', q + ' white background'
        try:
            cands = commons(q)
        except Exception as e:
            print('fail', key, e, flush=True); continue
        allres[key] = cands
        imgs = []
        for i, c in enumerate(cands):
            p = os.path.join(CACHE, 'thumbs', f'{key}_{i}.jpg')
            if not os.path.exists(p):
                try:
                    data = get(c['thumbnail'] or c['url'])
                    Image.open(io.BytesIO(data)).convert('RGB').save(p)
                except Exception as e:
                    print('  thumb fail', key, i, e); p = None
            imgs.append(p)
        make_sheet(key, ko, cands, imgs)
        print(key, len(cands), flush=True)
        time.sleep(3)
    json.dump(allres, open(os.path.join(CACHE, 'candidates.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


def is_plain_bg(im):
    """네 모서리가 모두 밝고 고른 색이면 흰 배경 스튜디오 사진으로 본다."""
    im = im.convert('L'); w, h = im.size; s = max(4, min(w, h) // 12)
    for box in ((0, 0, s, s), (w - s, 0, w, s), (0, h - s, s, h), (w - s, h - s, w, h)):
        px = list(im.crop(box).getdata())
        mean = sum(px) / len(px)
        if mean < 225 or max(px) - min(px) > 40:
            return False
    return True


def make_sheet(key, ko, cands, imgs):
    W, H = 240, 200
    sheet = Image.new('RGB', (W * 4, (H + 30) * 3), 'white')
    d = ImageDraw.Draw(sheet)
    try:
        font = ImageFont.truetype('malgun.ttf', 14)
    except Exception:
        font = ImageFont.load_default()
    for i, (c, p) in enumerate(zip(cands, imgs)):
        x, y = (i % 4) * W, (i // 4) * (H + 30)
        if p and os.path.exists(p):
            im = Image.open(p); im.thumbnail((W - 6, H - 6)); sheet.paste(im, (x + 3, y + 3))
        mark = ' [흰배경]' if p and os.path.exists(p) and is_plain_bg(Image.open(p)) else ''
        d.text((x + 4, y + H + 4), f"{i} {c['license']} {c.get('width')}x{c.get('height')}{mark}", fill='black', font=font)
    sheet.save(os.path.join(CACHE, 'sheets', f'{key}.jpg'), quality=80)


def pick():
    os.makedirs(OUT_DIR, exist_ok=True)
    cand = json.load(open(os.path.join(CACHE, 'candidates.json'), encoding='utf-8'))
    rows = []
    for key, ko, q, ids in CONCEPTS:
        if key not in PICKS:
            continue
        v = PICKS[key]   # 숫자 = 일반 검색 후보, 'w3' = 흰 배경 검색의 3번 후보
        c = cand[key + '_w'][int(v[1:])] if isinstance(v, str) else cand[key][v]
        ids = ids + EXTRA_IDS.get(key, [])
        out = os.path.join(OUT_DIR, f'{key}.jpg')
        if not os.path.exists(out):   # 이미 받은 사진은 건너뛴다 (위키미디어 요청 제한)
            try:
                im = Image.open(io.BytesIO(get(c['url'], tries=5))).convert('RGB')
            except Exception as e:
                print('fail', key, e, flush=True); continue
            im.thumbnail((1200, 1200))
            im.save(out, quality=85)
            print('saved', key, flush=True)
            time.sleep(3)
        c['creator'] = strip_html(c['creator'])
        credit = f"Photo: {c['creator'] or 'Unknown'} / {c['license']} / Wikimedia Commons"
        rows.append({'photo_key': key, 'name_ko': ko, 'file': f'assets/photos/{key}.jpg', 'item_ids': ';'.join(ids),
                     'title': c['title'], 'creator': c['creator'] or '', 'license': c['license'],
                     'license_url': c['license_url'], 'source_page': c['foreign_landing_url'],
                     'credit': credit})
    with open(os.path.join(OUT_DIR, 'credits.csv'), 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)
    json.dump(rows, open(os.path.join(OUT_DIR, 'credits.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    {'search': search, 'pick': pick}[sys.argv[1]]()
