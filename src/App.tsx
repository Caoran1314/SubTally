import * as React from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { useSubsStore } from '@/store/useSubsStore'
import type { Subscription } from '@/lib/types'
import { AppShell, useAppearance, type TabKey } from '@/components/AppShell'
import { OverviewPage } from '@/pages/Overview'
import { SubscriptionsPage } from '@/pages/Subscriptions'
import { SettingsPage } from '@/pages/Settings'
import { Landing, Onboarding } from '@/pages/Welcome'
import { AddSubscriptionDialog } from '@/components/AddSubscriptionDialog'

/** 图表库偏重，统计页单独切一个 chunk，首屏不为它付费 */
const StatsPage = React.lazy(() =>
  import('@/pages/Stats').then((m) => ({ default: m.StatsPage }))
)

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 0, refetchOnWindowFocus: false, staleTime: 60_000 },
  },
})

function Shell() {
  useAppearance()
  const onboarded = useSubsStore((s) => s.settings.onboarded)
  const [phase, setPhase] = React.useState<'landing' | 'onboarding'>('landing')
  const [tab, setTab] = React.useState<TabKey>('overview')
  const [dialogOpen, setDialogOpen] = React.useState(false)
  const autoSnapshot = useSubsStore((s) => s.autoSnapshotMonthly)

  // 每月第一次打开自动记一个快照，供总览画月均趋势
  React.useEffect(() => {
    if (onboarded) autoSnapshot()
  }, [onboarded, autoSnapshot])
  const [editing, setEditing] = React.useState<Subscription | null>(null)

  if (!onboarded) {
    if (phase === 'landing') return <Landing onStart={() => setPhase('onboarding')} />
    return <Onboarding onDone={() => setTab('overview')} />
  }

  const openAdd = () => {
    setEditing(null)
    setDialogOpen(true)
  }
  const openEdit = (s: Subscription) => {
    setEditing(s)
    setDialogOpen(true)
  }

  return (
    <>
      <AppShell tab={tab} onTab={setTab} onAdd={openAdd}>
        {tab === 'overview' && <OverviewPage onAdd={openAdd} onGoSubs={() => setTab('subs')} />}
        {tab === 'subs' && <SubscriptionsPage onAdd={openAdd} onEdit={openEdit} />}
        {tab === 'stats' && (
          <React.Suspense
            fallback={
              <div className="flex h-64 items-center justify-center text-[12.5px] text-paper-faint">
                正在画图…
              </div>
            }
          >
            <StatsPage />
          </React.Suspense>
        )}
        {tab === 'settings' && <SettingsPage />}
      </AppShell>

      <AddSubscriptionDialog
        open={dialogOpen}
        onOpenChange={(v) => {
          setDialogOpen(v)
          if (!v) setEditing(null)
        }}
        editing={editing}
      />
    </>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Shell />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: 'hsl(var(--ink-850) / .96)',
            border: '1px solid hsl(var(--line-strong) / .8)',
            color: 'hsl(var(--paper))',
            backdropFilter: 'blur(20px)',
            fontSize: '12.5px',
            borderRadius: '12px',
          },
        }}
      />
    </QueryClientProvider>
  )
}

