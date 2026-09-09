import { mentorInitials } from '@/lib/mentors'

export function MentorMonogram({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <span className={`mentor-monogram mentor-monogram-${size}`} aria-hidden="true">
      {mentorInitials(name)}
    </span>
  )
}
