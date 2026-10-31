"""브랜드 제품 사진 3차 수집 (2026-10-31 사용자 요청). 카테고리 순으로, 지금은 탄산음료부터.
기준(사용자): 사람·손 없음 / 제품 글자는 한국어·영어만 / 고화질 / 한 제품만, 정면(측면·옆면 금지) /
라이선스는 저작권 없음(CC0·퍼블릭 도메인)이 좋고, CC BY·CC BY-SA도 검토해서 사용 가능.
위키미디어 공용의 브랜드 분류(Category)와 검색어로 후보를 모아 비교용 모음 이미지를 만든다. 고르는 건 사람이 눈으로.

python collect_brand_photos.py search [key ...]   # 후보 → ../cache/photos/brand/<key>.jpg (번호·라이선스·크기)
python collect_brand_photos.py off [key ...]      # 오픈푸드팩츠 포장 앞면 사진 → <key>_off.jpg
"""
import io, json, os, sys, time, urllib.parse
from PIL import Image, ImageDraw, ImageFont

from collect_photos import CACHE, OK_LICENSE, get, strip_html

OUT = os.path.join(CACHE, 'brand')
CANDS = os.path.join(OUT, 'candidates.json')
MIN_SIDE = 600       # 짧은 변이 이 값 이상 (처음 1200 → 사진이 너무 적어 2026-10-31 완화)
MAX_CANDS = 32
SKIP_WORDS = ('logo', 'advert', 'poster', 'sign', 'truck', 'vending', 'factory', 'building', 'machine', 'shelf', 'store')

