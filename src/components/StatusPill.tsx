export function StatusPill({ status }: { status: string }) {
  const cls =
    status === 'open'
      ? 'pill pill-open'
      : status === 'claimed'
        ? 'pill pill-claimed'
        : status === 'booked'
          ? 'pill pill-booked'
          : 'pill'
  return <span className={cls}>{status}</span>
}
