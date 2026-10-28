// 피그마 PhotoUpload. 사진을 고르면 onSelect로 파일을 넘기고, previewSrc가 있으면 칸 안에 보여 준다.
import { copy } from '../../copy'
import { DashedOutline } from '../DashedOutline'
import styles from './PhotoUpload.module.css'

type Props = { onSelect: (file: File) => void; previewSrc?: string; label: string }

export function PhotoUpload({ onSelect, previewSrc, label }: Props) {
  return (
    <div className={styles.root}>
      <label className={styles.add}>
        <input
          type="file"
          accept="image/*"
          className={styles.file}
          aria-label={label}
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) onSelect(f)
            e.target.value = ''
          }}
        />
        {previewSrc ? <img src={previewSrc} alt="" className={styles.preview} /> : <span className={styles.plus}>{copy.photoUpload.add}</span>}
        <DashedOutline className={styles.dash} />
      </label>
      <p className={styles.hint}>{copy.photoUpload.hint}</p>
    </div>
  )
}
