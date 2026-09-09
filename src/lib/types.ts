export type UserRole = 'student' | 'tutor' | 'admin'
export type TutorStatus = 'none' | 'pending' | 'approved' | 'rejected'
export type SlotStatus = 'open' | 'booked' | 'cancelled'
export type RequestStatus = 'open' | 'claimed' | 'booked' | 'cancelled'
export type QuestionStatus = 'open' | 'answered' | 'closed'
export type CourseStatus = 'draft' | 'published'

export interface Profile {
  id: string
  display_name: string
  role: UserRole
  tutor_status: TutorStatus
  video_watched: boolean
  expectations_accepted: boolean
  mentor_slug?: string | null
  mentor_bio?: string
  mentor_focus?: string
  mentor_public?: boolean
  created_at: string
  updated_at: string
}

export interface PublicMentorProfile {
  id: string
  display_name: string
  mentor_slug: string
  mentor_bio: string
  mentor_focus: string
  session_count?: number
}

export interface CourseMentorDir {
  course_id: string
  mentor_id: string
  sort_order: number
  display_name: string
  mentor_slug: string | null
  mentor_focus: string | null
  is_public: boolean
}

export interface Topic {
  id: string
  name: string
  slug: string
  youtube_url: string | null
  sort_order: number
  active: boolean
}

export interface Course {
  id: string
  title: string
  slug: string
  subject_slug: string
  summary: string
  body: string
  flyer_path: string | null
  status: CourseStatus
  location_note: string
  starts_on: string | null
  ends_on: string | null
  created_at: string
}

export interface CourseEnrollment {
  course_id: string
  student_id: string
  created_at: string
  courses?: Course | null
}

export interface AvailabilitySlot {
  id: string
  tutor_id: string
  session_date: string
  time_note: string
  meeting_url: string
  status: SlotStatus
  created_at: string
  course_id?: string | null
  subject_slug?: string
  slot_topics?: { topic_id: string; topics: Topic | null }[]
  profiles?: Pick<Profile, 'display_name'> | null
  courses?: Pick<Course, 'id' | 'title' | 'slug' | 'subject_slug'> | null
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
  topic_id: string | null
  subject_slug: string
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

export interface QuestionReport {
  id: string
  question_id: string
  reporter_id: string
  reason: string
  created_at: string
  resolved_at: string | null
  profiles?: Pick<Profile, 'display_name'> | null
  stuck_questions?: Pick<StuckQuestion, 'id' | 'title' | 'subject_slug' | 'body' | 'status'> | null
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
  dismissed_at: string | null
  tutor?: Pick<Profile, 'display_name'> | null
  student?: Pick<Profile, 'display_name'> | null
}

export interface RosterStudent {
  id: string
  display_name: string
  slot_id: string
  session_date: string
  topic_name: string
}
