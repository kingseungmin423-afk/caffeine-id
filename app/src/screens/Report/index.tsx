// 08 음식 제보 (신원 등록 신청, /report?name=). 보내기·오프라인 보관·봇 막기는 store/reports.ts.
import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { BackHeader } from '../../components/BackHeader'
import { Button } from '../../components/Button'
import { Chip } from '../../components/Chip'
import { PhotoUpload } from '../../components/PhotoUpload'
import { TextField } from '../../components/TextField'
import { copy } from '../../copy'
import { CATEGORIES } from '../../data/categories'
import { TEXT_MAX } from '../../config/report'
import { submitReport, type ReportResult } from '../../store/reports'
import { paths } from '../links'
import { Screen } from '../Screen'
import { useBack } from '../useBack'
import styles from './Report.module.css'

const OPTIONS = [...CATEGORIES, copy.report.other]

export default function Report() {
  const [params] = useSearchParams()
  const back = useBack()
  const navigate = useNavigate()
  const [name, setName] = useState(params.get('name') ?? '')
  const [maker, setMaker] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState<string>()
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState<ReportResult | null>(null)
  // 봇 막기: 화면을 연 시각, 사람에게는 안 보이는 칸
  const [openedAt] = useState(() => Date.now())
  const [trap, setTrap] = useState('')

  useEffect(() => {
    if (!photo) return setPreview(undefined)
    const url = URL.createObjectURL(photo)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [photo])

  const canSubmit = name.trim() !== '' && category !== null && !sending

  const result = done && copy.report.done[done]

  return (
    // 접수 뒤에는 뒤로가기·탭바 없이 '홈으로 돌아가기'만 둔다 (피그마에 없는 상태: 온보딩처럼 버튼을 아래에)
    <Screen theme="Light" tab={done ? undefined : '제보'} className={done ? styles.doneScreen : styles.screen} meta={copy.seo.report}>
      {!done && <BackHeader theme="Light" title={copy.report.title} onBack={back} />}
      <h1 className={result ? styles.doneHeadline : styles.headline}>{result ? result.headline : copy.report.headline}</h1>
      <p className={result ? styles.doneSub : styles.sub}>{result ? result.sub : copy.report.sub}</p>

      {!done && (
        <form
          className={styles.form}
          onSubmit={async (e) => {
            e.preventDefault()
            if (!canSubmit) return
            setSending(true)
            const r = await submitReport({ name: name.trim(), maker: maker.trim(), category: category!, photo }, { openedAt, trap })
            setSending(false)
            setDone(r)
          }}
        >
          <TextField label={copy.report.name} value={name} placeholder={copy.report.namePlaceholder} onChange={(e) => setName(e.target.value)} maxLength={TEXT_MAX} required />
          <div className={styles.field}>
            <TextField label={copy.report.maker} value={maker} placeholder={copy.report.makerPlaceholder} onChange={(e) => setMaker(e.target.value)} maxLength={TEXT_MAX} />
          </div>
          <fieldset className={styles.group}>
            <legend className={styles.label}>{copy.report.category}</legend>
            <div className={styles.chips}>
              {OPTIONS.map((c) => (
                <Chip key={c} selected={category === c} onClick={() => setCategory((cur) => (cur === c ? null : c))}>
                  {c}
                </Chip>
              ))}
            </div>
          </fieldset>
          <div className={styles.group}>
            <p className={styles.label}>{copy.report.photo}</p>
            <div className={styles.photo}>
              <PhotoUpload label={copy.report.photo} onSelect={setPhoto} previewSrc={preview} />
            </div>
          </div>
          {/* 사람에게는 안 보이는 칸: 봇이 채우면 조용히 버린다 */}
          <input className={styles.trap} name="website" value={trap} onChange={(e) => setTrap(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden />
          <div className={styles.submit}>
            <Button variant="Navy" type="submit" disabled={!canSubmit}>
              {sending ? copy.report.sending : copy.report.submit}
            </Button>
          </div>
        </form>
      )}

      {done && (
        <>
          <div className={styles.spacer} />
          <Button variant="Navy" onClick={() => navigate(paths.main, { replace: true })}>
            {copy.report.home}
          </Button>
        </>
      )}
    </Screen>
  )
}
