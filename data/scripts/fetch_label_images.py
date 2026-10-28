"""제조사 공식 사이트의 제품 사진(포장 표기가 보이는 이미지)을 ../cache/labels/ 에 받는다.
사진 속 '총 카페인 함량' 표기는 사람이(또는 Claude가) 읽어서 raw/package_labels.csv 에 옮겨 적는다.

현재 지원: 서울우유 (m.seoulmilk.co.kr)
"""
import json, os, re, ssl, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'cache', 'labels')
KEYWORDS = re.compile(r'커피|초코|카페|라떼|모카|강릉|스타벅스|티|coffee|choco', re.I)

ctx = ssl.create_default_context()
ctx.set_ciphers('DEFAULT@SECLEVEL=1')   # 서울우유 서버가 오래된 암호 방식을 써서 필요
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
H = {'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile/15E148 Safari/604.1'}


def get(url, binary=False):
    b = urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=25, context=ctx).read()
    return b if binary else b.decode('utf-8', 'ignore')


def seoulmilk():
    base = 'https://m.seoulmilk.co.kr/mobile/product/'
    products = {}
    for sub in ['P0', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9', 'P10', 'P11', 'P12', 'P13']:
        for page in range(1, 10):
            try:
                h = get(f'{base}product_list.sm?subname={sub}&page={page}')
            except Exception:
                break
            found = re.findall(r'product_view\.sm\?subname=(\w+)&gubun=&nmNo=(\d+)[^"]*">.*?<h5>(.*?)</h5>', h, re.S)
            new = [f for f in found if f[1] not in products]
            for s, no, name in new:
                products[no] = (s, re.sub(r'<[^>]+>', '', name).strip())
            if not new:
                break
    picked = {no: v for no, v in products.items() if KEYWORDS.search(v[1])}
    d = os.path.join(OUT, 'seoulmilk')
    os.makedirs(d, exist_ok=True)
    index = []
    for no, (sub, name) in picked.items():
        url = f'{base}product_view.sm?subname={sub}&gubun=&nmNo={no}&page=1'
        h = get(url)
        imgs = sorted(set(re.findall(r'(/Product_Data/pimages/[^"\'\s]+\.(?:jpg|png))', h, re.I)))
        imgs = [i for i in imgs if not re.search(r'/s_|/S_', i)]  # 목록용 썸네일 제외
        files = []
        for i, p in enumerate(imgs):
            fn = f'{no}_{i}{os.path.splitext(p)[1]}'
            open(os.path.join(d, fn), 'wb').write(get('https://m.seoulmilk.co.kr' + p, binary=True))
            files.append(fn)
        index.append({'no': no, 'name': name, 'url': url, 'files': files})
        print(no, name, len(files))
    json.dump(index, open(os.path.join(d, 'index.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(len(products), 'products,', len(picked), 'picked')


def binggrae():
    """빙그레: 제품군(FAMILY) → 맛(prod_idx) → 용량별 공식 제품 이미지."""
    import urllib.parse
    base = 'https://www.bing.co.kr'

    def post(path, data, pdt):
        h = dict(H, **{'X-Requested-With': 'XMLHttpRequest', 'Referer': f'{base}/product/detail?PDT={pdt}',
                       'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'})
        req = urllib.request.Request(base + path, data=urllib.parse.urlencode(data).encode(), headers=h)
        return json.loads(urllib.request.urlopen(req, timeout=30, context=ctx).read().decode('utf-8'))

    fams = post('/product/getProductList', {'pdt_code': '', 'page_cnt': 400, 'search_name': '', 'tag_type': '', 'lang': 'KO'}, '')
    picked = [(f['FAMILY_IDX'], f['FAMILY_NAME']) for f in fams['list']
              if KEYWORDS.search(f['FAMILY_NAME']) or re.search(r'사냥|아카페라|바나나맛', f['FAMILY_NAME'])]
    picked = [p for p in picked if '수출' not in p[1]]
    d = os.path.join(OUT, 'binggrae')
    os.makedirs(d, exist_ok=True)
    index = []
    for pdt, fam in picked:
        h = get(f'{base}/product/detail?PDT={pdt}')
        for prod_idx in dict.fromkeys(re.findall(r'get_volume_list\((\d+)\)', h)):
            for v in post('/product/get_volume_list', {'prod_idx': prod_idx, 'lang': 'KO'}, pdt)['list']:
                img = v.get('PROD_IMG_FILE')
                if not img:
                    continue
                fn = f"{pdt}_{prod_idx}_{v['PROD_VAL_IDX']}{os.path.splitext(img)[1]}"
                open(os.path.join(d, fn), 'wb').write(get(base + urllib.parse.quote(img), binary=True))
                index.append({'family': fam, 'name': v['PROD_NAME'], 'volume': v['AMT_INFO'], 'file': fn,
                              'url': f'{base}/product/detail?PDT={pdt}'})
                print(fam, '|', v['PROD_NAME'], v['AMT_INFO'], fn)
    json.dump(index, open(os.path.join(d, 'index.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    import sys
    for t in sys.argv[1:] or ['seoulmilk', 'binggrae']:
        globals()[t]()
