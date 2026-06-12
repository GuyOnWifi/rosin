import { useCallback, useRef } from 'react'

interface Props {
  value: number
  min: number
  max: number
  step?: number
  onChange: (v: number) => void
  onCommit?: (v: number) => void
}

export function Slider({ value, min, max, step = 1, onChange, onCommit }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const dragging = useRef(false)

  const valueFromEvent = useCallback(
    (clientX: number) => {
      const el = ref.current
      if (!el) return value
      const rect = el.getBoundingClientRect()
      const f = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      const raw = min + f * (max - min)
      return Math.round(raw / step) * step
    },
    [min, max, step, value],
  )

  const handleDown = (e: React.PointerEvent) => {
    dragging.current = true
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    onChange(valueFromEvent(e.clientX))
  }
  const handleMove = (e: React.PointerEvent) => {
    if (!dragging.current) return
    onChange(valueFromEvent(e.clientX))
  }
  const handleUp = (e: React.PointerEvent) => {
    if (!dragging.current) return
    dragging.current = false
    onCommit?.(valueFromEvent(e.clientX))
  }

  const pct = ((value - min) / (max - min)) * 100

  return (
    <div
      className="slider"
      ref={ref}
      onPointerDown={handleDown}
      onPointerMove={handleMove}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
      role="slider"
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
    >
      <div className="slider-track">
        <div className="slider-active" style={{ width: `calc(${pct}% - 3px)` }} />
      </div>
      <div className="slider-handle" style={{ left: `${pct}%` }} />
    </div>
  )
}
