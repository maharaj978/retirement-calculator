import { useState, useRef, useEffect } from 'react'

interface Props {
  text: string
}

export default function Tooltip({ text }: Props) {
  const [visible, setVisible] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0, openDown: false })
  const btnRef = useRef<HTMLButtonElement>(null)

  function updateCoords() {
    if (!btnRef.current) return
    const r = btnRef.current.getBoundingClientRect()
    const spaceAbove = r.top
    const openDown = spaceAbove < 120 // not enough room above: open downward
    setCoords({
      top: openDown ? r.bottom + 8 : r.top - 8,
      left: r.left + r.width / 2,
      openDown,
    })
  }

  function show() { updateCoords(); setVisible(true) }
  function hide() { setVisible(false) }

  // Hide on scroll so the tooltip doesn't drift
  useEffect(() => {
    if (!visible) return
    window.addEventListener('scroll', hide, true)
    return () => window.removeEventListener('scroll', hide, true)
  }, [visible])

  return (
    <span className="relative inline-flex">
      <button
        ref={btnRef}
        type="button"
        aria-label="More information"
        className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-gray-100 text-gray-400 text-xs hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        onClick={() => { if (visible) hide(); else show() }}
      >
        ?
      </button>
      {visible && (
        <span
          role="tooltip"
          className="fixed z-[9999] w-64 rounded-lg bg-white text-zinc-700 text-xs px-3 py-2 shadow-md border border-zinc-200 leading-relaxed pointer-events-none"
          style={{
            top: coords.openDown ? coords.top : undefined,
            bottom: coords.openDown ? undefined : `calc(100vh - ${coords.top}px)`,
            left: coords.left,
            transform: 'translateX(-50%)',
          }}
        >
          {text}
          {/* Arrow */}
          <span
            className={`absolute left-1/2 -translate-x-1/2 w-0 h-0 border-4 border-transparent ${
              coords.openDown
                ? 'bottom-full border-b-zinc-200'
                : 'top-full border-t-zinc-200'
            }`}
          />
        </span>
      )}
    </span>
  )
}
