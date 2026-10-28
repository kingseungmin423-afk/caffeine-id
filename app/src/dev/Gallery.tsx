// 개발용: Components v2와 나란히 비교하는 컴포넌트 모음 화면. 문구는 피그마 예시 그대로(개발용이라 copy.ts에 넣지 않음).
import { useState, type ReactNode } from 'react'
import { Article } from '../components/Article'
import { BackHeader } from '../components/BackHeader'
import { Badge } from '../components/Badge'
import { Button } from '../components/Button'
import { CategoryCard } from '../components/CategoryCard'
import { CategoryItem } from '../components/CategoryItem'
import { CategoryThumb } from '../components/CategoryThumb'
import { Chip } from '../components/Chip'
import { DailyRatio } from '../components/DailyRatio'
import { EvidenceRow } from '../components/EvidenceRow'
import { FoodRow } from '../components/FoodRow'
import { IDCard } from '../components/IDCard'
import { IDCardBack } from '../components/IDCardBack'
import { IDCardMini } from '../components/IDCardMini'
import { Lanyard } from '../components/Lanyard'
import { LoadingStep } from '../components/LoadingStep'
import { PhotoUpload } from '../components/PhotoUpload'
import { ProductThumb } from '../components/ProductThumb'
import { QuizOption } from '../components/QuizOption'
import { RankRow } from '../components/RankRow'
import { RelatedCard } from '../components/RelatedCard'
import { SearchField } from '../components/SearchField'
import { SectionHeader } from '../components/SectionHeader'
import { TabBar, type Tab } from '../components/TabBar'
import { TextField } from '../components/TextField'
import { compareLayout } from './compareLayout'
import styles from './Gallery.module.css'

Object.assign(window, { compareLayout })

const noop = () => {}

function Block({ title, dark, children }: { title: string; dark?: boolean; children: ReactNode }) {
  return (
    <section className={dark ? styles.dark : styles.light} data-block={title}>
      <h2 className={styles.blockTitle}>{title}</h2>
      <div className={styles.items}>{children}</div>
    </section>
  )
}

