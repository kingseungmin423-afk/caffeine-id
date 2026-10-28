// 설치 안내 팝업 자리 (피그마 디자인을 받기 전 임시: 기존 Button·글자 스타일·토큰만 조합).
// 02 메인에 놓는다 = 온보딩을 마친 뒤부터. 언제 띄울지는 store/install.ts가 정한다.
import { useState } from 'react'
import { createPortal } from 'react-dom'
import { Button } from '../components/Button'
import { copy } from '../copy'
import { dismissInstall, inAppName, promptInstall, useInstallKind } from '../store/install'
import styles from './InstallPrompt.module.css'

const t = copy.install

export function InstallPrompt() {
  const kind = useInstallKind()
  const [copied, setCopied] = useState(false)
  if (!kind) return null

  const title = t[kind].title
  const body = kind === 'inApp' ? t.inApp.body(inAppName() ?? t.inAppDefault) : t[kind].body
  const copyAddress = async () => {
    const url = location.origin
    try {
      await navigator.clipboard.writeText(url)
      return setCopied(true)
    } catch {
      // https가 아니거나 막힌 브라우저: 예전 방식(보이지 않는 입력칸을 골라 복사)으로 한 번 더
    }
    const field = document.createElement('textarea')
    field.value = url
    field.readOnly = true
    field.style.position = 'fixed'
    field.style.opacity = '0'
    document.body.append(field)
    field.select()
    field.setSelectionRange(0, url.length)
    if (document.execCommand('copy')) setCopied(true)
    field.remove()
  }

  // 화면은 들어올 때 움직임(transform) 때문에 fixed 기준이 되므로, 앱 맨 바깥(#root)에 그린다
  return createPortal(
    <div className={styles.overlay} onClick={dismissInstall}>
      <section className={styles.sheet} role="dialog" aria-modal="true" aria-labelledby="install-title" onClick={(e) => e.stopPropagation()}>
        <h2 id="install-title" className={styles.title}>
          {title}
        </h2>
        <p className={styles.body}>{body}</p>
        <div className={styles.actions}>
          {kind === 'prompt' && (
            <Button variant="Navy" onClick={promptInstall}>
              {t.prompt.action}
            </Button>
          )}
          {kind === 'inApp' && (
            <Button variant="Navy" onClick={copyAddress} disabled={copied}>
              {copied ? t.inApp.copied : t.inApp.action}
            </Button>
          )}
          {kind === 'ios' ? (
            <Button variant="Navy" onClick={dismissInstall}>
              {t.ios.action}
            </Button>
          ) : (
            <Button variant="White" onClick={dismissInstall}>
              {t.later}
            </Button>
          )}
        </div>
      </section>
    </div>,
    document.getElementById('root')!,
  )
}
