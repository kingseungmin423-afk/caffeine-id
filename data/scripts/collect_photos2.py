"""사진 2차 수집 (2026-10-31 사용자 요청: '저작권 없는 사진을 최대한 많이, 음식마다 따로').
collect_photos.py와 같은 방식: 위키미디어 공용에서 상업적 사용 + 출처 표기만으로 쓸 수 있는 라이선스(CC0, 퍼블릭 도메인, CC BY, CC BY-SA)만.
이미 있는 사진을 다른 음식에 나눠 붙이지 않고, 음식(또는 같은 제품의 용량·맛 차이)마다 새 사진을 찾는다.
제조사 공식 사진은 쓰지 않는다. 브랜드 제품은 사용자가 직접 찍어 CC로 올린 사진만.

python collect_photos2.py search [key ...]   # 후보 검색 + 비교용 모음 이미지(../cache/photos/sheets2)
python collect_photos2.py pick               # PICKS에 고른 후보를 ../../assets/photos 로 받고 credits.csv 끝에 붙인다(기존 줄은 그대로)
그다음 python cutout_photos.py <새 키들> → cd app && npm run photos
"""
import csv, io, json, os, sys, time
from PIL import Image

from collect_photos import CACHE, OUT_DIR, commons, get, make_sheet, strip_html

SHEETS = os.path.join(CACHE, 'sheets2')
CANDS = os.path.join(CACHE, 'candidates2.json')