export default function Gallery() {
  const [search, setSearch] = useState('콜라')
  const [tab, setTab] = useState<Tab>('조회')
  return (
    <main className={styles.root}>
      <Block title="Badge · ProductThumb · Chip · CategoryThumb">
        <Badge />
        <ProductThumb size="S" 상태="조회" />
        <ProductThumb size="M" 상태="조회" />
        <ProductThumb size="M" 상태="미조회" />
        <ProductThumb size="L" 상태="조회" src="/photos/brand_coca_cola.webp" />
        <Chip selected>전체 4</Chip>
        <Chip selected={false}>탄산음료 3</Chip>
        <CategoryThumb size="L" category="탄산음료" />
        <CategoryThumb size="M" category="탄산음료" />
      </Block>

      <Block title="Lanyard · Button" dark>
        <Lanyard theme="Dark" length="Long" />
        <Lanyard theme="Light" length="Long" />
        <Lanyard theme="Visitor" length="Long" />
        <Lanyard theme="Dark" length="Short" />
        <Button variant="White">신원조회 시작하기</Button>
      </Block>
      <Block title="Button Navy">
        <Button variant="Navy">신청서 제출</Button>
      </Block>

      <Block title="SearchField · TextField · SectionHeader · BackHeader · PhotoUpload">
        <SearchField value="" onChange={noop} />
        <SearchField value={search} onChange={(e) => setSearch(e.target.value)} />
        <TextField label="음식 이름" value="말차 쿠키" onChange={noop} />
        <TextField label="제조사 (선택)" value="" placeholder="제조사를 입력하세요" onChange={noop} />
        <SectionHeader theme="Light" title="최근 조회" onMore={noop} />
        <BackHeader theme="Light" title="신원 등록 신청" onBack={noop} />
        <PhotoUpload label="사진 (선택)" onSelect={noop} />
      </Block>

      <Block title="SectionHeader · BackHeader · DailyRatio (Dark)" dark>
        <SectionHeader theme="Dark" title="관련 음식" onMore={noop} />
        <BackHeader theme="Dark" title="조회 결과" onBack={noop} />
        <DailyRatio type="확정" valueLabel="8.5%" ratio={0.085} source="코카-콜라 공식 제품정보" />
        <DailyRatio type="추정" valueLabel="약 2.5–5%" from={0.025} to={0.05} />
      </Block>

      <Block title="FoodRow · RankRow · CategoryItem · CategoryCard · QuizOption · Article">
        <FoodRow 상태="조회" name="펩시 콜라" meta="탄산음료 · 355ml" amount="38mg" hasCaffeine onClick={noop} />
        <FoodRow 상태="미조회" name="코카콜라 제로" meta="탄산음료 · 355ml" onClick={noop} />
        <RankRow rank={1} highlight name="에너지드링크" meta="에너지음료 · 1캔" amount="100mg" />
        <RankRow rank={2} highlight={false} name="마운틴듀" meta="탄산음료 · 355ml" amount="54mg" />
        <div className={styles.grid4}>
          <CategoryItem category="탄산음료" />
          <CategoryItem category="에너지음료" />
          <CategoryItem category="커피" />
          <CategoryItem category="차" />
        </div>
        <div className={styles.grid2}>
          <CategoryCard category="탄산음료" examples="콜라 · 마운틴듀" />
          <CategoryCard category="약" examples="두통약 · 감기약" />
        </div>
        <div className={styles.quiz}>
          <QuizOption name="콜라" sub="355ml 한 캔" />
        </div>
        <Article heading="제1조 목적">음식에 들어 있는 카페인 정보를 신분증 형식으로 발급해, 먹기 전에 확인할 수 있도록 돕습니다.</Article>
      </Block>

      <Block title="EvidenceRow · LoadingStep" dark>
        <EvidenceRow name="녹차 아이스크림" amount="30mg" />
        <LoadingStep 상태="완료" label="신분증 인식" />
        <LoadingStep 상태="진행중" label="성분 대조" />
        <LoadingStep 상태="대기" label="카페인 판정" />
      </Block>

      <Block title="IDCard · IDCardBack" dark>
        <div className={styles.row}>
          <IDCard state="확인" name="코카콜라" meta="탄산음료 · 355ml" serial="No. CF-0001" amount="34mg" coffeeCups="0.23잔" />
          <IDCard state="검사중" />
          <IDCard state="추정" name="말차 쿠키" meta="과자류 · 1봉" amountRange="10–20mg" basis="2건" />
          <IDCardBack 정보="표시" info={{ serving: '355ml', caffeine: '34mg', per100ml: '9.6mg', issuer: '코카-콜라 공식 제품정보' }} />
          <IDCardBack 정보="숨김" />
        </div>
      </Block>

      <Block title="IDCardMini · RelatedCard" dark>
        <div className={styles.grid2}>
          <IDCardMini 상태="발급" name="마운틴듀" serving="355ml" serial="No. CF-0005" amount="54mg" />
          <IDCardMini 상태="미발급" name="닥터페퍼" serving="355ml" />
        </div>
        <div className={styles.row}>
          <RelatedCard 상태="조회" category="탄산음료" name="펩시 콜라" amount="38mg" />
          <RelatedCard 상태="미조회" category="탄산음료" name="코카콜라 제로" />
        </div>
      </Block>

      <Block title="TabBar Light">
        <TabBar theme="Light" active={tab} onSelect={setTab} />
        <TabBar theme="Light" active="제보" onSelect={setTab} />
      </Block>
      <Block title="TabBar Dark" dark>
        <TabBar theme="Dark" active="조회" onSelect={setTab} />
      </Block>
    </main>
  )
}
