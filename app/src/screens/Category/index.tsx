// 02-1 카테고리 (/category)
import { useNavigate } from 'react-router-dom'
import { BackHeader } from '../../components/BackHeader'
import { CategoryCard } from '../../components/CategoryCard'
import { copy } from '../../copy'
import { CATEGORIES } from '../../data/categories'
import { paths } from '../links'
import { Screen } from '../Screen'
import { useBack } from '../useBack'
import styles from './Category.module.css'

export default function Category() {
  const navigate = useNavigate()
  const back = useBack()
  return (
    <Screen theme="Light" tab="조회" className={styles.screen} meta={copy.seo.category}>
      <BackHeader theme="Light" onBack={back} />
      <h1 className={styles.title}>{copy.category.title}</h1>
      <p className={styles.sub}>{copy.category.sub}</p>
      <div className={styles.grid}>
        {CATEGORIES.map((c) => (
          <CategoryCard key={c} category={c} examples={copy.category.examples[c]} onClick={() => navigate(paths.categoryDetail(c))} />
        ))}
      </div>
    </Screen>
  )
}
