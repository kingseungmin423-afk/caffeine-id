"""USDA FoodData Central에서 카페인(nutrient id 1057) 값이 있는 모든 식품을 추출한다.
데이터셋: SR Legacy(2018-04), Foundation(2026-04), FNDDS Survey(2024-10)
원본 zip은 ../cache/ 에 받는다(용량 약 13MB, 저장소에는 올리지 않음).
결과: ../raw/usda_caffeine_all.csv (100g당 mg)
"""
import csv, json, os, urllib.request, zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, '..', 'cache')
OUT = os.path.join(HERE, '..', 'raw', 'usda_caffeine_all.csv')
BASE = 'https://fdc.nal.usda.gov/fdc-datasets/'
FILES = {
    'sr': 'FoodData_Central_sr_legacy_food_csv_2018-04',
    'foundation': 'FoodData_Central_foundation_food_csv_2026-04-30',
    'survey': 'FoodData_Central_survey_food_json_2024-10-31',
}


def fetch(name):
    os.makedirs(CACHE, exist_ok=True)
    z = os.path.join(CACHE, name + '.zip')
    d = os.path.join(CACHE, name)
    if not os.path.exists(z):
        urllib.request.urlretrieve(BASE + name + '.zip', z)
    if not os.path.exists(d):
        zipfile.ZipFile(z).extractall(d)
    return d


def find(root, filename):
    for dp, _, fs in os.walk(root):
        if filename in fs:
            return os.path.join(dp, filename)
    raise FileNotFoundError(filename)


def from_csv(root, source):
    rd = lambda f: csv.DictReader(open(find(root, f), encoding='utf-8'))
    caf_ids = {r['id'] for r in rd('nutrient.csv') if r['name'].strip().lower() == 'caffeine'}
    cats = {r['id']: r['description'] for r in rd('food_category.csv')}
    foods = {r['fdc_id']: r for r in rd('food.csv')}
    portions = {}
    for r in rd('food_portion.csv'):
        portions.setdefault(r['fdc_id'], []).append(
            f"{r.get('amount', '')} {r.get('modifier', '') or r.get('portion_description', '')} = {r['gram_weight']}g".strip())
    out = []
    for r in rd('food_nutrient.csv'):
        if r['nutrient_id'] in caf_ids and r['fdc_id'] in foods:
            f = foods[r['fdc_id']]
            out.append({'source': source, 'fdc_id': r['fdc_id'], 'description': f['description'],
                        'category': cats.get(f.get('food_category_id', ''), ''),
                        'caffeine_mg_per_100g': float(r['amount']),
                        'portions': ' | '.join(portions.get(r['fdc_id'], [])[:4])})
    return out


def from_survey(root):
    data = json.load(open(find(root, 'surveyDownload.json'), encoding='utf-8'))
    out = []
    for f in data['SurveyFoods']:
        caf = [x for x in f.get('foodNutrients', []) if x.get('nutrient', {}).get('name', '').lower() == 'caffeine']
        if not caf:
            continue
        por = [f"{p.get('portionDescription', '')} = {p.get('gramWeight')}g" for p in f.get('foodPortions', [])][:4]
        out.append({'source': 'USDA FNDDS 2021-2023', 'fdc_id': str(f['fdcId']), 'description': f['description'],
                    'category': (f.get('wweiaFoodCategory') or {}).get('wweiaFoodCategoryDescription', ''),
                    'caffeine_mg_per_100g': float(caf[0].get('amount', 0)), 'portions': ' | '.join(por)})
    return out


if __name__ == '__main__':
    rows = from_csv(fetch(FILES['sr']), 'USDA SR Legacy 2018-04')
    rows += from_csv(fetch(FILES['foundation']), 'USDA Foundation 2026-04')
    rows += from_survey(fetch(FILES['survey']))
    with open(OUT, 'w', newline='', encoding='utf-8-sig') as fh:
        w = csv.DictWriter(fh, fieldnames=list(rows[0]))
        w.writeheader(); w.writerows(rows)
    print(len(rows), 'rows,', sum(r['caffeine_mg_per_100g'] > 0 for r in rows), 'with caffeine >0 ->', OUT)
