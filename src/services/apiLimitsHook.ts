import { useEffect, useState } from 'react'
import {
  type ApiLimits,
  currentLimits,
  statusListeners,
} from './apiLimits.js'

export function useCodePilotLimits(): ApiLimits {
  const [limits, setLimits] = useState<ApiLimits>({ ...currentLimits })

  useEffect(() => {
    const listener = (newLimits: ApiLimits) => {
      setLimits({ ...newLimits })
    }
    statusListeners.add(listener)

    return () => {
      statusListeners.delete(listener)
    }
  }, [])

  return limits
}
