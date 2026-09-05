import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { AuthProvider } from '@/lib/auth'
import { SubjectProvider } from '@/lib/subject'
import { AdminPage } from '@/pages/AdminPage'
import { AuthPage } from '@/pages/AuthPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { HomePage } from '@/pages/HomePage'
import { MentorDashboardPage } from '@/pages/MentorDashboardPage'
import { MentorHomePage } from '@/pages/MentorHomePage'
import { RequestPage } from '@/pages/RequestPage'
import { ResourcesPage } from '@/pages/ResourcesPage'
import { ScheduleRedirect, SessionsPage } from '@/pages/SessionsPage'
import { StuckDetailPage, StuckListPage } from '@/pages/StuckPage'
import { RecordingsPage } from '@/pages/RecordingsPage'
import { StudentHubPage, StudentSubjectPage } from '@/pages/StudentHubPage'
import { StudentMySessionsPage } from '@/pages/StudentMySessionsPage'
import { Unit1TestPage } from '@/pages/Unit1TestPage'

export default function App() {
  return (
    <AuthProvider>
      <SubjectProvider>
        <BrowserRouter>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/students" element={<StudentHubPage />} />
              <Route path="/students/resources" element={<ResourcesPage />} />
              <Route path="/students/resources/:subjectSlug" element={<ResourcesPage />} />
              <Route path="/students/schedule" element={<ScheduleRedirect />} />
              <Route path="/students/my-sessions" element={<StudentMySessionsPage />} />
              <Route path="/students/tests" element={<Navigate to="/students/precal/tests/unit-1" replace />} />
              <Route path="/students/precal/tests/unit-1" element={<Unit1TestPage />} />
              <Route path="/students/:subjectSlug" element={<StudentSubjectPage />} />
              <Route path="/students/:subjectSlug/schedule" element={<SessionsPage />} />
              <Route path="/students/:subjectSlug/recordings" element={<RecordingsPage />} />
              <Route path="/mentors" element={<MentorHomePage />} />
              <Route path="/mentors/dashboard" element={<MentorDashboardPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/volunteer" element={<Navigate to="/mentors" replace />} />
              <Route path="/sessions" element={<ScheduleRedirect />} />
              <Route path="/request" element={<RequestPage />} />
              <Route path="/stuck" element={<StuckListPage />} />
              <Route path="/stuck/:id" element={<StuckDetailPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Layout>
        </BrowserRouter>
      </SubjectProvider>
    </AuthProvider>
  )
}
