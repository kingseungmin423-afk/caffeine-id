"""국내 커피 프랜차이즈 공식 홈페이지 메뉴 영양정보에서 음료별 카페인(mg)을 수집한다.
- 이디야: https://www.ediya.com/contents/drink.html
- 메가MGC커피: https://www.mega-mgccoffee.com/menu/
"""
import csv, datetime, html, os, re, urllib.request

H = {'User-Agent': 'Mozilla/5.0'}
OUT_DIR = os.path.join(os.path.dirname(__file__), '..', 'raw')
today = datetime.date.today().isoformat()


def get(url):
    req = urllib.request.Request(url, headers=H)
    return urllib.request.urlopen(req, timeout=30).read().decode('utf-8', 'ignore')


def clean(s):
    return re.sub(r'\s+', ' ', html.unescape(re.sub(r'<[^>]+>', ' ', s))).strip()


def save(name, rows):
    path = os.path.join(OUT_DIR, name)
    with open(path, 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]))
        w.writeheader(); w.writerows(rows)
    print(len(rows), 'rows ->', path)


def row(name, brand, serving, mg, url):
    return {'name_ko': name, 'brand': brand, 'category': '카페 음료', 'subcategory': '',
            'serving': serving, 'caffeine_mg': mg, 'source': f'{brand} 공식 홈페이지 메뉴 영양정보',
            'source_url': url, 'checked_at': today, 'confidence': 'official'}


# ---------- 이디야 ----------
def ediya():
    base = 'https://www.ediya.com/contents/drink.html'
    pages = [get(base)]
    for p in range(2, 30):
        h = get(f'https://www.ediya.com/inc/ajax_brand.php?gubun=menu_more&product_cate=7&chked_val=&skeyword=&page={p}')
        if '카페인' not in h:
            break
        pages.append(h)
    rows, seen = [], set()
    for h in pages:
        # 각 메뉴는 <h2>이름<span>영문</span></h2> ... pro_nutri ... 카페인 (Nmg) 순서
        for m in re.finditer(r'<h2>(.*?)<span>.*?</h2>(.*?)카페인</dt>\s*<dd>\((\d+(?:\.\d+)?)mg\)', h, re.S):
            name = clean(m.group(1))
            size = re.search(r"pro_size'?\"?>([^<]+)<", m.group(2))
            serving = clean(size.group(1)) if size else ''
            key = (name, serving)
            if name and key not in seen:
                seen.add(key)
                rows.append(row(name, '이디야커피', serving, float(m.group(3)), base))
    save('ediya_kr.csv', rows)


# ---------- 메가MGC커피 ----------
def mega():
    rows, seen = [], set()
    for cat2 in range(1, 10):
        for page in range(1, 20):
            url = (f'https://www.mega-mgccoffee.com/menu/menu.php?menu_category1=1&menu_category2={cat2}'
                   f'&category=&list_checkbox_all=all&page={page}&menu_seq=&search=')
            h = get(url)
            items = re.findall(r'cont_text_title">\s*<b>(.*?)</b>(.*?)(?=cont_text_title"|$)', h, re.S)
            new = 0
            for name, body in items:
                name = clean(name)
                caf = re.search(r'카페인\s*([\d.]+)\s*mg', clean(body))
                size = re.search(r'컵용량\s*:\s*([^<]+?)</div>', body)
                if not caf or name in seen:
                    continue
                seen.add(name); new += 1
                rows.append(row(name, '메가MGC커피', clean(size.group(1)) if size else '',
                                float(caf.group(1)), 'https://www.mega-mgccoffee.com/menu/'))
            if new == 0:
                break
    save('mega_kr.csv', rows)


# ---------- 빽다방 ----------
def paik():
    rows, seen = [], set()
    for sec in ['menu_new', 'menu_coffee', 'menu_drink', 'menu_dessert', 'menu_ccino']:
        url = f'https://paikdabang.com/menu/{sec}/'
        h = get(url)
        for blk in h.split('class="hover"')[1:]:
            name = re.search(r'<h3[^>]*>(.*?)</h3>', blk, re.S)
            caf = re.search(r'카페인 \(mg\)</div>\s*<div>([\d.]+)', blk)
            size = re.search(r'컵용량\s*:\s*([^<]+)<', blk)
            if not (name and caf):
                continue
            n = clean(name.group(1))
            if n in seen:
                continue
            seen.add(n)
            rows.append(row(n, '빽다방', clean(size.group(1)) if size else '', float(caf.group(1)), url))
    save('paik_kr.csv', rows)


