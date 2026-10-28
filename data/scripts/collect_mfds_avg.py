"""식약처 정보그림 뉴스 '식품통계로 알아보는 음료류 이야기'(2021-01-21)의 유형별 평균 카페인 함량.
특정 제품이 아니라 국내 유통 제품의 유형 평균이다. 제품 데이터가 없을 때 대표값으로 쓴다.
"""
import csv, datetime, os

OUT = os.path.join(os.path.dirname(__file__), '..', 'raw', 'mfds_average.csv')
URL = 'https://www.mfds.go.kr/brd/m_629/view.do?seq=28'
today = datetime.date.today().isoformat()

ITEMS = [
    ('녹차(티백)', '차', '1잔(티백 1개)', 22, '녹차 한잔'),
    ('콜라(국내 평균)', '탄산음료', '250ml', 27, '콜라;코카콜라;펩시'),
    ('커피우유(국내 평균)', '우유·유제품', '200ml', 47, '커피우유;커피맛우유'),
    ('커피믹스(국내 평균)', '커피', '1봉(250ml로 타서)', 56, '믹스커피;맥심;모카골드'),
    ('에너지음료(국내 평균)', '에너지음료', '250ml', 80, '에너지드링크'),
    ('커피음료(국내 평균)', '커피(RTD)', '250ml', 103, '캔커피;편의점 커피'),
    ('전문점 커피(국내 평균)', '카페 음료', '250ml', 132, '카페 커피;테이크아웃 커피'),
]

rows = [{'name_ko': n, 'brand': '', 'category': c, 'subcategory': '유형 평균', 'serving': s,
         'caffeine_mg': mg, 'source': '식약처 정보그림 뉴스 「식품통계로 알아보는 음료류 이야기」 2021-01-21',
         'source_url': URL, 'checked_at': today, 'confidence': 'official_average', 'aliases': a}
        for n, c, s, mg, a in ITEMS]

with open(OUT, 'w', newline='', encoding='utf-8-sig') as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0]))
    w.writeheader(); w.writerows(rows)
print(len(rows), 'rows ->', OUT)
