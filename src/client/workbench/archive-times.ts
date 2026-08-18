/**
 * Archive-time ledger for the archives panel.
 *
 * dsh persists only the archived-session id set (`archivedSessionIds`); it
 * records no archive timestamp. This module keeps a plugin-owned map of
 * sessionId -> archive time so the panel can show a real "archived at" value
 * for sessions archived while the workbench was mounted. Sessions archived
 * before this ledger existed fall back to `updatedAt` in the panel.
 */

const ARCHIVE_TIMES_KEY = 'dsh-workbench-archive-times'

export function readArchiveTimes(): Record<string, number> {
  try {
    const raw = localStorage.getItem(ARCHIVE_TIMES_KEY)
    if (raw === null || raw.trim() === '') return {}
    const parsed = JSON.parse(raw) as unknown
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return {}
    const out: Record<string, number> = {}
    for (const [id, value] of Object.entries(parsed)) {
      if (typeof value === 'number' && Number.isFinite(value)) out[id] = value
    }
    return out
  } catch {
    return {}
  }
}

function writeArchiveTimes(next: Record<string, number>): void {
  try {
    localStorage.setItem(ARCHIVE_TIMES_KEY, JSON.stringify(next))
  } catch { /* private mode / quota */ }
}

/**
 * Stamp any archived id that is not in the ledger yet. Returns the merged
 * ledger (new ids get `now`); the caller may hold it in state for rendering.
 */
export function recordArchivedIds(ids: readonly string[], now = Date.now()): Record<string, number> {
  const prev = readArchiveTimes()
  const next = { ...prev }
  let changed = false
  for (const id of ids) {
    if (next[id] === undefined) {
      next[id] = now
      changed = true
    }
  }
  if (changed) writeArchiveTimes(next)
  return next
}

/** Display time for one archived session: plugin-recorded archive time, else last activity. */
export function archiveTimeOf(ledger: Record<string, number>, sessionId: string, updatedAt?: number): {
  at: number
  source: 'archivedAt' | 'lastActive'
} {
  const recorded = ledger[sessionId]
  if (recorded !== undefined) return { at: recorded, source: 'archivedAt' }
  return { at: typeof updatedAt === 'number' && updatedAt > 0 ? updatedAt : 0, source: 'lastActive' }
}

/** Localized, minute-resolution timestamp: `YYYY-MM-DD HH:mm` in the local timezone. */
export function formatArchiveTime(at: number): string {
  if (at <= 0) return ''
  const date = new Date(at)
  const pad = (n: number): string => String(n).padStart(2, '0')
  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join(' ')
}
