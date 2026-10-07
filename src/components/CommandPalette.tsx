import { Command } from 'cmdk'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { commandPaletteStore } from '@/components/commandPaletteStore'
import { ResponsiveModal } from '@/components/ResponsiveModal'
import { Kbd } from '@/components/ui/Kbd'
import { logSession, undoSession } from '@/data/sessionWrites'
import { useAuth } from '@/data/useAuth'
import { useGoals } from '@/data/useGoals'
import { earliestMonth, useOverdueGoals } from '@/data/useOverdueGoals'
import type { Goal } from '@/data/types'
import { SearchIcon } from '@/components/icons'
import { openFocusPicker } from '@/features/focus/focusPickerStore'
import { newGoalModalStore } from '@/features/goals/newGoalModalStore'
import { sleepLogSheetStore } from '@/features/sleep/sleepLogSheetStore'
import { spendingAddSheetStore } from '@/features/spending/spendingAddSheetStore'
import { currentMonth, monthName } from '@/lib/chunks'

const ITEM_CLASSNAME =
  'flex min-h-11 cursor-pointer items-center justify-between gap-2 rounded-sm px-2.5 text-[length:var(--text-small)] text-text outline-none transition-colors data-[selected=true]:bg-surface-2 animate-[command-item-in_0.18s_ease-out_both]'

// "log 30 french" / "log 25 min to French" / "log 25 minutes french" — the
// minutes and a trailing bit of free text that's matched against goal names.
const LOG_PATTERN = /^log\s+(\d+)\s*(?:min(?:utes)?)?\s*(?:to\s+)?(.+)$/i

function parseLogCommand(search: string, goals: Goal[]): { minutes: number; goal: Goal } | null {
  const match = LOG_PATTERN.exec(search.trim())
  if (!match) return null
  const minutes = Number.parseInt(match[1]!, 10)
  const goalText = match[2]!.trim().toLowerCase()
  if (!minutes || !goalText) return null
  const goal = goals.find((candidate) => {
    const name = candidate.name.toLowerCase()
    return name.includes(goalText) || goalText.includes(name)
  })
  return goal ? { minutes, goal } : null
}

/**
 * Built on cmdk's bare <Command> (not <Command.Dialog>, which manages its own
 * uncontrolled portal) rendered through <ResponsiveModal> so it gets the same
 * vaul-drawer-on-mobile/Radix-dialog-on-desktop treatment as every other
 * overlay, instead of a bespoke portal (CLAUDE.md LAYERING RULES #3/#7).
 */
