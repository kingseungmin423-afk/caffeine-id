// 앱에 보이는 고정 문구는 전부 여기에 둔다. (피그마 Components v2 기준)
// 음식 이름·함량처럼 데이터에서 오는 값은 넣지 않는다.

export const copy = {
  badge: {
    caffeine: '있음',
  },
  stamp: {
    caffeine: '있음',
    none: '없음',
    estimate: '추정',
    unissued: '미발급',
  },
  lanyard: {
    id: '신분증  ·  CAFFEINE ID',
    visitor: '임시출입증  ·  VISITOR PASS',
  },
  idCard: {
    title: '카페인',
    idMark: 'ID',
    temporary: '임시',
    unregistered: '미등록',
    unknownSerial: 'No. ——',
    unknownPhoto: '?',
    caffeineAmount: '카페인 함량',
    coffeeCups: '커피 환산',
    estimateAmount: '추정 함량 (약)',
    estimateBasis: '추정 근거',
    unknownAmount: '??mg',
    serial: (n: number) => `No. CF-${String(n).padStart(4, '0')}`,
  },
  idCardBack: {
    title: 'CAFFEINE ID',
    serving: '1회 제공량',
    caffeine: '카페인 함량',
    per100ml: '100ml당',
    issuer: '발급기관',
  },
  sectionHeader: {
    more: '전체 보기',
  },
  searchField: {
    placeholder: '음식 이름을 입력하세요',
  },
  dailyRatio: {
    label: '하루 권고량 대비 · 성인 400mg 기준',
    estimateNote: '추정치예요 · 실제 함량과 다를 수 있어요',
    source: (source: string) => `출처 · ${source}`,
  },
  photoUpload: {
    add: '+',
    hint: '포장지가 보이게 찍어주시면\n등록 후 사진으로 보여드려요',
  },
  loadingStep: {
    완료: '완료',
    진행중: '진행 중',
    대기: '대기',
  },
  tabBar: {
    홈: '홈',
    조회: '조회',
    제보: '제보',
    정보: '정보',
  },
  backHeader: {
    back: '뒤로 가기',
  },
  unknownThumb: '?',

  // ---------- 화면 ----------
  appName: '카페인 신원조회',
  welcome: {
    headline: '먹기 전에,\n신원부터 조회하세요.',
    sub: '음식을 조회하면 카페인 신분증이 발급돼요.',
    start: '신원조회 시작하기',
  },
  main: {
    headline: '잠깐,\n카페인 좀 볼게요',
    sub: '먹기 전에 음식의 카페인을 조회해 보세요.',
    category: '카테고리',
    recent: '최근 조회',
    recentEmpty: '아직 조회한 음식이 없어요. 음식을 검색해 보세요.',
    top5: '많이 찾는 숨은 카페인 TOP 5',
    quizLabel: '카페인 비교 퀴즈',
    /** aAnd: '콜라와', '녹차과'처럼 조사까지 붙인 앞 음식 */
    quizQuestion: (aAnd: string, b: string) => `${aAnd} ${b},\n카페인이 더 많은 쪽은?`,
    quizVs: 'VS',
    quizHint: '고르면 정답과 카페인 차이를 알려드려요',
    quizResult: (correct: boolean, more: string, diff: string) =>
      diff === '0mg' ? '두 음식의 카페인이 같아요' : `${correct ? '정답!' : '아쉬워요.'} ${more} 쪽이 ${diff} 더 많아요`,
  },
  category: {
    title: '카테고리',
    sub: '분류별로 숨은 카페인을 찾아보세요.',
    examples: {
      탄산음료: '콜라 · 마운틴듀',
      에너지음료: '에너지드링크',
      커피: '캔커피 · 라떼',
      차: '녹차 · 홍차',
      빙과류: '녹차맛 · 바닐라',
      과자류: '말차 쿠키',
      초콜릿: '말차 초콜릿',
      약: '두통약 · 감기약',
    },
  },
  categoryDetail: {
    back: '카테고리',
    sub: '조회한 음식은 사진이 붙은 신분증으로 보여요',
    count: (n: number) => `전체 ${n}장`,
    sort: '가나다순',
    hint: '미발급 카드를 누르면 바로 신원조회를 시작해요',
  },
  search: {
    all: (n: number) => `전체 ${n}`,
    chip: (category: string, n: number) => `${category} ${n}`,
    resultCount: (n: number) => `검색 결과 ${n}건`,
    sort: '정확도순',
    registerQuestion: '찾는 음식이 없나요?  ',
    registerLink: '신원 등록 신청하기',
    estimate: (q: string) => `'${q}' 비슷한 음식으로 추정하기`,
  },
  loading: {
    stepLabel: (n: number) => `신분증 검사  ·  ${n} / 3`,
    steps: ['신분증 인식', '성분 대조', '카페인 판정'],
    headlines: ['신분증을 확인하고 있어요', '성분을 대조하고 있어요', '카페인을 판정하고 있어요'],
  },
  result: {
    title: '조회 결과',
    tapToBack: '카드를 탭하면 뒷면으로 넘어가요',
    tapToFront: '카드를 탭하면 앞면으로 넘어가요',
    info: '카페인 정보',
    related: '관련 음식',
    coffeeCups: (cups: string) => `${cups}잔`,
    notFound: '신원을 찾을 수 없어요',
    /** 05 요약 문장. ratio = 카페인 ÷ 아메리카노 1잔.
     *  줄은 말 덩어리 사이에서만 바뀌도록 덩어리 안 띄어쓰기를 붙여 둔다('약 / 3분의 1잔' 방지).
     *  짧은 이름이면 피그마처럼 '…1잔만큼 / 카페인이 들어 있어요.' 두 줄이 된다 */
    summary: (name: string, coffee: string, ratio: number) => {
      const g = (s: string) => s.replace(/ /g, ' ')
      if (ratio === 0) return `${name}에는 ${g('카페인이 들어 있지 않아요.')}`
      const tail = g('카페인이 들어 있어요.')
      // 0.75잔 이상은 '1분의 1잔'이 되지 않도록 '약 1잔'으로 (0.5잔 단위 반올림)
      if (ratio >= 0.75) return `${name}에는 ${coffee} ${g(`약 ${Math.round(ratio * 2) / 2}잔만큼`)} ${tail}`
      const n = Math.round(1 / ratio)
      if (n > 10) return `${name}에는 ${coffee} ${g('1잔의 10분의 1보다')} ${g('적은 카페인이 들어 있어요.')}`
      return `${name}에는 ${coffee} ${g(`약 ${n}분의 1잔만큼`)} ${tail}`
    },
    percent: (p: number) => `${p < 10 ? Math.round(p * 10) / 10 : Math.round(p)}%`,
    photoCredit: '사진',
  },
  estimate: {
    title: '조회 결과',
    caption: '등록된 신원이 없어 유사한 음식의 기록으로 추정했어요.',
    noMatch: '비슷한 음식의 기록도 찾지 못했어요.',
    info: '카페인 정보',
    basis: '추정 근거',
    basisCount: (n: number) => `${n}건`,
    percentRange: (a: string, b: string) => (a === b ? `약 ${a}` : `약 ${a.replace('%', '')}–${b}`),
    mgRange: (a: string, b: string) => (a === b ? a : `${a.replace('mg', '')}–${b}`),
    register: '신원 등록 신청하기',
  },
  report: {
    title: '신원 등록 신청',
    headline: '카페인 신원 등록 신청서',
    sub: '조회되지 않은 음식의 정보를 알려주세요.',
    name: '음식 이름',
    namePlaceholder: '음식 이름을 입력하세요',
    maker: '제조사 (선택)',
    makerPlaceholder: '제조사를 입력하세요',
    category: '분류',
    other: '기타',
    photo: '사진 (선택)',
    submit: '신청서 제출',
    sending: '보내는 중…',
    /** 접수 결과 화면: sent·queued·limited·failed (store/reports.ts ReportResult) */
    done: {
      sent: { headline: '신청서를 접수했어요', sub: '확인 후 신원을 등록해 드릴게요.' },
      queued: { headline: '신청서를 보관했어요', sub: '인터넷에 연결되면 자동으로 보내 드릴게요.' },
      limited: { headline: '오늘 신청은 여기까지예요', sub: '하루에 5건까지 신청할 수 있어요.\n내일 다시 신청해 주세요.' },
      failed: { headline: '신청서를 보내지 못했어요', sub: '잠시 후 다시 신청해 주세요.' },
    },
    home: '홈으로 돌아가기',
  },
  info: {
    headline: '발급 규정',
    articles: [
      { heading: '제1조 목적', body: '음식에 들어 있는 카페인 정보를 신분증 형식으로 발급해, 먹기 전에 확인할 수 있도록 돕습니다.' },
      {
        heading: '제2조 데이터 기준',
        body: '제조사 공식 제품정보 → 식약처 식품영양성분 DB → 해외 공공자료 순으로 확인하며, 1회 제공량을 기본 단위로 합니다. 하루 권고량 대비 비율은 식약처 권고 성인 기준 400mg으로 계산합니다. 출처는 신분증 뒷면에 표기합니다.',
      },
      {
        heading: '제3조 판정과 추정',
        body: '카페인이 들어 있는 음식은 ‘있음’, 카페인이 없는 음식은 ‘없음’으로 판정합니다. 등록되지 않은 음식은 유사 음식의 기록으로 추정해 임시 출입증으로 발급합니다.',
      },
      { heading: '제4조 발급', body: '조회한 음식은 사진이 붙은 신분증으로, 아직 조회하지 않은 음식은 사진과 함량을 가린 미발급 카드로 보여줍니다.' },
      { heading: '제5조 고지', body: '이 정보는 참고용이며 의학적 판단을 대신하지 않습니다. 카페인에 민감하거나 임신 중이라면 섭취량에 유의하세요.' },
    ],
    footer: '2026.10.07 · 카페인 신원조회청',
    photoCredits: '사진 출처',
    open: (n: number) => `펼치기 (${n}장)`,
    close: '접기',
  },
  /** 설치 안내 팝업 (디자인을 받기 전 임시 문구) */
  install: {
    prompt: {
      title: '홈 화면에 앱을 추가하세요',
      body: '설치하면 인터넷이 없어도\n바로 카페인을 조회할 수 있어요.',
      action: '설치하기',
    },
    ios: {
      title: '홈 화면에 추가하기',
      body: '아래쪽 공유 버튼을 누른 뒤\n‘홈 화면에 추가’를 선택하세요.',
      action: '확인',
    },
    /** 카카오톡·네이버 등 다른 앱 안에서 열었을 때. 그 앱마다 메뉴가 달라서 메뉴 대신 주소 복사로 안내한다 */
    inApp: {
      title: '사파리나 크롬에서 열어 주세요',
      body: (app: string) => `${app} 안에서는 앱을 설치할 수 없어요.\n주소를 복사해 사파리나 크롬에 붙여 넣어 주세요.`,
      action: '주소 복사하기',
      copied: '주소를 복사했어요',
    },
    inAppDefault: '지금 보고 있는 앱',
    later: '나중에',
  },
} as const
