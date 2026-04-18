import { useEffect, useRef, useState } from 'react'

interface Props {
  serverTime: number   // ms epoch when round started
  duration?: number    // seconds (default 10)
  onExpire?: () => void
}

export default function Timer({ serverTime, duration = 10, onExpire }: Props) {
  const calcRemaining = () => {
    const elapsed = (Date.now() - serverTime) / 1000
    return Math.max(0, duration - elapsed)
  }

  const [remaining, setRemaining] = useState(calcRemaining)
  const firedRef = useRef(false)

  useEffect(() => {
    firedRef.current = false
    setRemaining(calcRemaining())

    const interval = setInterval(() => {
      const r = calcRemaining()
      setRemaining(r)
      if (r <= 0 && !firedRef.current) {
        firedRef.current = true
        onExpire?.()
        clearInterval(interval)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [serverTime]) // eslint-disable-line react-hooks/exhaustive-deps

  const pct = remaining / duration
  const urgent = remaining <= 3
  const circumference = 2 * Math.PI * 36  // r=36

  const displaySecs = Math.ceil(remaining)

  return (
    <div className={`timer-wrap ${urgent ? 'urgent' : ''}`}>
      <svg className="timer-ring" width="96" height="96" viewBox="0 0 96 96">
        {/* Track */}
        <circle cx="48" cy="48" r="36" fill="none" stroke="var(--border)" strokeWidth="6" />
        {/* Progress */}
        <circle
          cx="48" cy="48" r="36"
          fill="none"
          stroke={urgent ? 'var(--red)' : 'var(--accent)'}
          strokeWidth="6"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - pct)}
          style={{ transition: 'stroke-dashoffset 0.1s linear', transform: 'rotate(-90deg)', transformOrigin: '48px 48px' }}
        />
        <text
          x="48" y="48"
          textAnchor="middle"
          dominantBaseline="central"
          fontSize="22"
          fontWeight="700"
          fontFamily="Outfit"
          fill={urgent ? 'var(--red)' : 'var(--text-primary)'}
          style={{ animation: urgent ? 'countdownPulse 0.8s ease infinite' : 'none' }}
        >
          {displaySecs}
        </text>
      </svg>

      <style>{`
        .timer-wrap {
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .timer-wrap.urgent .timer-ring {
          filter: drop-shadow(0 0 8px var(--red));
        }
      `}</style>
    </div>
  )
}
