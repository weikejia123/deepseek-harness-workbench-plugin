import { useMemo } from 'react'
import { archiveTimeOf, formatArchiveTime, readArchiveTimes } from './archive-times.ts'
import type { Translate } from './types.ts'
import css from './ArchivesPanel.module.css'

export interface ArchiveSessionRow {
  id: string
  title: string
  /** Plugin-recorded archive time, else last activity. */
  at: number
  source: 'archivedAt' | 'lastActive'
}

interface SessionRow {
  id: string
  displayTitle: string
  updatedAt: number
  blank: boolean
  running: boolean
}

export interface ArchivesPanelProps {
  useSessions: (selector: (state: { byId: Record<string, SessionRow>; current?: string }) => unknown) => unknown
  useWorkspaces: (selector: (state: { archivedSessionIds: readonly string[] }) => unknown) => unknown
  openSession?: (id: string) => void
  t: Translate
}

/**
 * Side-dock tab listing every archived dsh session with its archive time
 * (plugin-recorded, falling back to last activity). Clicking a row opens the
 * archived session so its records can be reviewed / copied.
 */
export function ArchivesPanel({ useSessions, useWorkspaces, openSession, t }: ArchivesPanelProps) {
  const archivedIds = useWorkspaces(state => state.archivedSessionIds) as readonly string[]
  const byId = useSessions(state => state.byId) as Record<string, SessionRow>
  const current = useSessions(state => state.current) as string | undefined

  const ledger = useMemo(() => readArchiveTimes(), [])
  const rows = useMemo<ArchiveSessionRow[]>(() => {
    const list: ArchiveSessionRow[] = []
    for (const id of archivedIds) {
      const summary = byId[id]
      if (summary === undefined || summary.blank) continue
      const { at, source } = archiveTimeOf(ledger, id, summary.updatedAt)
      list.push({ id, title: summary.displayTitle, at, source })
    }
    return list.sort((a, b) => b.at - a.at)
  }, [archivedIds, byId, ledger])

  return (
    <section className={css.root} aria-label={t('archives.title')}>
      <header className={css.head}>
        <span className={css.title}>{t('archives.title')}</span>
        {rows.length > 0 ? (
          <span className={css.count}>{t('archives.count', { count: rows.length })}</span>
        ) : null}
      </header>
      {rows.length === 0 ? (
        <p className={css.empty}>{t('archives.empty')}</p>
      ) : (
        <ul className={css.list}>
          {rows.map(row => (
            <li key={row.id}>
              <button
                type="button"
                className={css.row}
                data-active={row.id === current || undefined}
                title={t('archives.open')}
                onClick={() => { openSession?.(row.id) }}
              >
                <span className={css.rowTitle}>{row.title}</span>
                <span className={css.rowTime}>
                  {row.source === 'archivedAt'
                    ? t('archives.archivedAt', { time: formatArchiveTime(row.at) })
                    : t('archives.lastActive', { time: formatArchiveTime(row.at) })}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
