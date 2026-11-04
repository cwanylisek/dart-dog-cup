import { AnimatePresence, motion, useDragControls } from 'motion/react'
import { useEffect, type ReactNode } from 'react'

/** Bottom sheet on mobile, centered dialog on larger screens. */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title?: ReactNode
  children: ReactNode
}) {
  const controls = useDragControls()

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-[2px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            className="pb-safe relative flex max-h-[90dvh] w-full max-w-md flex-col rounded-t-[28px] bg-surface shadow-2xl sm:rounded-[28px]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 420, damping: 40 }}
            drag="y"
            dragControls={controls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 120 || info.velocity.y > 600) onClose()
            }}
          >
            <div className="shrink-0 touch-none" onPointerDown={(e) => controls.start(e)}>
              <div className="flex justify-center pt-2.5 pb-1">
                <span className="h-1.5 w-10 rounded-full bg-surface-3" />
              </div>
              {title && <div className="px-5 pt-2 pb-3 text-lg font-bold">{title}</div>}
            </div>
            <div className="overflow-y-auto px-5 pb-5">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
