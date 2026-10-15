import { useCallback, useEffect, useState } from 'react'
import type { Destination } from '../types'
import { fetchDestinations } from './api'

type State =
  | { status: 'loading'; data: [] }
  | { status: 'ready'; data: Destination[] }
  | { status: 'error'; data: [] }

export function useDestinations() {
  const [state, setState] = useState<State>({ status: 'loading', data: [] })
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    fetchDestinations(controller.signal)
      .then((data) => setState({ status: 'ready', data }))
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setState({ status: 'error', data: [] })
      })
    return () => controller.abort()
  }, [attempt])

  const retry = useCallback(() => {
    setState({ status: 'loading', data: [] })
    setAttempt((n) => n + 1)
  }, [])
  return { ...state, retry }
}
