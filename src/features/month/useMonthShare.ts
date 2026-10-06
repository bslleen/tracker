import { toPng } from 'html-to-image'
import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { SHARE_HEIGHT, SHARE_WIDTH } from './MonthShareCard'

export function useMonthShare(month: string) {
  const nodeRef = useRef<HTMLDivElement>(null)
  const [isSharing, setIsSharing] = useState(false)

  async function share() {
    const node = nodeRef.current
    if (!node || isSharing) return
    setIsSharing(true)

    try {
      const dataUrl = await toPng(node, { width: SHARE_WIDTH, height: SHARE_HEIGHT, pixelRatio: 1 })
      const filename = `chunks-${month}.png`

      const canShareFiles = typeof navigator.canShare === 'function' && typeof navigator.share === 'function'
      if (canShareFiles) {
        const blob = await (await fetch(dataUrl)).blob()
        const file = new File([blob], filename, { type: 'image/png' })
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], title: 'Chunks' })
          return
        }
      }

      const link = document.createElement('a')
      link.href = dataUrl
      link.download = filename
      link.click()
    } catch (error) {
      // AbortError fires when the user just cancels the native share sheet — not a real failure.
      if (error instanceof DOMException && error.name === 'AbortError') return
      toast.error('Could not create the share image. Try again.')
    } finally {
      setIsSharing(false)
    }
  }

  return { nodeRef, isSharing, share }
}
