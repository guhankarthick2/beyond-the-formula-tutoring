export type UserRole = 'student' | 'tutor' | 'admin'
export type TutorStatus = 'none' | 'pending' | 'approved' | 'rejected'
export type SlotStatus = 'open' | 'booked' | 'cancelled'
export type RequestStatus = 'open' | 'claimed' | 'booked' | 'cancelled'
export type QuestionStatus = 'open' | 'answered' | 'closed'

export interface Profile {
  id: string
  display_name: string
  role: UserRole
  tutor_status: TutorStatus
  video_watched: boolean
  expectations_accepted: boolean
  created_at: string
  updated_at: string
}

export interface Topic {
  id: string
  name: string
  slug: string
  youtube_url: string | null
  sort_order: number
  active: boolean
}

export interface AvailabilitySlot {
  id: string
  tutor_id: string
  topic_id: string | null
  session_date: string
  time_note: string
  meeting_url: string
  status: SlotStatus
  created_at: string
  topics?: Topic | null
  profiles?: Pick<Profile, 'display_name'> | null
}

export interface Booking {
  id: string
  slot_id: string
  student_id: string
  created_at: string
  availability_slots?: AvailabilitySlot | null
}

export interface SessionRequest {
  id: string
  student_id: string
  topic_id: string
  preferred_date: string
  note: string
  watched_recording: boolean
  status: RequestStatus
  claimed_by: string | null
  proposed_date: string | null
  proposed_time_note: string
  meeting_url: string
  created_at: string
  topics?: Topic | null
  student?: Pick<Profile, 'display_name'> | null
  tutor?: Pick<Profile, 'display_name'> | null
}

export interface StuckQuestion {
  id: string
  author_id: string
  topic_id: string
  title: string
  body: string
  status: QuestionStatus
  created_at: string
  topics?: Topic | null
  profiles?: Pick<Profile, 'display_name'> | null
}

export interface StuckAnswer {
  id: string
  question_id: string
  author_id: string
  body: string
  is_accepted: boolean
  created_at: string
  profiles?: Pick<Profile, 'display_name'> | null
}

export interface ChatMessage {
  id: string
  senderId: string
  senderName: string
  body: string
  at: number
}

export interface SessionHomework {
  id: string
  slot_id: string
  tutor_id: string
  title: string
  body: string
  due_date: string | null
  created_at: string
  availability_slots?: AvailabilitySlot | null
}

export interface HomeworkCompletion {
  homework_id: string
  student_id: string
  completed_at: string
}

export interface MentorMessage {
  id: string
  tutor_id: string
  student_id: string
  body: string
  created_at: string
  tutor?: Pick<Profile, 'display_name'> | null
}

export interface RosterStudent {
  id: string
  display_name: string
  slot_id: string
  session_date: string
  topic_name: string
}
