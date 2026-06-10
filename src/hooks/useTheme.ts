import { useCallback, useEffect, useState } from 'react'
import { getSystemAccent } from '../lib/systemTheme'
import { applyTheme, type Mode } from '../theme/theme'

const SEED_KEY = 'pinecil.seed'
const MODE_KEY = 'pinecil.mode'
const DYN_KEY = 'pinecil.dynamic'

function systemMode(): Mode {
  return window.matchMedia?.('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark'
}

export function useTheme() {
  const [seed, setSeedState] = useState<string>(
    () => localStorage.getItem(SEED_KEY) ?? '#ff7a3d',
  )
  const [mode, setMode] = useState<Mode>(
    () => (localStorage.getItem(MODE_KEY) as Mode) ?? systemMode(),
  )
  // When on, follow the OS Material You accent instead of a manual seed.
  const [dynamic, setDynamic] = useState<boolean>(
    () => localStorage.getItem(DYN_KEY) === '1',
  )

  useEffect(() => {
    applyTheme(seed, mode)
    localStorage.setItem(SEED_KEY, seed)
    localStorage.setItem(MODE_KEY, mode)
  }, [seed, mode])

  // Pull the live system accent whenever dynamic mode is (re)enabled.
  useEffect(() => {
    localStorage.setItem(DYN_KEY, dynamic ? '1' : '0')
    if (dynamic) getSystemAccent().then((c) => c && setSeedState(c))
  }, [dynamic])

  // Manually choosing a colour turns off "follow system".
  const setSeed = useCallback((hex: string) => {
    setDynamic(false)
    setSeedState(hex)
  }, [])

  const toggleMode = useCallback(
    () => setMode((m) => (m === 'dark' ? 'light' : 'dark')),
    [],
  )

  return { seed, setSeed, mode, setMode, toggleMode, dynamic, setDynamic }
}
