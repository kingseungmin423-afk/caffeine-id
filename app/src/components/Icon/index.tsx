// 피그마 icon/*, illust/*, CategoryIcon 컴포넌트. SVG는 scripts/build-icons.mjs가 만든다.
import type { SVGProps } from 'react'
import Search from '../../assets/icons/search.svg?react'
import ChevronLeft from '../../assets/icons/chevron-left.svg?react'
import IdCard from '../../assets/icons/id-card.svg?react'
import Info from '../../assets/icons/info.svg?react'
import CheckCircle from '../../assets/icons/check-circle.svg?react'
import Battery from '../../assets/icons/battery.svg?react'
import Home from '../../assets/icons/home.svg?react'
import Report from '../../assets/icons/report.svg?react'
import Can from '../../assets/illust/can.svg?react'
import EnergyDrink from '../../assets/illust/energy-drink.svg?react'
import IceCream from '../../assets/illust/ice-cream.svg?react'
import Cookie from '../../assets/illust/cookie.svg?react'
import Chocolate from '../../assets/illust/chocolate.svg?react'
import Soda from '../../assets/category/탄산음료.svg?react'
import Energy from '../../assets/category/에너지음료.svg?react'
import Coffee from '../../assets/category/커피.svg?react'
import Tea from '../../assets/category/차.svg?react'
import Frozen from '../../assets/category/빙과류.svg?react'
import Snack from '../../assets/category/과자류.svg?react'
import Choco from '../../assets/category/초콜릿.svg?react'
import Medicine from '../../assets/category/약.svg?react'
import styles from './Icon.module.css'
import type { Category } from '../../data/categories'

type SvgProps = SVGProps<SVGSVGElement>

const ICONS = {
  search: Search,
  'chevron-left': ChevronLeft,
  'id-card': IdCard,
  info: Info,
  'check-circle': CheckCircle,
  battery: Battery,
  home: Home,
  report: Report,
}
const ILLUSTS = { can: Can, 'energy-drink': EnergyDrink, 'ice-cream': IceCream, cookie: Cookie, chocolate: Chocolate }
const CATEGORY_ICONS: Record<Category, typeof Soda> = {
  탄산음료: Soda,
  에너지음료: Energy,
  커피: Coffee,
  차: Tea,
  빙과류: Frozen,
  과자류: Snack,
  초콜릿: Choco,
  약: Medicine,
}

export type IconName = keyof typeof ICONS
export type IllustName = keyof typeof ILLUSTS

/** 피그마 icon/<name>. 색은 CSS color(currentColor)로 칠한다. */
export function Icon({ name, ...rest }: { name: IconName } & SvgProps) {
  const C = ICONS[name]
  return <C aria-hidden {...rest} />
}

/** 피그마 illust/<name>. 색이 들어 있는 일러스트. */
export function Illust({ name, ...rest }: { name: IllustName } & SvgProps) {
  const C = ILLUSTS[name]
  return <C aria-hidden {...rest} />
}

/** 피그마 CategoryIcon (분류=<category>). */
export function CategoryIcon({ category, ...rest }: { category: Category } & SvgProps) {
  const C = CATEGORY_ICONS[category]
  return <C aria-hidden {...rest} />
}

/** 사진이 없는 음식의 사진 칸: 분류 아이콘을 가운데에 흐리게 (분류가 없으면 빈 칸 그대로) */
export function PhotoFallback({ category }: { category?: Category | null }) {
  return category ? <CategoryIcon category={category} className={styles.fallback} /> : null
}