# (key, 한국어 이름, 연결할 항목 id, [분류 'cat:…' 또는 검색어 …])
PRODUCTS = {
    '탄산음료': [
        ('brand_mountain_dew', '마운틴듀', ['caf-00027'],
         ['cat:Mountain Dew', 'cat:Mountain Dew bottles', 'cat:Mountain Dew cans', 'Mountain Dew can']),
        ('brand_sprite', '스프라이트', ['caf-01604'], ['cat:Sprite (drink)', 'cat:Sprite bottles', 'cat:Sprite cans', 'Sprite can']),
        ('brand_sprite_zero', '스프라이트 제로', ['caf-00326'], ['cat:Sprite Zero', 'Sprite Zero can']),
        ('brand_fanta_orange', '환타 오렌지', ['caf-01605'], ['cat:Fanta', 'cat:Fanta containers', 'Fanta Orange can', 'Fanta orange bottle']),
        ('brand_fanta_pineapple', '환타 파인애플', ['caf-00330'], ['Fanta Pineapple']),
        ('brand_fanta_grape', '환타 포도', ['caf-01606'], ['Fanta Grape can', 'Fanta Grape bottle']),
        ('brand_chilsung', '칠성사이다', ['caf-01607', 'caf-00328'], ['cat:Chilsung Cider', '칠성사이다']),
        ('brand_milkis', '밀키스', ['caf-01608', 'caf-00325'], ['cat:Milkis', '밀키스']),
        ('brand_mccol', '맥콜', ['caf-00323'], ['McCol', '맥콜']),
        ('brand_welchs', '웰치스', ['caf-01609', 'caf-00327'], ["cat:Welch's", "Welch's grape soda", "Welch's sparkling"]),
        ('brand_tams', '탐스', ['caf-00329'], ['Tams soda', '탐스 오렌지']),
        ('brand_miero', '미에로화이바', ['caf-00324'], ['미에로화이바', 'Miero Fiber']),
        ('brand_galbae', '갈배 사이다', ['caf-00321'], ['갈배사이다']),
        ('brand_narang', '나랑드사이다', ['caf-00322'], ['나랑드사이다', 'Narangd cider']),
        ('brand_pepsi_zero', '펩시 제로슈가', ['caf-00320'], ['cat:Pepsi Zero Sugar', 'cat:Pepsi Max', 'Pepsi Zero Sugar can']),
        ('brand_coca_cola', '코카콜라', ['caf-00025'], ['cat:Coca-Cola cans', 'Coca-Cola can white background']),
        ('brand_coke_zero', '코카콜라 제로', ['caf-00319'], ['cat:Coca-Cola Zero', 'Coca-Cola Zero can']),
        ('brand_pepsi', '펩시', ['caf-00026'], ['cat:Pepsi cans', 'Pepsi can white background']),
        ('brand_dr_pepper', '닥터페퍼', ['caf-00028', 'caf-00318'], ['cat:Dr Pepper cans', 'cat:Dr Pepper bottles']),
    ],
    '에너지음료': [
        ('brand_monster', '몬스터 에너지', ['caf-00029', 'caf-00379'], ['cat:Monster Energy', 'cat:Monster Energy cans', 'Monster Energy can green']),
        ('brand_monster_ultra', '몬스터 울트라', ['caf-00030', 'caf-00380'], ['Monster Energy Ultra white can', 'Monster Ultra zero']),
        ('brand_monster_citra', '몬스터 울트라 시트라', ['caf-00031'], ['Monster Ultra Citron', 'Monster Ultra Citra']),
        ('brand_monster_strawberry', '몬스터 울트라 스트로베리 드림즈', ['caf-00032'], ['Monster Ultra Strawberry Dreams']),
        ('brand_monster_peachy', '몬스터 울트라 피치 킨', ['caf-00033'], ['Monster Ultra Peachy Keen']),
        ('brand_monster_mango', '몬스터 망고 로코', ['caf-00034'], ['Monster Mango Loco', 'Monster Juice Mango Loco']),
        ('brand_red_bull', '레드불', ['caf-00038', 'caf-00377'], ['cat:Red Bull cans', 'cat:Red Bull Energy Drink', 'Red Bull can']),
        ('brand_red_bull_sugarfree', '레드불 슈가프리', ['caf-00376'], ['Red Bull Sugarfree can', 'Red Bull sugar free']),
        ('brand_red_bull_summer', '레드불 썸머 에디션', ['caf-00375'], ['Red Bull Summer Edition can']),
        ('brand_hot6', '핫식스', ['caf-00035', 'caf-00389'], ['Hot6 energy drink', '핫식스', 'Hot 6 Lotte']),
        ('brand_xs', 'XS 에너지', ['caf-00391', 'caf-00392', 'caf-00393'], ['XS Energy drink can', 'XS Power Drink']),
        ('brand_guarana', '과라나', ['caf-00374'], ['Guarana Antarctica can', 'Guaraná Antarctica']),
        ('brand_megaforce', '메가포스', ['caf-00378'], ['Megaforce energy drink']),
        ('brand_bacchus', '박카스', [], ['Bacchus-D', '박카스']),
        ('brand_energen', '에너젠', ['caf-00382'], ['에너젠', 'Energen drink Dong-A']),
    ],
    # 커피·차·빙과류·과자류·초콜릿·약: 사진이 아직 없는 음식만 (2026-10-31). 연결할 id는 고를 때 정한다
    '커피': [
        ('brand_accafela', '아카페라', [], ['아카페라', 'Accafela']),
        ('brand_maxim_top', '맥심 TOP', [], ['Maxim TOP coffee', '맥심 티오피']),
        ('brand_cantata', '칸타타', [], ['Cantata coffee Lotte', '칸타타 커피']),
        ('brand_georgia', '조지아 고티카', [], ['Georgia Gotica coffee', '조지아 고티카']),
        ('coffee_mix_stick', '커피믹스', [], ['korean coffee mix stick', 'instant coffee mix sachet']),
        ('canned_coffee', '캔커피', [], ['canned coffee', 'coffee can drink']),
        ('instant_coffee_jar', '인스턴트 커피', [], ['instant coffee jar', 'instant coffee granules']),
        ('sweet_potato_latte', '고구마 라떼', [], ['sweet potato latte']),
        ('toffee_nut_latte', '토피넛 라떼', [], ['toffee nut latte']),
        ('black_sesame_latte', '흑임자 라떼', [], ['black sesame latte']),
        ('grain_latte', '곡물·미숫가루 라떼', [], ['misugaru', 'grain latte']),
        ('chestnut_latte', '밤 라떼', [], ['chestnut latte']),
        ('frappuccino', '프라푸치노', [], ['frappuccino', 'java chip frappuccino']),
        ('mint_frappe', '민트 프라페', [], ['mint frappe', 'mint chocolate frappe']),
        ('cortado', '코르타도', [], ['cortado coffee']),
        ('nitro_cold_brew', '나이트로 콜드 브루', [], ['nitro cold brew']),
        ('refresher', '리프레셔', [], ['Starbucks refresher', 'strawberry acai refresher']),
    ],
    '차': [
        ('corn_tea2', '옥수수차', [], ['oksusu-cha', 'roasted corn tea']),
        ('brown_rice_tea2', '현미차', [], ['hyeonmi-cha', 'roasted brown rice tea']),
        ('hojicha', '호지차', [], ['hojicha']),
        ('ssanghwa_tea', '쌍화차', [], ['ssanghwa-cha', '쌍화차']),
        ('kombucha2', '콤부차', [], ['kombucha bottle']),
        ('milk_tea_bottle', '밀크티 보틀', [], ['milk tea bottle']),
    ],
    '탄산음료(매장)': [
        ('grapefruit_ade', '자몽에이드', [], ['grapefruit ade', 'grapefruit soda glass']),
        ('green_grape_ade', '청포도에이드', [], ['green grape ade', 'green grape soda']),
        ('lemonade2', '레모네이드', [], ['lemonade glass', 'lemon ade']),
        ('strawberry_ade', '딸기에이드', [], ['strawberry ade', 'strawberry soda glass']),
        ('blue_lemonade', '블루레몬에이드', [], ['blue lemonade']),
        ('mojito_ade', '모히또', [], ['virgin mojito']),
        ('cherry_cola', '체리콜라', [], ['cherry cola glass']),
        ('sparkling_juice', '과일 스파클링', [], ['sparkling fruit drink', 'fruit soda bottle']),
    ],
    '빙과류·과자류': [
        ('soft_serve', '소프트 아이스크림', [], ['soft serve ice cream cone', 'soft-serve']),
        ('hot_dog_stick', '핫도그', [], ['corn dog', 'korean hot dog']),
        ('sausage_bread', '소시지빵', [], ['sausage bread', 'sausage roll bun']),
        ('salad_bread', '사라다빵', [], ['salad bread korean', 'potato salad sandwich roll']),
        ('choco_pudding2', '초코 푸딩', [], ['chocolate pudding cup']),
    ],
    '초콜릿': [
        ('choco_syrup2', '초코 시럽', [], ["Hershey's syrup", 'chocolate syrup bottle']),
        ('hazelnut_spread2', '초코 헤이즐넛 스프레드', [], ['Nutella jar', 'chocolate hazelnut spread']),
    ],
    '약': [
        ('drug_powder', '가루약(과립·산제)', [], ['medicine powder sachet', 'medicine granules sachet']),
    ],
}


