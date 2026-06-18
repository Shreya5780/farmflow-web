import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

export type QuickAddType = 'farm' | 'crop' | 'activity'

interface QuickAddContextValue {
  pending: QuickAddType | null
  requestAdd: (type: QuickAddType) => void
  consume: () => void
}

const QuickAddContext = createContext<QuickAddContextValue>({
  pending: null,
  requestAdd: () => {},
  consume: () => {},
})

export const useQuickAdd = () => useContext(QuickAddContext)

export const QuickAddProvider = ({ children }: { children: ReactNode }) => {
  const [pending, setPending] = useState<QuickAddType | null>(null)

  const value = useMemo<QuickAddContextValue>(
    () => ({
      pending,
      requestAdd: (type) => setPending(type),
      consume: () => setPending(null),
    }),
    [pending],
  )

  return <QuickAddContext.Provider value={value}>{children}</QuickAddContext.Provider>
}
