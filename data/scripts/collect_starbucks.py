"""스타벅스 코리아 공식 메뉴 데이터에서 음료별 카페인(mg)을 수집한다.
기준: 톨 사이즈(355ml). 출처: https://www.starbucks.co.kr/menu/drink_list.do
"""
import csv, json, os, datetime, urllib.request

CATEGORIES = {
    'W0000171': '콜드 브루', 'W0000060': '브루드 커피', 'W0000003': '에스프레소',
    'W0000004': '프라푸치노', 'W0000005': '블렌디드', 'W0000422': '리프레셔',
    'W0000061': '피지오', 'W0000075': '티(티바나)', 'W0000053': '기타 제조 음료',
    'W0000062': '병음료',
}
OUT = os.path.join(os.path.dirname(__file__), '..', 'raw', 'starbucks_kr.csv')
today = datetime.date.today().isoformat()

rows = []
for code, cate in CATEGORIES.items():
    req = urllib.request.Request(
        f'https://www.starbucks.co.kr/upload/json/menu/{code}.js',
        headers={'Referer': 'https://www.starbucks.co.kr/menu/drink_list.do', 'User-Agent': 'Mozilla/5.0'})
    data = json.loads(urllib.request.urlopen(req).read().decode('utf-8'))
    for p in data.get('list', []):
        caf = p.get('caffeine')
        if caf in (None, ''):
            continue
        rows.append({
            'name_ko': p['product_NM'].strip(),
            'brand': '스타벅스',
            'category': '카페 음료',
            'subcategory': cate,
            'serving': '355ml (Tall)' if code != 'W0000062' else '1병',
            'caffeine_mg': float(caf),
            'source': '스타벅스 코리아 공식 메뉴 영양정보',
            'source_url': f'https://www.starbucks.co.kr/menu/drink_view.do?product_cd={p["product_CD"]}',
            'checked_at': today,
            'confidence': 'official',
        })

with open(OUT, 'w', newline='', encoding='utf-8-sig') as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0]))
    w.writeheader(); w.writerows(rows)
print(len(rows), 'rows ->', OUT)
