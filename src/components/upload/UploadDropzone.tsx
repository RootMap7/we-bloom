import { motion } from 'framer-motion'
import { useCallback, useRef, useState, type DragEvent } from 'react'
import { cn } from '@/lib/cn'
import { transition } from '@/lib/motion'
import { Button } from '../ui/Button'

/**
 * Upload states — PRODUCT.md §5. Empty, dragging, selected and error live
 * here; parsing/analysing/complete are owned by the store and rendered by the
 * route, because they outlive this component's interaction.
 */
export function UploadDropzone({
  onFile,
  disabled,
}: {
  onFile: (file: File) => void
  disabled?: boolean
}) {
  const [dragging, setDragging] = useState(false)
  const [rejected, setRejected] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  // dragenter/dragleave fire for every child element; counting keeps the
  // highlight from flickering as the pointer moves across the zone.
  const dragDepth = useRef(0)

  const accept = useCallback(
    (file: File | undefined) => {
      if (!file) return
      const name = file.name.toLowerCase()
      if (!name.endsWith('.txt') && !name.endsWith('.zip')) {
        setRejected(
          `"${file.name}" isn't a WhatsApp export. Look for the .txt file the export produced.`,
        )
        return
      }
      setRejected(null)
      onFile(file)
    },
    [onFile],
  )

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    dragDepth.current = 0
    setDragging(false)
    if (disabled) return
    accept(e.dataTransfer.files?.[0])
  }

  return (
    <div>
      <div
        onDragEnter={(e) => {
          e.preventDefault()
          dragDepth.current++
          if (!disabled) setDragging(true)
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => {
          e.preventDefault()
          dragDepth.current = Math.max(0, dragDepth.current - 1)
          if (dragDepth.current === 0) setDragging(false)
        }}
        onDrop={onDrop}
        className={cn(
          'relative rounded-card border-2 border-dashed px-6 py-12 text-center transition-colors duration-250 ease-bloom sm:py-16',
          dragging ? 'border-clay-500 bg-clay-50' : 'border-surface-line bg-surface',
          disabled && 'opacity-60',
        )}
      >
        <motion.div
          animate={{ scale: dragging ? 1.04 : 1 }}
          transition={transition.fast}
          className="mx-auto flex h-14 w-14 items-center justify-center rounded-pill bg-clay-100 text-2xl"
          aria-hidden="true"
        >
          ↑
        </motion.div>

        <h2 className="mt-5 font-display text-display-sm text-ink text-balance">
          {dragging ? 'Let go — we have it' : 'Drop your chat export here'}
        </h2>
        <p className="mx-auto mt-2 max-w-[44ch] text-sm leading-relaxed text-ink-muted text-pretty">
          The <code className="rounded bg-surface-sunk px-1 py-0.5 text-[0.8em]">.txt</code> file
          WhatsApp gives you when you export a conversation.
        </p>

        <div className="mt-6">
          <Button
            type="button"
            variant="secondary"
            onClick={() => inputRef.current?.click()}
            disabled={disabled}
          >
            Choose a file
          </Button>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".txt,text/plain,.zip"
          className="sr-only"
          onChange={(e) => {
            accept(e.target.files?.[0])
            // Allow re-selecting the same file after an error.
            e.target.value = ''
          }}
          aria-label="Choose a WhatsApp export file"
        />
      </div>

      {rejected ? (
        <p role="alert" className="mt-3 text-sm text-clay-700">
          {rejected}
        </p>
      ) : null}
    </div>
  )
}