def api(params):
    url = 'https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode({'action': 'query', 'format': 'json', **params})
    return json.loads(get(url))


def infos(gen):
    """generator 결과에 사진 크기·라이선스·작가를 붙인다."""
    q = api({**gen, 'prop': 'imageinfo', 'iiprop': 'url|size|extmetadata', 'iiurlwidth': 1600})
    out = []
    for p in q.get('query', {}).get('pages', {}).values():
        if 'imageinfo' not in p:
            continue
        ii = p['imageinfo'][0]; m = ii.get('extmetadata', {})
        lic = m.get('LicenseShortName', {}).get('value', '')
        title = p['title'].replace('File:', '')
        if not OK_LICENSE.match(lic) or min(ii['width'], ii['height']) < MIN_SIDE:
            continue
        if any(w in title.lower() for w in SKIP_WORDS) or not title.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
            continue
        out.append({'title': title, 'url': ii['thumburl'], 'thumbnail': ii['thumburl'].replace('/1600px-', '/330px-'),
                    'creator': strip_html(m.get('Artist', {}).get('value')), 'license': lic,
                    'license_url': m.get('LicenseUrl', {}).get('value', ''), 'foreign_landing_url': ii['descriptionurl'],
                    'width': ii['width'], 'height': ii['height']})
    return out


