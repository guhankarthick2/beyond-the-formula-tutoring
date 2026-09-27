import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { AuthProvider } from '@/lib/auth'
import { MessageInboxProvider } from '@/lib/messageInbox'
import { OpenQuestionsInboxProvider } from '@/lib/openQuestionsInbox'
import { AdminReportsInboxProvider } from '@/lib/adminReportsInbox'
import { SubjectProvider } from '@/lib/subject'
import { AdminPage } from '@/pages/AdminPage'
import { AuthPage } from '@/pages/AuthPage'
import { HomePage } from '@/pages/HomePage'
import { MentorDashboardPage } from '@/pages/MentorDashboardPage'
import { MentorHomePage } from '@/pages/MentorHomePage'
import { PrivacyPolicyPage } from '@/pages/PrivacyPolicyPage'
import { RequestPage } from '@/pages/RequestPage'
import { ResourcesPage } from '@/pages/ResourcesPage'
import { SessionsPage } from '@/pages/SessionsPage'
import { PastSessionsPage } from '@/pages/PastSessionsPage'
import { QuestionsDetailPage, QuestionsListPage } from '@/pages/QuestionsPage'
import { CourseDetailPage, CoursesListPage } from '@/pages/CoursesPage'
import { MentorProfilePage, MentorsAboutPage } from '@/pages/MentorsAboutPage'
import { StudentHubPage, StudentSubjectPage } from '@/pages/StudentHubPage'
import { StudentMySessionsPage } from '@/pages/StudentMySessionsPage'
import { TermsOfServicePage } from '@/pages/TermsOfServicePage'
import { Unit1TestPage } from '@/pages/Unit1TestPage'
import { Unit1Topics13TestPage } from '@/pages/Unit1Topics13TestPage'
import { Unit1Topics1314TestPage } from '@/pages/Unit1Topics1314TestPage'
import { Unit1Topics1112TestPage } from '@/pages/Unit1Topics1112TestPage'

export default function App() {
  return (
    <AuthProvider>
      <MessageInboxProvider>
        <OpenQuestionsInboxProvider>
          <AdminReportsInboxProvider>
            <SubjectProvider>
              <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '') || '/'}>
                <Layout>
                  <Routes>
                    <Route path="/" element={<HomePage />} />
                    <Route path="/students" element={<StudentHubPage />} />
                    <Route path="/students/resources" element={<ResourcesPage />} />
                    <Route path="/students/resources/:subjectSlug" element={<ResourcesPage />} />
                    <Route path="/students/my-sessions" element={<StudentMySessionsPage />} />
                    <Route path="/students/precal/tests/unit-1" element={<Unit1TestPage />} />
                    <Route path="/students/precal/tests/unit-1-1-3" element={<Unit1Topics13TestPage />} />
                    <Route path="/students/precal/tests/unit-1-13-14" element={<Unit1Topics1314TestPage />} />
                    <Route path="/students/precal/tests/unit-1-11-12" element={<Unit1Topics1112TestPage />} />
                    <Route path="/students/:subjectSlug" element={<StudentSubjectPage />} />
                    <Route path="/students/:subjectSlug/schedule" element={<SessionsPage />} />
                    <Route path="/students/:subjectSlug/past" element={<PastSessionsPage />} />
                    <Route path="/students/:subjectSlug/questions" element={<QuestionsListPage />} />
                    <Route path="/students/:subjectSlug/questions/:id" element={<QuestionsDetailPage />} />
                    <Route path="/students/:subjectSlug/courses" element={<CoursesListPage />} />
                    <Route path="/students/:subjectSlug/courses/:courseSlug" element={<CourseDetailPage />} />
                    <Route path="/mentors" element={<MentorsAboutPage />} />
                    <Route path="/mentors/join" element={<MentorHomePage />} />
                    <Route path="/mentors/p/:slug" element={<MentorProfilePage />} />
                    <Route path="/mentors/dashboard" element={<MentorDashboardPage />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/privacy" element={<PrivacyPolicyPage />} />
                    <Route path="/terms" element={<TermsOfServicePage />} />
                    <Route path="/request" element={<RequestPage />} />
                    <Route path="/admin" element={<AdminPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </Layout>
              </BrowserRouter>
            </SubjectProvider>
          </AdminReportsInboxProvider>
        </OpenQuestionsInboxProvider>
      </MessageInboxProvider>
    </AuthProvider>
  )
}
