"""식약처 의약품안전나라(nedrug)에서 카페인 성분이 들어간 의약품의 카페인 함량을 수집한다.
- 목록: 주성분 '카페인무수물' / '카페인수화물' / '카페인' 검색
- 상세: 원료약품 및 분량 표에서 카페인 성분의 분량과 기준(예: 1정 중, 100밀리리터 중)
허가 취소·취하된 품목은 제외한다.
"""
import csv, datetime, os, re, time, urllib.parse, urllib.request

H = {'User-Agent': 'Mozilla/5.0'}
OUT = os.path.join(os.path.dirname(__file__), '..', 'raw', 'drugs_kr.csv')
today = datetime.date.today().isoformat()
UNIT = {'밀리그램': 1.0, '그램': 1000.0, '마이크로그램': 0.001}


def get(url):
    for _ in range(3):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=40).read().decode('utf-8', 'ignore')
        except Exception:
            time.sleep(2)
    raise RuntimeError(url)


def flat(h):
    t = re.sub(r'\s+', ' ', re.sub(r'<[^>]+>', ' | ', h))
    return re.sub(r'(\|\s*)+', '| ', t)


def search(ingr):
    seqs = {}
    for page in range(1, 60):
        q = urllib.parse.urlencode({'searchYn': 'true', 'page': page, 'searchDivision': 'detail', 'ingrName1': ingr})
        t = flat(get('https://nedrug.mfds.go.kr/searchDrug?' + q))
        found = re.findall(r'품목기준코드 \| (\d+) \|(.*?)(?=품목기준코드 \||$)', t)
        blocks = re.split(r'\| \d+ \| 제품명 \| ', t)[1:]
        new = 0
        for b in blocks:
            seq = re.search(r'품목기준코드 \| (\d+)', b)
            if not seq or seq.group(1) in seqs:
                continue
            canceled = re.search(r'취소/취하구분 \| (\S+)', b)
            seqs[seq.group(1)] = canceled.group(1) if canceled else ''
            new += 1
        if new == 0:
            break
        time.sleep(0.3)
    return seqs


FORM = re.compile(r'(정|액|시럽|캡슐|과립|산|산제|환|드링크|건조시럽|내복액)(\(.*\))?$')


def display_name(product, sub):
    """한 허가에 여러 제품이 묶인 경우 하위 이름(예: '주간용', '제법1 콜라향')을 제품명과 합친다."""
    sub = sub.strip()
    if not sub:
        return product
    if FORM.search(sub) and not re.search(r'(수출용|내수용)', sub):
        return sub
    return f'{product} ({sub})'


def is_export_only(name):
    # '수출명:' 은 국내 제품에 해외 이름을 병기한 것이라 제외하지 않는다
    return '수출용' in name and '내수' not in name


def detail(seq):
    url = f'https://nedrug.mfds.go.kr/pbp/CCBBB01/getItemDetail?itemSeq={seq}'
    t = flat(get(url))
    name = re.search(r'제품명 \| (.*?) \|', t)
    comp = re.search(r'업체명 \| (.*?) \|', t)
    kind = re.search(r'전문/일반 \| (전문의약품\S*|일반의약품|의약외품)', t)
    cancel = re.search(r'취소/취하구분 \| (\S+)', t)
    out = []
    # 기준 문구(예: '1정(589.3 밀리그램) 중-', '이 약 100밀리리터 중 - 제품명') 다음에 성분표가 온다
    for m in re.finditer(r'\| ([^|]*?중)\s*-?\s*([^|]*?)\| 원료약품 및 분량 - (.*?)(?=\| [^|]*?중\s*-|첨가제|$)', t):
        basis, sub, table = m.group(1).strip(), m.group(2).strip(), m.group(3)
        product = (name.group(1) if name else seq).strip()
        for c in re.finditer(r'\| \d+ \| (카페인[^|]*?) \| ([\d.]+) \| (밀리그램|그램|마이크로그램)', table):
            out.append({
                'name_ko': display_name(product, sub),
                'brand': comp.group(1).strip() if comp else '',
                'category': '의약품',
                'subcategory': kind.group(1) if kind else '',
                'serving': basis,
                'caffeine_mg': round(float(c.group(2)) * UNIT[c.group(3)], 3),
                'ingredient': c.group(1).strip(),
                'source': '식약처 의약품안전나라 원료약품 및 분량',
                'source_url': url,
                'checked_at': today,
                'confidence': 'official',
                'status': cancel.group(1) if cancel else '정상',
            })
    return out


def refetch_bad():
    """이미 받은 CSV에서 이름·구분이 잘못 읽힌 행만 다시 받아 고친다."""
    rows = list(csv.DictReader(open(OUT, encoding='utf-8-sig')))
    bad_urls = {r['source_url'] for r in rows
                if not FORM.search(r['name_ko']) or r['subcategory'] not in ('일반의약품', '의약외품') and not r['subcategory'].startswith('전문')}
    keep = [r for r in rows if r['source_url'] not in bad_urls]
    for url in sorted(bad_urls):
        keep += detail(url.split('itemSeq=')[1])
        time.sleep(0.3)
    return keep


def save(rows):
    rows = [r for r in rows if r['status'] in ('정상', '-') and not is_export_only(r['name_ko'])
            and '(원료)' not in r['name_ko']]
    with open(OUT, 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0]))
        w.writeheader(); w.writerows(rows)
    print(len(rows), 'rows ->', OUT)


if __name__ == '__main__':
    import sys
    if '--fix' in sys.argv:
        save(refetch_bad())
        sys.exit()
    if '--missing' in sys.argv:
        # 목록을 다시 검색해 CSV에 없는 품목만 상세를 받는다
        rows = list(csv.DictReader(open(OUT, encoding='utf-8-sig')))
        have = {r['source_url'].split('itemSeq=')[1] for r in rows}
        seqs = {}
        for ingr in ['카페인무수물', '카페인수화물', '카페인시트르산염']:
            seqs.update(search(ingr))
        todo = [k for k, v in seqs.items() if (not v or v in ('-', '정상')) and k not in have]
        print('missing', len(todo), flush=True)
        for seq in todo:
            rows += detail(seq)
            time.sleep(0.3)
        save(rows)
        sys.exit()
    seqs = {}
    for ingr in ['카페인무수물', '카페인수화물', '카페인시트르산염']:
        s = search(ingr)
        print(ingr, len(s))
        seqs.update(s)
    active = [k for k, v in seqs.items() if not v or v in ('-', '정상')]
    print('total', len(seqs), 'active', len(active))
    rows = []
    for i, seq in enumerate(active):
        try:
            rows += detail(seq)
        except Exception as e:
            print('fail', seq, e)
        time.sleep(0.3)
        if i % 50 == 0:
            print(i, len(rows), flush=True)
    save(rows)
