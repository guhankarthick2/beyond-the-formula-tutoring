/** Display label for availability slot status (DB may keep `booked` for past multi-enroll). */
export function slotDisplayStatus(
  status: string,
  sessionDate?: string | null,
  today: string = new Date().toISOString().slice(0, 10),
): string {
  if (status === 'cancelled') return 'cancelled'
  if (sessionDate && sessionDate <= today && (status === 'booked' || status === 'open')) {
    return 'completed'
  }
  return status
}
