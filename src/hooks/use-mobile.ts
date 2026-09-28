import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    // Defer initial setState to next microtask to avoid synchronous effect→state loop
    // (React 19 react-hooks/set-state-in-effect rule).
    queueMicrotask(() => onChange())
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
