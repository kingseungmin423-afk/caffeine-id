"""제조사 공식 사이트 제품 사진에서 읽은 포장 표기 '총 카페인 함량'.
사진 원본은 fetch_label_images.py 로 ../cache/labels/ 에 받는다.
표기는 사람이 읽어서 옮겨 적었으므로, 의심되면 source_url의 사진을 다시 확인한다.
"""
import csv, datetime, os

OUT = os.path.join(os.path.dirname(__file__), '..', 'raw', 'package_labels.csv')
today = datetime.date.today().isoformat()
SM = 'https://m.seoulmilk.co.kr/mobile/product/product_view.sm?subname=P3&gubun=&nmNo='
BG = 'https://www.bing.co.kr/product/detail?PDT='

LABELS = [
    # (이름, 브랜드, 카테고리, 용량, 카페인mg, 확인 링크, 동의어)
    ('서울우유 커피 200mL', '서울우유', '우유·유제품', '200ml', 48, SM + '10000000000625', '커피우유;서울우유 커피우유'),
    ('서울우유 커피 300mL', '서울우유', '우유·유제품', '300ml', 72, SM + '10000000000625', '커피우유;서울우유 커피우유'),
    ('서울우유 커피포리(삼각)', '서울우유', '우유·유제품', '200ml', 48, SM + '10000000000555', '커피포리;삼각커피우유'),
    ('클릭유 커피', '서울우유', '우유·유제품', '200ml', 48, SM + '10000000000554', ''),
    ('강릉커피 로우슈거 라떼', '서울우유', '커피(RTD)', '250ml', 142, SM + '10000000000643', ''),
    ('강릉커피 바닐라 라떼', '서울우유', '커피(RTD)', '250ml', 106, SM + '10000000000643', ''),
    ('강릉커피 아인슈페너', '서울우유', '커피(RTD)', '250ml', 103, SM + '10000000000643', ''),
    ('커피빈 아메리카노(페트)', '서울우유', '커피(RTD)', '1000ml', 650, SM + '10000000000556', ''),
    ('스타벅스 카페 라떼 200ml(컵)', '서울우유', '커피(RTD)', '200ml', 92, SM + '10000000000715', '스타벅스 컵커피'),
    ('스타벅스 카페 라떼 270ml(컵)', '서울우유', '커피(RTD)', '270ml', 124, SM + '10000000000715', '스타벅스 컵커피'),
    ('스타벅스 카페 라떼 320ml(컵)', '서울우유', '커피(RTD)', '320ml', 147, SM + '10000000000715', '스타벅스 컵커피'),
    ('스타벅스 카페 라떼 설탕 무첨가(컵)', '서울우유', '커피(RTD)', '320ml', 155, SM + '10000000000715', ''),
    ('스타벅스 스키니 라떼(컵)', '서울우유', '커피(RTD)', '270ml', 139, SM + '10000000000715', ''),
    ('스타벅스 바닐라 라떼 200ml(컵)', '서울우유', '커피(RTD)', '200ml', 92, SM + '10000000000715', ''),
    ('스타벅스 바닐라 라떼 270ml(컵)', '서울우유', '커피(RTD)', '270ml', 124, SM + '10000000000715', ''),
    ('스타벅스 바닐라 라떼 320ml(컵)', '서울우유', '커피(RTD)', '320ml', 147, SM + '10000000000715', ''),
    ('스타벅스 카페 모카 270ml(컵)', '서울우유', '커피(RTD)', '270ml', 124, SM + '10000000000715', ''),
    ('스타벅스 카페 모카 320ml(컵)', '서울우유', '커피(RTD)', '320ml', 147, SM + '10000000000715', ''),
    # 빙그레 공식 제품 이미지 (fetch_label_images.py binggrae)
    ('아카페라 스위트 아메리카노', '빙그레', '커피(RTD)', '240ml', 70, BG + '25', '아카페라'),
    ('아카페라 아메리카노', '빙그레', '커피(RTD)', '240ml', 70, BG + '25', '아카페라'),
    ('아카페라 카페라떼', '빙그레', '커피(RTD)', '240ml', 75, BG + '25', '아카페라'),
    ('아카페라 카라멜라떼', '빙그레', '커피(RTD)', '240ml', 65, BG + '25', '아카페라'),
    ('아카페라 바닐라라떼', '빙그레', '커피(RTD)', '240ml', 60, BG + '25', '아카페라'),
    # 매일유업 공식 제품 가이드 (구조화 데이터의 '카페인' 항목)
    ('어메이징 오트 말차', '매일유업', '우유·유제품', '190ml', 40,
     'https://productguide.maeil.com/products/ep-45764068c2e8', '오트 말차;말차 오트'),
]

# 한국 포장에는 카페인 표시 의무가 없는 콜라류(1ml당 0.15mg 미만).
# 제조사 본사(미국) 공식 제품정보 값이라 국내 제품과 다를 수 있다.
FOREIGN = [
    ('코카콜라', '코카-콜라', '탄산음료', '355ml (12 fl oz, 미국 제품 기준)', 34,
     'https://www.coca-cola.com/us/en/brands/coca-cola/products/original', '콜라;코크;코카콜라 오리지널', False),
    ('펩시', '펩시코', '탄산음료', '355ml (12 fl oz, 미국 제품 기준)', 38,
     'https://www.pepsicoproductfacts.com/Home/Product?gtin=00012000000133', '펩시콜라;콜라', False),
    ('마운틴듀', '펩시코', '탄산음료', '360ml (12 fl oz, 미국 제품 기준)', 52,
     'https://www.pepsicoproductfacts.com/Home/Product?gtin=FTN-44316*01*14-02-L03', '마운틴 듀', False),
    # 공식 페이지가 스크립트로만 열려 직접 확인하지 못함(검색 결과 기준) → 검토 필요
    ('닥터페퍼', '큐리그 닥터페퍼', '탄산음료', '355ml (12 fl oz, 미국 제품 기준)', 41,
     'https://www.kdpproductfacts.com/product/a0e3h000003LJzZAAW/dr-pepper-12-fl-oz-us', '닥터 페퍼', True),
]

rows = [{'name_ko': n, 'brand': b, 'category': c, 'subcategory': '', 'serving': s, 'caffeine_mg': mg,
         'source': '제조사 공식 사이트 제품 사진·제품정보의 포장 표기(총 카페인 함량)', 'source_url': u,
         'checked_at': today, 'confidence': 'package_label', 'aliases': a, 'review': False}
        for n, b, c, s, mg, u, a in LABELS]
rows += [{'name_ko': n, 'brand': b, 'category': c, 'subcategory': '미국 제품 기준', 'serving': s, 'caffeine_mg': mg,
          'source': '제조사 본사 공식 제품정보(미국)', 'source_url': u,
          'checked_at': today, 'confidence': 'official_foreign', 'aliases': a, 'review': rv}
         for n, b, c, s, mg, u, a, rv in FOREIGN]

with open(OUT, 'w', newline='', encoding='utf-8-sig') as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0]))
    w.writeheader(); w.writerows(rows)
print(len(rows), 'rows ->', OUT)