# (photo_key, 한국어 이름, 검색어, 연결할 항목 id)
CONCEPTS = [
    # 일반 음식 (브랜드 없음)
    ('milk', '우유', 'glass of milk', ['caf-01582']),
    ('lowfat_milk', '저지방 우유', 'skim milk glass', ['caf-01583']),
    ('strawberry_milk', '딸기우유', 'strawberry milk', ['caf-01584']),
    ('soy_milk', '두유', 'soy milk glass', ['caf-01585']),
    ('almond_milk', '아몬드 우유', 'almond milk glass', ['caf-01586']),
    ('oat_milk', '귀리 우유', 'oat milk glass', ['caf-01587']),
    ('plain_yogurt', '플레인 요거트', 'plain yogurt bowl', ['caf-01588']),
    ('vanilla_icecream', '바닐라 아이스크림', 'vanilla ice cream scoop', ['caf-01589']),
    ('frozen_yogurt', '프로즌 요거트', 'frozen yogurt cup', ['caf-01590']),
    ('choco_frozen_yogurt', '초코 프로즌 요거트', 'chocolate frozen yogurt', ['caf-01563']),
    ('apple_juice', '사과 주스', 'apple juice glass', ['caf-01592']),
    ('grape_juice', '포도 주스', 'grape juice glass', ['caf-01593']),
    ('lemonade', '레모네이드', 'lemonade glass', ['caf-01594']),
    ('sparkling_water', '탄산수', 'sparkling water glass', ['caf-01596']),
    ('sports_drink', '이온음료', 'sports drink bottle', ['caf-01597']),
    ('beer', '맥주', 'glass of beer', ['caf-01598']),
    ('wine', '와인', 'glass of red wine', ['caf-01599']),
    ('white_bread', '식빵', 'white bread slices', ['caf-01600']),
    ('corn_tea', '옥수수차', 'corn tea', ['caf-01602']),
    ('brown_rice_tea', '현미차', 'genmai brown rice tea', ['caf-01603']),
    ('decaf_espresso', '디카페인 에스프레소', 'espresso cup saucer', ['caf-01530']),
    ('decaf_latte', '디카페인 라떼', 'caffe latte glass', ['caf-01533']),
    ('decaf_black_tea', '디카페인 홍차', 'cup of tea with milk', ['caf-01535']),
    ('decaf_coffee', '디카페인 커피', 'decaffeinated coffee', ['caf-01579']),
    ('instant_coffee', '인스턴트 커피(블랙)', 'instant coffee granules', ['caf-01577']),
    ('instant_coffee_mix', '인스턴트 커피(설탕·프림)', 'korean coffee mix', ['caf-01578']),
    ('decaf_instant', '디카페인 인스턴트 커피', 'instant coffee jar', ['caf-01580']),
    ('iced_mocha', '아이스 카페모카', 'iced mocha', ['caf-01576']),
    ('caffeine_free_cola', '무카페인 콜라', 'cola bottle', ['caf-01543']),
    ('pepper_soda', '닥터페퍼류 탄산', 'soda fountain drink cup', ['caf-01544']),
    ('ginger_ale', '진저에일', 'ginger ale glass', ['caf-01546']),
    ('root_beer', '루트비어', 'root beer mug', ['caf-01547']),
    ('fruit_soda', '과일맛 탄산음료', 'orange soda glass', ['caf-01548']),
    ('energy_drink_generic', '에너지드링크(일반)', 'energy drink cans', ['caf-01549']),
    ('chocolate_chips', '세미스위트 초콜릿(초코칩)', 'chocolate chips', ['caf-01555']),
    ('baking_chocolate', '베이킹 초콜릿(무가당)', 'baking chocolate unsweetened', ['caf-01556']),
    ('choco_peanuts', '초콜릿 코팅 땅콩', 'chocolate covered peanuts', ['caf-01557']),
    ('choco_cereal', '초코 시리얼', 'chocolate cereal bowl', ['caf-01561']),
    ('sandwich_cookie', '초코 샌드 쿠키', 'chocolate sandwich cookies', ['caf-01566']),
    ('choco_pudding', '초코 푸딩', 'chocolate pudding', ['caf-01570']),
    ('choco_cheesecake', '초코 치즈케이크', 'chocolate cheesecake', ['caf-01571']),
    ('choco_syrup', '초코 시럽', 'chocolate syrup', ['caf-01572']),
    ('hazelnut_spread', '초코 헤이즐넛 스프레드', 'chocolate hazelnut spread jar', ['caf-01573']),
    # 브랜드 제품 (사용자가 찍은 CC 사진)
    ('brand_sprite', '스프라이트', 'Sprite can', ['caf-01604']),
    ('brand_sprite_zero', '스프라이트 제로', 'Sprite Zero', ['caf-00326']),
    ('brand_fanta_orange', '환타 오렌지', 'Fanta Orange can', ['caf-01605']),
    ('brand_fanta_grape', '환타 포도', 'Fanta Grape', ['caf-01606']),
    ('brand_fanta_pineapple', '환타 파인애플', 'Fanta Pineapple', ['caf-00330']),
    ('brand_chilsung', '칠성사이다', 'Chilsung Cider', ['caf-01607']),
    ('brand_milkis', '밀키스', 'Milkis', ['caf-01608']),
    ('brand_welchs', '웰치 소다 포도', "Welch's grape soda", ['caf-01609']),
    ('brand_mountain_dew', '마운틴듀', 'Mountain Dew bottle', ['caf-00027']),
    ('brand_mccol', '맥콜', 'McCol', ['caf-00323']),
    ('brand_hot6', '핫식스', 'Hot6', ['caf-00035']),
    ('brand_xs', 'XS 에너지', 'XS Energy drink', ['caf-00391']),
    ('brand_guarana', '과라나 안타르티카', 'Guarana Antarctica can', ['caf-00374']),
    ('brand_godiva', '고디바 초콜릿', 'Godiva chocolate', ['caf-00332']),
    ('brand_guylian', '길리안', 'Guylian chocolate', ['caf-00333']),
    ('brand_ritter', '리터 스포트', 'Ritter Sport', ['caf-00335']),
    ('brand_lindor', '린트 린도볼', 'Lindt Lindor', ['caf-00336']),
    ('brand_wedel', '베델', 'E. Wedel chocolate', ['caf-00340']),
    ('brand_lavazza', '라바짜', 'Lavazza coffee', ['caf-00369']),
    ('brand_illy', '일리', 'illy coffee', ['caf-00373']),
    ('brand_dolce_gusto', '돌체구스토', 'Nescafe Dolce Gusto capsules', ['caf-00361']),
    ('brand_dunkin', '던킨 커피', "Dunkin' coffee", ['caf-00366']),
    ('brand_kanu', '카누', 'Maxim KANU', ['caf-00370']),
    ('brand_georgia', '조지아 커피', 'Georgia coffee', ['caf-00352']),
    ('brand_maxim', '맥심', 'Maxim coffee', ['caf-00348']),
    # 프랜차이즈 대표 메뉴 (그 브랜드 매장 음료를 찍은 사진만)
    ('sbux_caramel_macchiato', '스타벅스 카라멜 마키아또', 'Starbucks caramel macchiato', []),
    ('sbux_frappuccino', '스타벅스 프라푸치노', 'Starbucks Frappuccino', []),
    ('sbux_java_chip', '스타벅스 자바칩 프라푸치노', 'Java chip frappuccino', []),
    ('sbux_chai_latte', '스타벅스 차이 티 라떼', 'Starbucks chai tea latte', []),
    ('sbux_matcha', '스타벅스 말차 라떼', 'Starbucks matcha latte', []),
    ('sbux_cold_brew', '스타벅스 콜드 브루', 'Starbucks cold brew', []),
    ('sbux_americano', '스타벅스 아메리카노', 'Starbucks americano', []),
    ('sbux_refresher', '스타벅스 리프레셔', 'Starbucks refresher', []),
    ('gongcha_milk_tea', '공차 밀크티', 'Gong Cha milk tea', []),
    ('gongcha_brown_sugar', '공차 흑당', 'Gong cha brown sugar', []),
    ('gongcha_taro', '공차 타로', 'Gong Cha taro', []),
    ('ediya', '이디야 음료', 'Ediya coffee', []),
    ('mega_coffee', '메가커피 음료', 'Mega coffee Korea', []),
    ('paik', '빽다방 음료', 'Paik coffee', []),
    ('hollys', '할리스 음료', 'Hollys coffee', []),
    ('coffeebean', '커피빈 음료', 'Coffee Bean Tea Leaf drink', []),
]

