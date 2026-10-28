"""assets/photos/*.jpg 의 배경을 지워 제품만 남긴 투명 PNG를 만든다 → assets/photos/cutout/{key}.png
손·그릇·다른 물건이 같이 찍힌 사진은 CROP으로 먼저 잘라낸 뒤 배경을 지운다.

배경 제거·자르기는 원본을 '수정'한 것이므로
- CC BY: 출처와 함께 '수정함'을 표시해야 하고
- CC BY-SA: 수정한 사진도 같은 CC BY-SA로 공개해야 한다.
credits.csv 의 modified 칸에 수정 내용을 적는다.

python cutout_photos.py           # 전부
python cutout_photos.py key1 key2 # 일부만 다시
"""
import csv, json, os, sys
from PIL import Image
from rembg import new_session, remove

HERE = os.path.dirname(os.path.abspath(__file__))
PHOTOS = os.path.join(HERE, '..', '..', 'assets', 'photos')
OUT = os.path.join(PHOTOS, 'cutout')
SIZE = 1000

# 배경을 지우기 전에 남길 영역 (왼쪽, 위, 오른쪽, 아래 — 사진 크기 대비 비율)
CROP = {
    'cafe_mocha': (0.16, 0.12, 0.6, 1.0),         # 컵 두 잔 중 앞쪽 한 잔, 과자 막대 빼기
    'chocolate_icecream': (0.25, 0.0, 1.0, 1.0),  # 왼쪽 숟가락 빼기
    'brand_red_bull': (0.63, 0.0, 1.0, 1.0),      # 유리잔 빼고 캔만
}

# 기본은 경계가 가장 깔끔한 BiRefNet. 특정 사진만 다른 모델을 쓰려면 여기에 적는다
DEFAULT_MODEL = 'birefnet-general'
MODEL = {}

# 배경 제거 없이 자르기만 하는 사진 (예: 초콜릿 더미처럼 한 덩어리로 오려낼 수 없는 것)
NO_REMBG = set()


def trim_square(im):
    """투명 여백을 잘라내고 정사각형 가운데에 놓는다."""
    box = im.getchannel('A').point(lambda a: 255 if a > 20 else 0).getbbox()
    if box:
        im = im.crop(box)
    side = int(max(im.size) * 1.08)
    canvas = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    canvas.paste(im, ((side - im.width) // 2, (side - im.height) // 2), im)
    return canvas.resize((SIZE, SIZE), Image.LANCZOS)


def main(only):
    os.makedirs(OUT, exist_ok=True)
    sessions = {}

    def session_for(key):
        name = MODEL.get(key, DEFAULT_MODEL)
        if name not in sessions:
            sessions[name] = new_session(name)
        return sessions[name]
    rows = json.load(open(os.path.join(PHOTOS, 'credits.json'), encoding='utf-8'))
    for r in rows:
        key = r['photo_key']
        if only and key not in only:
            continue
        im = Image.open(os.path.join(PHOTOS, f'{key}.jpg')).convert('RGB')
        done = []
        if key in CROP:
            l, t, rr, b = CROP[key]
            im = im.crop((int(l * im.width), int(t * im.height), int(rr * im.width), int(b * im.height)))
            done.append('자름')
        if key in NO_REMBG:
            cut = im.convert('RGBA')
        else:
            cut = remove(im, session=session_for(key))
            done.append('배경 제거')
        trim_square(cut).save(os.path.join(OUT, f'{key}.png'))
        r['modified'] = ', '.join(done)
        r['cutout_file'] = f'assets/photos/cutout/{key}.png'
        print(key, r['modified'], flush=True)
    json.dump(rows, open(os.path.join(PHOTOS, 'credits.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    with open(os.path.join(PHOTOS, 'credits.csv'), 'w', newline='', encoding='utf-8-sig') as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0])); w.writeheader(); w.writerows(rows)


if __name__ == '__main__':
    main(sys.argv[1:])
