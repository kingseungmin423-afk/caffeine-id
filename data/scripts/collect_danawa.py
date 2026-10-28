"""다나와 상품 상세 사양의 '카페인함량'(포장 표기 기반)을 수집한다.
공식 출처가 아니라 판매처 등록 정보이므로 confidence='retail_listing' 으로 기록한다.

사용법
  python collect_danawa.py search   # QUERIES를 검색해 후보를 ../cache/danawa_candidates.csv 로 저장
  python collect_danawa.py build    # PICKS(사람이 고른 pcode)만 ../raw/danawa_kr.csv 로 저장
"""
import csv, datetime, os, re, sys, time, urllib.parse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
CAND = os.path.join(HERE, '..', 'cache', 'danawa_candidates.csv')
OUT = os.path.join(HERE, '..', 'raw', 'danawa_kr.csv')
H = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126 Safari/537.36',
     'Referer': 'https://www.danawa.com/'}
today = datetime.date.today().isoformat()

QUERIES = [
    '코카콜라 355ml', '코카콜라 250ml', '펩시콜라 355ml', '닥터페퍼 355ml', '마운틴듀 355ml',
    '서울우유 커피 200ml', '커피포리', '빙그레 커피맛우유', '초코에몽', '서울우유 초코 200ml',
    '몬스터 에너지 355ml', '몬스터 에너지 울트라 355ml', '핫식스 250ml', '핫식스 더킹', '레드불 250ml',
    '맥심 모카골드', '맥심 화이트골드', '카누 아메리카노 미니', '더위사냥', '빵빠레 커피',
    '월드콘', '초코파이', '빼빼로', '드림카카오 72', '가나초콜릿',
    '칸타타 캔커피', '레쓰비', '조지아 캔커피', '스타벅스 프라푸치노 병', '매일 바리스타',
    '립톤 아이스티', '밀크티 페트', '데자와', '실론티', '코카콜라 제로 355ml', '펩시 제로',
    '박카스', '비타500', '헛개수', '옥수수수염차', '보리차 음료', '17차',
]


def get(url):
    req = urllib.request.Request(url, headers=H)
    return urllib.request.urlopen(req, timeout=25).read().decode('utf-8', 'ignore')


def flat(h):
    t = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' | ', h))
    return re.sub(r'(\|\s*)+', '| ', t)


def detail(pcode):
    t = flat(get(f'https://prod.danawa.com/info/?pcode={pcode}'))
    title = re.search(r'\| ([^|]+?) \| 상품비교 \|', t)
    caf = re.search(r'카페인(?:함량)? \| : \| ([\d.]+)\s*mg', t)
    serv = re.search(r'표시기준분량 \| : \| ([^|]+?) \|', t)
    return {'pcode': pcode, 'title': title.group(1).strip() if title else '',
            'caffeine_mg': caf.group(1) if caf else '', 'serving': serv.group(1).strip() if serv else '',
            'decaf_or_zero': '무카페인' in t or '카페인 없음' in t}


def search():
    rows = []
    for q in QUERIES:
        h = get('https://search.danawa.com/dsearch.php?query=' + urllib.parse.quote(q))
        pcodes = []
        for p in re.findall(r'pcode=(\d+)', h):
            if p not in pcodes:
                pcodes.append(p)
        for p in pcodes[:5]:
            try:
                d = detail(p)
            except Exception as e:
                continue
            d['query'] = q
            rows.append(d)
            time.sleep(0.4)
        print(q, len(pcodes), flush=True)
    with open(CAND, 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.DictWriter(f, fieldnames=['query', 'pcode', 'title', 'caffeine_mg', 'serving', 'decaf_or_zero'])
        w.writeheader(); w.writerows(rows)
    print(len(rows), 'candidates ->', CAND)


# (pcode, 앱에 보일 이름, 브랜드, 카테고리) — search 결과를 보고 사람이 고른 것
PICKS = [
    ('3779860', '몬스터 에너지', '코카-콜라음료', '에너지음료'),
    ('4227580', '몬스터 에너지 울트라', '코카-콜라음료', '에너지음료'),
    ('6193961', '몬스터 에너지 울트라 시트라', '코카-콜라음료', '에너지음료'),
    ('75601244', '몬스터 에너지 울트라 스트로베리 드림즈', '코카-콜라음료', '에너지음료'),
    ('46781651', '몬스터 에너지 울트라 피치 킨', '코카-콜라음료', '에너지음료'),
    ('14685686', '몬스터 에너지 망고 로코', '코카-콜라음료', '에너지음료'),
    ('1686231', '핫식스', '롯데칠성음료', '에너지음료'),
    ('17218049', '핫식스 더킹 제로', '롯데칠성음료', '에너지음료'),
    ('91117151', '핫식스 더킹 애플홀릭', '롯데칠성음료', '에너지음료'),
    ('1686301', '레드불 에너지드링크', '레드불', '에너지음료'),
]


def build():
    rows = []
    for pcode, name, brand, cat in PICKS:
        d = detail(pcode)
        if not d['caffeine_mg']:
            print('카페인 표기 없음:', pcode, d['title'])
            continue
        rows.append({'name_ko': name, 'brand': brand, 'category': cat, 'subcategory': '',
                     'serving': d['serving'], 'caffeine_mg': float(d['caffeine_mg']),
                     'source': f"다나와 상품 사양(판매처 등록 포장 표기) · {d['title']}",
                     'source_url': f'https://prod.danawa.com/info/?pcode={pcode}',
                     'checked_at': today, 'confidence': 'retail_listing'})
        time.sleep(0.4)
    with open(OUT, 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]))
        w.writeheader(); w.writerows(rows)
    print(len(rows), 'rows ->', OUT)


if __name__ == '__main__':
    {'search': search, 'build': build}[sys.argv[1]]()