# search 결과 모음 이미지(sheets2)를 보고 고른 후보 번호. 기준(2026-10-31 사용자):
# 사람·손이 나오지 않을 것, 글자(브랜드 로고 포함)는 한국어·영어만, 라이선스는 CC0·퍼블릭 도메인·CC BY·CC BY-SA
PICKS = {
    'lowfat_milk': 0, 'strawberry_milk': 7, 'soy_milk': 0, 'almond_milk': 0, 'oat_milk': 2,
    'vanilla_icecream': 8, 'frozen_yogurt': 0, 'choco_frozen_yogurt': 1, 'apple_juice': 6, 'grape_juice': 0,
    'lemonade': 10, 'sparkling_water': 0, 'wine': 8, 'white_bread': 2, 'corn_tea': 7,
    'decaf_espresso': 3, 'decaf_latte': 0, 'decaf_black_tea': 5, 'decaf_coffee': 3, 'instant_coffee': 1,
    'instant_coffee_mix': 1, 'decaf_instant': 0, 'iced_mocha': 1, 'pepper_soda': 1, 'ginger_ale': 4, 'root_beer': 3,
    'chocolate_chips': 0, 'choco_cereal': 3, 'choco_pudding': 1,
}


def search():
    os.makedirs(os.path.join(CACHE, 'thumbs2'), exist_ok=True)
    os.makedirs(SHEETS, exist_ok=True)
    only = sys.argv[2:]
    allres = json.load(open(CANDS, encoding='utf-8')) if os.path.exists(CANDS) else {}
    for key, ko, q, _ in CONCEPTS:
        if only and key not in only:
            continue
        if not only and key in allres:
            continue
        try:
            cands = commons(q)
        except Exception as e:
            print('fail', key, e, flush=True); time.sleep(10); continue
        allres[key] = cands
        imgs = []
        for i, c in enumerate(cands):
            p = os.path.join(CACHE, 'thumbs2', f'{key}_{i}.jpg')
            if not os.path.exists(p):
                try:
                    Image.open(io.BytesIO(get(c['thumbnail'] or c['url']))).convert('RGB').save(p)
                except Exception as e:
                    print('  thumb fail', key, i, e); p = None
            imgs.append(p)
        make_sheet(key, ko, cands, imgs)
        os.replace(os.path.join(CACHE, 'sheets', f'{key}.jpg'), os.path.join(SHEETS, f'{key}.jpg'))
        json.dump(allres, open(CANDS, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        print(key, len(cands), flush=True)
        time.sleep(2)


def pick():
    cand = json.load(open(CANDS, encoding='utf-8'))
    # cutout_photos.py·앱(build-photos.mjs)은 credits.json을 읽는다. csv는 같은 내용의 검토용
    path = os.path.join(OUT_DIR, 'credits.json')
    rows = json.load(open(path, encoding='utf-8'))
    fields = list(rows[0])
    have = {r['photo_key'] for r in rows}
    for key, ko, q, ids in CONCEPTS:
        if key not in PICKS:
            continue
        v = PICKS[key]
        idx, extra = (v, []) if isinstance(v, int) else (v[0], v[1])   # (후보 번호, 더 연결할 id)
        c = cand[key][idx]
        out = os.path.join(OUT_DIR, f'{key}.jpg')
        if not os.path.exists(out):
            try:
                im = Image.open(io.BytesIO(get(c['url'], tries=5))).convert('RGB')
            except Exception as e:
                print('fail', key, e, flush=True); continue
            im.thumbnail((1200, 1200))
            im.save(out, quality=85)
            print('saved', key, flush=True)
            time.sleep(2)
        if key in have:
            continue
        creator = strip_html(c['creator'])
        rows.append({**{f: '' for f in fields}, 'photo_key': key, 'name_ko': ko, 'file': f'assets/photos/{key}.jpg',
                     'item_ids': ';'.join(ids + extra), 'title': c['title'], 'creator': creator, 'license': c['license'],
                     'license_url': c['license_url'], 'source_page': c['foreign_landing_url'],
                     'credit': f"Photo: {creator or 'Unknown'} / {c['license']} / Wikimedia Commons"})
    json.dump(rows, open(path, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    with open(os.path.join(OUT_DIR, 'credits.csv'), 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.DictWriter(f, fieldnames=fields); w.writeheader(); w.writerows(rows)
    print('credits', len(rows))


if __name__ == '__main__':
    {'search': search, 'pick': pick}[sys.argv[1]]()