def find(sources):
    seen, res = set(), []
    for s in sources:
        if s.startswith('cat:'):
            gen = {'generator': 'categorymembers', 'gcmtitle': 'Category:' + s[4:], 'gcmtype': 'file', 'gcmlimit': 200}
        else:
            gen = {'generator': 'search', 'gsrnamespace': 6, 'gsrsearch': f'{s} filetype:bitmap', 'gsrlimit': 40}
        for t in range(3):   # 429(요청 너무 많음)이면 1분 쉬고 다시
            try:
                for c in infos(gen):
                    if c['title'] not in seen:
                        seen.add(c['title']); res.append(c)
                break
            except Exception as e:
                print('  fail', s, e, flush=True); time.sleep(60)
        time.sleep(4)
    # 큰 사진 먼저
    return sorted(res, key=lambda c: -min(c['width'], c['height']))[:MAX_CANDS]


def sheet(key, ko, cands):
    W, H = 220, 250
    cols = 6
    s = Image.new('RGB', (W * cols, (H + 22) * ((len(cands) + cols - 1) // cols) + 30), 'white')
    d = ImageDraw.Draw(s)
    font = ImageFont.truetype('malgun.ttf', 13)
    d.text((6, 6), f'{key} · {ko} · 후보 {len(cands)}', fill='black', font=ImageFont.truetype('malgunbd.ttf', 16))
    os.makedirs(os.path.join(OUT, 'thumbs'), exist_ok=True)
    for i, c in enumerate(cands):
        x, y = (i % cols) * W, 30 + (i // cols) * (H + 22)
        p = os.path.join(OUT, 'thumbs', f'{key}_{i}.jpg')
        try:
            if not os.path.exists(p):
                Image.open(io.BytesIO(get(c['thumbnail']))).convert('RGB').save(p)
                time.sleep(0.5)   # 위키미디어 썸네일 요청 제한(429)
            im = Image.open(p); im.thumbnail((W - 6, H - 6)); s.paste(im, (x + 3, y + 3))
        except Exception as e:
            print('  thumb fail', key, i, e, flush=True)
        lic = c['license'].replace('Public domain', 'PD')
        d.text((x + 4, y + H + 2), f"{i} {lic} {c['width']}x{c['height']}", fill='black', font=font)
    s.save(os.path.join(OUT, f'{key}.jpg'), quality=82)


# 오픈푸드팩츠(Open Food Facts): 사용자가 올린 포장 앞면 사진, CC BY-SA 3.0. 제품만 잘라 둔 사진이 많다 (2026-10-31 기준 완화)
OFF_LICENSE = ('CC BY-SA 3.0', 'https://creativecommons.org/licenses/by-sa/3.0/')
OFF_QUERIES = {
    'brand_fanta_orange': ['fanta orange'], 'brand_fanta_grape': ['fanta grape'], 'brand_fanta_pineapple': ['fanta pineapple'],
    'brand_welchs': ["welch's sparkling grape", "welch's grape soda"], 'brand_mccol': ['mccol', '맥콜'],
    'brand_milkis': ['milkis'], 'brand_chilsung': ['chilsung cider', '칠성사이다'], 'brand_tams': ['tams orange'],
    'brand_monster_ultra': ['monster ultra zero', 'monster energy ultra white'], 'brand_monster_citra': ['monster ultra citron'],
    'brand_monster_strawberry': ['monster ultra strawberry dreams'], 'brand_monster_peachy': ['monster ultra peachy keen'],
    'brand_monster_mango': ['monster mango loco'], 'brand_red_bull': ['red bull energy drink 250'],
    'brand_red_bull_sugarfree': ['red bull sugarfree'], 'brand_red_bull_summer': ['red bull summer edition'],
    'brand_hot6': ['hot6', '핫식스'], 'brand_xs': ['xs energy'],
    # 커피·초콜릿 (2026-10-31)
    'brand_accafela': ['accafela', '아카페라'], 'brand_maxim_top': ['maxim top'], 'brand_cantata': ['cantata coffee', '칸타타'],
    'brand_georgia': ['georgia gotica', 'georgia coffee'], 'brand_lucas9': ['lucas9'], 'brand_starbucks_rtd': ['starbucks smooth americano'],
    'choco_syrup2': ["hershey's syrup"], 'hazelnut_spread2': ['nutella'], 'coffee_mix_stick': ['maxim mocha gold'],
}
GOOD_COUNTRY = ('en:united-states', 'en:united-kingdom', 'en:south-korea', 'en:canada', 'en:australia', 'en:ireland')


def off_find(queries):
    seen, res = set(), []
    for q in queries:
        url = 'https://world.openfoodfacts.org/cgi/search.pl?' + urllib.parse.urlencode({
            'search_terms': q, 'search_simple': 1, 'action': 'process', 'json': 1, 'page_size': 40,
            'fields': 'code,product_name,brands,image_front_url,countries_tags'})
        for t in range(4):
            try:
                prods = json.loads(get(url))['products']; break
            except Exception as e:
                print('  off retry', q, str(e)[:40], flush=True); time.sleep(15); prods = []
        for p in prods:
            img = p.get('image_front_url')
            if not img or p['code'] in seen:
                continue
            seen.add(p['code'])
            good = any(c in GOOD_COUNTRY for c in p.get('countries_tags', []))
            res.append({'title': f"{p.get('product_name', '')} ({p.get('brands', '')}) {p['code']}", 'url': img.replace('.400.jpg', '.full.jpg'),
                        'thumbnail': img, 'creator': 'Open Food Facts contributors', 'license': OFF_LICENSE[0],
                        'license_url': OFF_LICENSE[1], 'foreign_landing_url': f"https://world.openfoodfacts.org/product/{p['code']}",
                        'width': 0, 'height': 0, 'good_country': good})
        time.sleep(8)
    return sorted(res, key=lambda c: not c['good_country'])[:24]


def off_search():
    os.makedirs(OUT, exist_ok=True)
    only = sys.argv[2:]
    allc = json.load(open(CANDS, encoding='utf-8')) if os.path.exists(CANDS) else {}
    names = {k: ko for items in PRODUCTS.values() for k, ko, _, _ in items}
    for key, qs in OFF_QUERIES.items():
        if only and key not in only:
            continue
        cands = off_find(qs)
        allc[key + '_off'] = cands
        json.dump(allc, open(CANDS, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        sheet(key + '_off', names.get(key, key) + ' (오픈푸드팩츠)', cands)
        print('off', key, len(cands), flush=True)


def search():
    os.makedirs(OUT, exist_ok=True)
    only = sys.argv[2:]
    allc = json.load(open(CANDS, encoding='utf-8')) if os.path.exists(CANDS) else {}
    for cat, items in PRODUCTS.items():
        for key, ko, ids, sources in items:
            if only and key not in only:
                continue
            cands = find(sources)
            allc[key] = cands
            json.dump(allc, open(CANDS, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
            sheet(key, ko, cands)
            print(cat, key, len(cands), flush=True)


if __name__ == '__main__':
    {'search': search, 'off': off_search}[sys.argv[1]]()
