import { slotDisplayStatus } from '@/lib/slotStatus'

/** Status chip for slots, requests, questions, etc. Pass sessionDate for slots so past `booked` reads as completed. */
export function StatusPill({
  status,
  sessionDate,
}: {
  status: string
  sessionDate?: string | null
}) {
  const label = sessionDate ? slotDisplayStatus(status, sessionDate) : status
  const cls =
    label === 'open'
      ? 'pill pill-open'
      : label === 'claimed'
        ? 'pill pill-claimed'
        : label === 'booked' || label === 'completed'
          ? 'pill pill-booked'
          : 'pill'
  return <span className={cls}>{label}</span>
}