export function CommandPalette() {
  const open = commandPaletteStore.useIsOpen()
  const [search, setSearch] = useState('')
  const navigate = useNavigate()
  const { user } = useAuth()

  const month = currentMonth()
  const { data: goals } = useGoals(month)
  const activeGoals = useMemo(() => goals?.filter((goal) => goal.status === 'active') ?? [], [goals])

  const { data: overdueGoals } = useOverdueGoals(month)
  const reviewMonth = earliestMonth(overdueGoals ?? [])

  const logCommand = useMemo(() => parseLogCommand(search, activeGoals), [search, activeGoals])

  // A plain incrementing counter (not React state) read while building the
  // JSX below — cheap way to stagger each visible item's entrance animation
  // by a few milliseconds without pulling in framer-motion's own stagger
  // orchestration for what's otherwise a CSS keyframe.
  let staggerIndex = 0
  function nextStaggerStyle() {
    return { animationDelay: `${staggerIndex++ * 30}ms` }
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        commandPaletteStore.toggle()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  function close() {
    commandPaletteStore.close()
    setSearch('')
  }

  function goTo(path: string) {
    close()
    navigate(path)
  }

  function handleFocusGoal(goalId: string) {
    close()
    openFocusPicker(goalId)
  }

  function handleReviewMonth() {
    close()
    navigate('/month')
  }

  function handleNewGoal() {
    newGoalModalStore.open()
    goTo('/')
  }

  function handleLogSleep() {
    sleepLogSheetStore.open()
    goTo('/sleep')
  }

  function handleAddSpending() {
    spendingAddSheetStore.open()
    goTo('/spending')
  }

  async function handleQuickLog() {
    if (!user || !logCommand) return
    const { minutes, goal } = logCommand
    close()

    const now = new Date()
    const day = String(now.getDate()).padStart(2, '0')

    try {
      const result = await logSession({ uid: user.uid, goalId: goal.id, month, day, minutes })
      toast(`Logged ${minutes} min · ${goal.name}`, {
        action: {
          label: 'Undo',
          onClick: () => {
            void undoSession(user.uid, result.sessionId)
          },
        },
      })
    } catch {
      toast.error('Could not log that session. Try again.')
    }
  }

  return (
    <>
      <button
        type="button"
        aria-label="Search / Command"
        onClick={() => commandPaletteStore.open()}
        className="z-nav fixed right-[var(--gutter)] flex h-11 w-11 items-center justify-center rounded-full border border-hairline bg-surface text-text-2 md:hidden"
        style={{ top: 'calc(env(safe-area-inset-top) + var(--gutter))' }}
      >
        <SearchIcon />
      </button>

      <ResponsiveModal
        open={open}
        onOpenChange={(next) => (next ? commandPaletteStore.open() : close())}
        title="Command palette"
        visuallyHiddenTitle
        mobileFullHeight
        desktopPosition="top"
      >
        <Command label="Command palette" shouldFilter className="flex flex-col overflow-hidden">
          <Command.Input
            autoFocus
            value={search}
            onValueChange={setSearch}
            placeholder="Log 25 min to French, focus on Chess…"
            className="w-full border-b border-hairline bg-transparent px-1 pb-3 text-[length:var(--text-body)] text-text outline-none placeholder:text-text-2"
          />
          <Command.List className="max-h-[60vh] flex-1 overflow-y-auto pt-1.5 md:max-h-80">
            <Command.Empty className="px-3 py-6 text-center text-[length:var(--text-small)] text-text-2">
              No matching commands.
            </Command.Empty>

            {logCommand && (
              <Command.Group heading="Log time">
                <Command.Item
                  value={search}
                  onSelect={() => void handleQuickLog()}
                  className={ITEM_CLASSNAME}
                  style={nextStaggerStyle()}
                >
                  <span>
                    Log {logCommand.minutes} min to {logCommand.goal.name}
                  </span>
                  <Kbd>⏎</Kbd>
                </Command.Item>
              </Command.Group>
            )}

            {activeGoals.length > 0 && (
              <Command.Group heading="Focus">
                {activeGoals.map((goal) => (
                  <Command.Item
                    key={goal.id}
                    value={`Focus on ${goal.name}`}
                    onSelect={() => handleFocusGoal(goal.id)}
                    className={ITEM_CLASSNAME}
                    style={nextStaggerStyle()}
                  >
                    Focus on {goal.name}
                  </Command.Item>
                ))}
              </Command.Group>
            )}

            <Command.Group heading="Actions">
              <Command.Item value="New goal" onSelect={handleNewGoal} className={ITEM_CLASSNAME} style={nextStaggerStyle()}>
                New goal
              </Command.Item>
              <Command.Item value="Log sleep" onSelect={handleLogSleep} className={ITEM_CLASSNAME} style={nextStaggerStyle()}>
                Log sleep
              </Command.Item>
              <Command.Item
                value="Add spending"
                onSelect={handleAddSpending}
                className={ITEM_CLASSNAME}
                style={nextStaggerStyle()}
              >
                Add spending
              </Command.Item>
              {reviewMonth && (
                <Command.Item
                  value={`Review ${monthName(reviewMonth)}`}
                  onSelect={handleReviewMonth}
                  className={ITEM_CLASSNAME}
                  style={nextStaggerStyle()}
                >
                  Review {monthName(reviewMonth)}
                </Command.Item>
              )}
            </Command.Group>

            <Command.Group heading="Go to">
              <Command.Item
                value="Go to Heatmap"
                onSelect={() => goTo('/heatmap')}
                className={ITEM_CLASSNAME}
                style={nextStaggerStyle()}
              >
                Heatmap
              </Command.Item>
              <Command.Item
                value="Go to Sleep"
                onSelect={() => goTo('/sleep')}
                className={ITEM_CLASSNAME}
                style={nextStaggerStyle()}
              >
                Sleep
              </Command.Item>
              <Command.Item
                value="Go to Spending"
                onSelect={() => goTo('/spending')}
                className={ITEM_CLASSNAME}
                style={nextStaggerStyle()}
              >
                Spending
              </Command.Item>
              <Command.Item
                value="Go to Year in Review"
                onSelect={() => goTo('/review')}
                className={ITEM_CLASSNAME}
                style={nextStaggerStyle()}
              >
                Year in Review
              </Command.Item>
            </Command.Group>
          </Command.List>

          <div className="hidden items-center gap-4 border-t border-hairline px-2.5 py-2 text-[length:var(--text-small)] text-text-2 md:flex">
            <span className="inline-flex items-center gap-1.5">
              <Kbd>↑</Kbd>
              <Kbd>↓</Kbd> Navigate
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Kbd>⏎</Kbd> Select
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Kbd>Esc</Kbd> Close
            </span>
          </div>
        </Command>
      </ResponsiveModal>
    </>
  )
}
