import { Link } from 'react-router-dom'

export function PageBack({
  to = '/',
  label = 'Back to home',
}: {
  to?: string
  label?: string
}) {
  return (
    <Link to={to} className="page-back">
      <span aria-hidden>←</span> {label}
    </Link>
  )
}
