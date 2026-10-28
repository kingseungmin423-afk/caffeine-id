"""assets/photos/credits.json 의 사진마다 위키미디어 원본 페이지를 다시 조회해 저작권 위험 신호를 점검한다.
결과: assets/photos/license_review.csv

점검 항목
- license_now : 지금 원본 페이지의 라이선스 (받을 때와 같은지)
- deletion    : 삭제 요청·저작권 침해 신고·허가 없음 표시가 붙어 있는지
- review      : Flickr 등 외부에서 옮겨온 사진이면 라이선스 확인(리뷰)을 통과했는지
- trademark   : 상표 경고(Trademarked) 표시
- personality : 초상권 경고(Personality rights) 표시
- artist      : 작가 표기가 있는지
"""
import csv, json, os, re, time, urllib.parse, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
PHOTOS = os.path.join(HERE, '..', '..', 'assets', 'photos')
UA = {'User-Agent': 'caffeine-finder-student-project/0.1 (portfolio)'}

DELETION = re.compile(r'(Deletion requests|Copyright violations|Candidates for speedy deletion|'
                      r'Media without a license|Media missing permission|Media without a source|'
                      r'Possible copyright violations|Flickr images with bad license|License review needed)', re.I)
REVIEW_OK = re.compile(r'(Flickr images reviewed|Flickr review|reviewed by FlickreviewR|License review passed|'
                       r'Files with license review|FlickrUploaderReview|Flickr upload bot)', re.I)   # 업로드 봇은 올릴 때 Flickr 라이선스를 기록
REVIEW_NEEDED = re.compile(r'(Flickr images needing human review|Unreviewed|review needed)', re.I)


def api(params):
    url = 'https://commons.wikimedia.org/w/api.php?' + urllib.parse.urlencode({'format': 'json', **params})
    for i in range(5):
        try:
            return json.loads(urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=40).read())
        except Exception:
            time.sleep(5 * (i + 1))
    raise RuntimeError('API 실패')


def main():
    rows = json.load(open(os.path.join(PHOTOS, 'credits.json'), encoding='utf-8'))
    out = []
    for r in rows:
        title = 'File:' + r['title']
        d = api({'action': 'query', 'titles': title, 'prop': 'imageinfo|categories|templates',
                 'iiprop': 'extmetadata', 'cllimit': 'max', 'clshow': '', 'tllimit': 'max', 'tlnamespace': 10})
        page = next(iter(d['query']['pages'].values()))
        if 'missing' in page:
            out.append({'photo_key': r['photo_key'], 'title': r['title'], 'status': '원본 페이지 없음(삭제됨?)'}); continue
        m = page['imageinfo'][0]['extmetadata']
        cats = [c['title'].replace('Category:', '') for c in page.get('categories', [])]
        tpls = [t['title'].replace('Template:', '') for t in page.get('templates', [])]
        alltext = ' | '.join(cats + tpls)
        lic_now = m.get('LicenseShortName', {}).get('value', '')
        restr = m.get('Restrictions', {}).get('value', '')
        from_flickr = 'flickr' in (m.get('Credit', {}).get('value', '') + alltext).lower()
        row = {
            'photo_key': r['photo_key'], 'title': r['title'],
            'license_then': r['license'], 'license_now': lic_now,
            'license_same': lic_now.replace(' ', '').lower() == r['license'].replace(' ', '').lower(),
            'deletion': '; '.join(c for c in cats if DELETION.search(c)),
            'from_flickr': from_flickr,
            'review': ('통과' if REVIEW_OK.search(alltext) else '확인 필요' if REVIEW_NEEDED.search(alltext)
                       else ('기록 없음' if from_flickr else '해당 없음')),
            'trademark': 'trademark' in (restr + alltext).lower(),
            'personality': 'personality' in (restr + alltext).lower(),
            'artist': bool(re.sub(r'<[^>]+>', '', m.get('Artist', {}).get('value', '')).strip()),
            'restrictions': restr,
        }
        flags = []
        if not row['license_same']: flags.append('라이선스 바뀜')
        if row['deletion']: flags.append('삭제·침해 표시')
        if row['review'] in ('확인 필요', '기록 없음'): flags.append('외부 사진 라이선스 미확인')
        if row['personality']: flags.append('초상권 경고')
        if not row['artist'] and 'CC BY' in lic_now: flags.append('작가 표기 없음')
        row['status'] = ', '.join(flags) or '문제 없음'
        row['trademark_note'] = '상표 있음(제품 식별 용도로만)' if (row['trademark'] or r['photo_key'].startswith('brand_')) else ''
        out.append(row)
        print(r['photo_key'], row['status'], row['trademark_note'], flush=True)
        time.sleep(1)
    keys = sorted({k for o in out for k in o}, key=lambda k: list(out[0]).index(k) if k in out[0] else 99)
    with open(os.path.join(PHOTOS, 'license_review.csv'), 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.DictWriter(f, fieldnames=keys); w.writeheader(); w.writerows(out)


if __name__ == '__main__':
    main()
