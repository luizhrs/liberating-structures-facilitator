import { useState, useEffect, useRef, useCallback } from 'react'

export function useTimer(initialSeconds: number) {
  const [seconds, setSeconds] = useState(initialSeconds)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const clear = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            setIsRunning(false)
            return 0
          }
          return s - 1
        })
      }, 1000)
    } else {
      clear()
    }
    return clear
  }, [isRunning])

  const start = useCallback(() => setIsRunning(true), [])
  const pause = useCallback(() => setIsRunning(false), [])
  const toggle = useCallback(() => setIsRunning(r => !r), [])

  const reset = useCallback((newSeconds?: number) => {
    setIsRunning(false)
    setSeconds(newSeconds ?? initialSeconds)
  }, [initialSeconds])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
  }

  return {
    seconds,
    isRunning,
    start,
    pause,
    toggle,
    reset,
    formatted: formatTime(seconds),
    progress: initialSeconds > 0 ? seconds / initialSeconds : 1,
  }
}
