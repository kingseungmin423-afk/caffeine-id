"""raw/ 의 출처별 CSV를 하나의 앱용 카페인 데이터베이스로 합친다.
결과: ../caffeine_db.json, ../caffeine_db.csv
USDA 전체 원본(usda_caffeine_all.csv)은 영어 참고용이라 합치지 않는다.
"""
import csv, json, os, re
from collections import Counter

HERE = os.path.dirname(os.path.abspath(__file__))
RAW = os.path.join(HERE, '..', 'raw')
OUT_JSON = os.path.join(HERE, '..', 'caffeine_db.json')
OUT_CSV = os.path.join(HERE, '..', 'caffeine_db.csv')

SOURCES = ['package_labels.csv', 'danawa_kr.csv', 'gongcha_kr.csv',
           'mfds_average.csv', 'kca_surveys.csv', 'starbucks_kr.csv', 'ediya_kr.csv', 'mega_kr.csv', 'paik_kr.csv',
           'hollys_kr.csv', 'coffeebean_kr.csv', 'drugs_kr.csv', 'usda_generic_ko.csv',
           # 새 출처는 맨 끝에 붙인다 (이미 있는 음식 번호가 바뀌면 사진·북마크·조회 수 연결이 깨진다)
           'soda_regular.csv']

# 이름에 이런 말이 있는데 카페인이 높게 적혀 있으면 출처 입력 오류일 수 있다
NON_CAFFEINE_HINT = re.compile(r'(빵|베이글|샌드위치|스무디|에이드|주스|요거트|레모네이드|치즈|크루아상|스콘)')
CAFFEINE_HINT = re.compile(r'(커피|라떼|모카|초코|초콜릿|티라미수|말차|녹차|티|아메리카노|에스프레소|카페|콜드브루|샷|아포가토|프라푸치노)')


def clean_name(n):
    n = re.sub(r'\(수출명[^)]*\)', '', n)
    n = re.sub(r'\s*\(\s*,[^)]*\)\)?', '', n)          # '(, 1병(150mL) 중)' 같은 파싱 잔여물
    n = re.sub(r'\s*\((\[?내수용\]?)\)', '', n)        # '(내수용)' 표기는 뺀다
    n = re.sub(r'\(\((.*?)\)\)', r'(\1)', n)
    return re.sub(r'\s+', ' ', n).strip()


def ediya_serving(name):
    if name.startswith('(EX)'):
        return 'Extra 사이즈'
    if name.startswith('(L)'):
        return 'Large 사이즈'
    return ''


BRAND_ALIAS = {'스타벅스': '스벅', '메가MGC커피': '메가커피', '이디야커피': '이디야', '빽다방': '백다방',
               '투썸플레이스': '투썸', '컴포즈커피': '컴포즈', '코카-콜라음료': '코카콜라'}


def auto_aliases(name, brand, given, category=''):
    """검색용 동의어: 띄어쓰기 없는 이름, 브랜드 줄임말, 자주 쓰는 줄임말."""
    out = [a for a in given.split(';') if a]
    base = re.sub(r'^\((L|EX)\)\s*', '', name)
    base = re.sub(r'\s*\((HOT|ICED)\)$', '', base)
    if base != name:
        out.append(base)
    nospace = base.replace(' ', '')
    if nospace != base:
        out.append(nospace)
    if brand in BRAND_ALIAS:
        out.append(f'{BRAND_ALIAS[brand]} {base}')
    iced = re.search(r'ICED|아이스', name)
    if category == '카페 음료' and '아메리카노' in name and '디카페인' not in name:
        out.append('아아' if iced else '뜨아')
    if '콜드 브루' in name:
        out.append(name.replace('콜드 브루', '콜드브루'))
    seen, res = set(), []
    for a in out:
        if a and a != name and a not in seen:
            seen.add(a); res.append(a)
    return ';'.join(res)


def _has(name, *words):
    return any(w in name for w in words)