# ---------- 할리스 ----------
def hollys():
    rows, seen = [], set()
    for sec in ['new', 'signature', 'espresso', 'hollyccino', 'latte', 'juice', 'tea', 'dessertdrink',
                'smoothie', 'coldbrew', 'decaf', 'milktea']:
        url = f'https://www.hollys.co.kr/menu/{sec}.do'
        try:
            h = get(url)
        except Exception:
            continue
        for blk in h.split('class="menu_view01"')[1:]:
            name = re.search(r'<p><span>(.*?)</span>', blk, re.S)
            if not name:
                continue
            n = clean(name.group(1))
            for temp, cafv in re.findall(r'<tr>\s*<th>(HOT|ICED)</th>(?:\s*<td[^>]*>[^<]*</td>){5}\s*<td[^>]*>\s*([\d.]+)\s*mg', blk):
                key = f'{n} ({temp})'
                if key in seen:
                    continue
                seen.add(key)
                # 할리스 영양정보는 'Regular / 354ml 기준'으로 표기된다
                rows.append(row(key, '할리스', 'Regular 354ml', float(cafv), url))
    save('hollys_kr.csv', rows)


# ---------- 커피빈 ----------
def coffeebean():
    rows, seen = [], set()
    for cat in range(1, 40):
        url = f'https://www.coffeebeankorea.com/menu/list.asp?category={cat}'
        try:
            h = get(url)
        except Exception:
            continue
        for blk in h.split('<li style=')[1:]:
            name = re.search(r'<span class="kor">(.*?)</span>', blk, re.S)
            caf = re.search(r'<dt>([\d.]+)</dt>\s*<dd>카페인', blk)
            if not (name and caf):
                continue
            n = clean(name.group(1))
            if n in seen:
                continue
            seen.add(n)
            rows.append(row(n, '커피빈', '', float(caf.group(1)), url))
    save('coffeebean_kr.csv', rows)


# ---------- 공차 ----------
def gongcha():
    base = 'https://www.gong-cha.co.kr'
    items = {}
    for c in range(1, 16):  # 음료 하위 카테고리 001001~001015
        try:
            h = get(f'{base}/brand/menu/product?category=001{c:03d}&scroll=y')
        except Exception:
            continue
        for cat, no in re.findall(r'product_detail\?category=(\d+)&(?:amp;)?no=(\d+)', h):
            items.setdefault(no, cat)
    rows = []
    for no, cat in items.items():
        url = f'{base}/brand/menu/product_detail?category={cat}&no={no}'
        h = get(url)
        name = re.search(r'<title>\s*(.*?)\s*\|\s*공차', h, re.S)
        if not name or '카페인' not in h:
            continue
        # 메뉴에 따라 표가 여러 개(예: 샷 옵션별)이고, 표 제목(table-title)으로 구분된다
        for tbl in h[h.find('영양정보'):].split('class="table-item')[1:]:
            title = re.search(r'class="table-title">(.*?)</div>', tbl, re.S)
            title = clean(title.group(1)) if title else ''
            temp = ''
            # 표 한 줄: [Cold|Hot] | 사이즈 | 컵용량 | 열량 | 당류 | 단백질 | 포화지방 | 나트륨 | 카페인
            for tr in re.findall(r'<tr>(.*?)</tr>', tbl, re.S):
                cells = [clean(c) for c in re.findall(r'<td[^>]*>(.*?)</td>', tr, re.S)]
                if len(cells) == 9:
                    temp = cells[0]
                    cells = cells[1:]
                if len(cells) != 8 or not re.fullmatch(r'[\d.]+', cells[-1] or ''):
                    continue
                label = ' '.join(x for x in (title, temp, cells[0]) if x)
                rows.append(row(f'{clean(name.group(1))} ({label})', '공차', f'{cells[1]}ml',
                                float(cells[-1]), url))
    save('gongcha_kr.csv', rows)


if __name__ == '__main__':
    import sys
    targets = sys.argv[1:] or ['ediya', 'mega', 'paik', 'hollys', 'coffeebean', 'gongcha']
    for t in targets:
        globals()[t]()