def image_key(name, category, serving=''):
    """음식마다 쓸 일러스트(종류별 약 30장)를 이름·분류 규칙으로 정한다. 그림 파일은 assets/food/{key}.svg"""
    n = name
    if category == '의약품':
        if _has(n, '캡슐'): return 'drug_capsule'
        if _has(n, '시럽'): return 'drug_syrup'
        if re.search(r'(과립|산|산제)(\s*\(|$)', n): return 'drug_powder'
        if re.search(r'액(\s*\(|$)', n) or _has(n, '내복액', '드링크'): return 'drug_bottle'
        return 'drug_tablet'
    if category in ('카페 음료', '커피'):
        if _has(n, '믹스', '인스턴트'): return 'coffee_stick'
        if _has(n, '스무디', '프라푸치노', '블렌디드', '쉐이크', '셰이크', '빙수', '프라페', '치노'): return 'cafe_blended'
        if _has(n, '에이드', '레모네이드', '리프레셔', '주스', '피지오', '스파클링'): return 'cafe_ade'
        if _has(n.replace('티라미수', ''), '밀크티', '티', '차', '말차', '녹차', '얼그레이', '루이보스', '캐모마일'): return 'cafe_tea'
        if _has(n, '에스프레소', '샷') and not _has(n, '라떼'): return 'cafe_espresso'
        if _has(n, '아이스', 'ICED', '(ICE)', 'Cold', '콜드', '아아') and not _has(n, 'HOT', 'Hot'): return 'cafe_iced'
        if _has(n, '라떼', '카푸치노', '모카', '마끼아또', '마키아토', '플랫', '초코', '코코아'): return 'cafe_latte'
        return 'cafe_hot'
    if category == '커피(RTD)':
        if _has(n, '(컵)', '컵', '강릉커피', '커피타운') or ('스타벅스' in n and 'ml' in n.lower()): return 'coffee_cup_rtd'
        if _has(n, '페트', '1L', '1000') or re.search(r'(1,?000|1100|500)\s*ml', serving.lower() if serving else ''): return 'coffee_bottle'
        return 'coffee_can'
    if category == '커피(캡슐)': return 'coffee_capsule'
    if category == '탄산음료': return 'soda_can'
    if category == '에너지음료': return 'energy_can'
    if category == '우유·유제품':
        if _has(n, '요거트'): return 'yogurt'
        if _has(n, '커피', '라떼', '말차'): return 'milk_coffee'
        return 'milk_carton'
    if category == '초콜릿': return 'chocolate'
    if category == '코코아':
        if _has(n, '가루'): return 'powder_jar'
        if _has(n, '우유'): return 'milk_carton'
        return 'cafe_latte'
    if category == '디저트':
        if _has(n, '아이스크림', '프로즌', '젤라또', '아포가토', '빙'): return 'icecream'
        if _has(n, '쿠키', '브라우니', '스콘', '마카롱'): return 'cookie'
        if _has(n, '도넛'): return 'donut'
        if _has(n, '시럽', '스프레드', '잼'): return 'powder_jar'
        if _has(n, '빵', '베이글', '크루아상', '토스트', '샌드'): return 'bread'
        return 'cake'
    if category == '차':
        if _has(n, '콤부차', '아이스티'): return 'drink_bottle'
        return 'teabag'
    if category == '주스': return 'juice'
    if category in ('물', '음료'): return 'water_bottle'
    if category == '주류': return 'beer'
    if category == '빵': return 'bread'
    if category == '시리얼': return 'cereal'
    return 'default'


def category_of(r, fname):
    if fname == 'paik_kr.csv' and 'menu_dessert' in r['source_url']:
        return '디저트'
    return r['category']


rows = []
for fname in SOURCES:
    path = os.path.join(RAW, fname)
    if not os.path.exists(path):
        print('skip (없음):', fname)
        continue
    for r in csv.DictReader(open(path, encoding='utf-8-sig')):
        name = clean_name(r['name_ko'])
        if fname == 'drugs_kr.csv':
            if re.search(r'카페인(무수물|수화물)$', name):   # 원료 가루는 먹는 제품이 아니다
                continue
            r['subcategory'] = r['subcategory'] or '구분 미표기'
        serving = r['serving'] or (ediya_serving(name) if r['brand'] == '이디야커피' else '')
        mg = float(r['caffeine_mg'])
        notes = []
        if mg >= 20 and NON_CAFFEINE_HINT.search(name) and not CAFFEINE_HINT.search(name):
            notes.append('이름에 비해 카페인이 높음 — 숨은 카페인 사례이거나 출처 입력 오류, 확인 필요')
        if not serving:
            notes.append('기준량 미표기')
        if r.get('review') == 'True':
            notes.append('출처 페이지를 직접 확인하지 못함')
        rows.append({
            'name_ko': name,
            'aliases': auto_aliases(name, r['brand'], r.get('aliases', ''), r['category']),
            'brand': r['brand'],
            'category': category_of(r, fname),
            'subcategory': r['subcategory'],
            'serving': serving,
            'caffeine_mg': mg,
            'has_caffeine': mg > 0,
            'confidence': r['confidence'],
            'source': r['source'],
            'source_url': r['source_url'],
            'checked_at': r['checked_at'],
            'image_key': image_key(name, category_of(r, fname), serving),
            'needs_review': bool(notes and notes != ['기준량 미표기']),
            'notes': ' / '.join(notes),
        })

# 같은 출처 안의 완전 중복 제거
seen, uniq = set(), []
for r in rows:
    k = (r['name_ko'], r['brand'], r['serving'], r['caffeine_mg'], r['source'])
    if k not in seen:
        seen.add(k); uniq.append(r)
for i, r in enumerate(uniq, 1):
    r['id'] = f'caf-{i:05d}'
rows = [{'id': r.pop('id'), **r} for r in uniq]

with open(OUT_JSON, 'w', encoding='utf-8') as f:
    json.dump({'version': rows[0]['checked_at'], 'count': len(rows), 'items': rows}, f, ensure_ascii=False, indent=1)
with open(OUT_CSV, 'w', newline='', encoding='utf-8-sig') as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0]))
    w.writeheader(); w.writerows(rows)

print('total', len(rows))
print('by category', Counter(r['category'] for r in rows).most_common())
print('by confidence', Counter(r['confidence'] for r in rows).most_common())
print('has caffeine', sum(r['has_caffeine'] for r in rows), '/ zero', sum(not r['has_caffeine'] for r in rows))
print('image_key', Counter(r['image_key'] for r in rows).most_common())
print('needs_review', sum(r['needs_review'] for r in rows))
for r in rows:
    if r['needs_review']:
        print('  review:', r['brand'], r['name_ko'], r['caffeine_mg'], r['notes'])
