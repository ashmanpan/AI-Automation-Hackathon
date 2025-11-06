import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { ErrorBoundary } from './components/common'
import { useAuthStore } from './store/authStore'
import Login from './pages/Login'
import { AdminRoute, JudgeRoute, ParticipantRoute } from './components/auth/ProtectedRoute'
import AdminLayout from './components/layouts/AdminLayout'
import JudgeLayout from './components/layouts/JudgeLayout'
import ParticipantLayout from './components/layouts/ParticipantLayout'

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard'
import ManageUsers from './pages/admin/ManageUsers'
import ManageHackathons from './pages/admin/ManageHackathons'
import CreateHackathon from './pages/admin/CreateHackathon'
import ManageTeams from './pages/admin/ManageTeams'
import TeamDetails from './pages/admin/TeamDetails'
import ManageExercises from './pages/admin/ManageExercises'
import CreateExercise from './pages/admin/CreateExercise'
import EditExercise from './pages/admin/EditExercise'
import AdminSubmissions from './pages/admin/AdminSubmissions'
import AdminLeaderboard from './pages/admin/AdminLeaderboard'

// Judge pages
import JudgeDashboard from './pages/judge/JudgeDashboard'
import GradingQueue from './pages/judge/GradingQueue'
import GradeSubmission from './pages/judge/GradeSubmission'
import GradingHistory from './pages/judge/GradingHistory'

// Participant pages
import ParticipantDashboard from './pages/participant/ParticipantDashboard'
import ExerciseList from './pages/participant/ExerciseList'
import ExerciseDetail from './pages/participant/ExerciseDetail'
import MySubmissions from './pages/participant/MySubmissions'
import UserGuide from './pages/participant/UserGuide'

// Public pages
import Leaderboard from './pages/public/Leaderboard'

function App() {
  const initialize = useAuthStore((state) => state.initialize)

  // Initialize auth state from localStorage on app startup
  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a1a1a',
              color: '#fff',
              border: '1px solid #333',
            },
          }}
        />

        <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Admin Routes - Protected */}
        <Route
          path="/admin/dashboard"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminRoute>
              <AdminLayout>
                <ManageUsers />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/hackathons"
          element={
            <AdminRoute>
              <AdminLayout>
                <ManageHackathons />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/hackathons/create"
          element={
            <AdminRoute>
              <AdminLayout>
                <CreateHackathon />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/teams"
          element={
            <AdminRoute>
              <AdminLayout>
                <ManageTeams />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/teams/:id"
          element={
            <AdminRoute>
              <AdminLayout>
                <TeamDetails />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/exercises"
          element={
            <AdminRoute>
              <AdminLayout>
                <ManageExercises />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/exercises/create"
          element={
            <AdminRoute>
              <AdminLayout>
                <CreateExercise />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/exercises/:id"
          element={
            <AdminRoute>
              <AdminLayout>
                <EditExercise />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/submissions"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminSubmissions />
              </AdminLayout>
            </AdminRoute>
          }
        />
        <Route
          path="/admin/leaderboard"
          element={
            <AdminRoute>
              <AdminLayout>
                <AdminLeaderboard />
              </AdminLayout>
            </AdminRoute>
          }
        />

        {/* Judge Routes - Protected */}
        <Route
          path="/judge/dashboard"
          element={
            <JudgeRoute>
              <JudgeLayout>
                <JudgeDashboard />
              </JudgeLayout>
            </JudgeRoute>
          }
        />
        <Route
          path="/judge/queue"
          element={
            <JudgeRoute>
              <JudgeLayout>
                <GradingQueue />
              </JudgeLayout>
            </JudgeRoute>
          }
        />
        <Route
          path="/judge/grade/:submissionId"
          element={
            <JudgeRoute>
              <JudgeLayout>
                <GradeSubmission />
              </JudgeLayout>
            </JudgeRoute>
          }
        />
        <Route
          path="/judge/history"
          element={
            <JudgeRoute>
              <JudgeLayout>
                <GradingHistory />
              </JudgeLayout>
            </JudgeRoute>
          }
        />

        {/* Participant Routes - Protected */}
        <Route
          path="/participant/dashboard"
          element={
            <ParticipantRoute>
              <ParticipantLayout>
                <ParticipantDashboard />
              </ParticipantLayout>
            </ParticipantRoute>
          }
        />
        <Route
          path="/participant/exercises"
          element={
            <ParticipantRoute>
              <ParticipantLayout>
                <ExerciseList />
              </ParticipantLayout>
            </ParticipantRoute>
          }
        />
        <Route
          path="/participant/exercises/:exerciseId"
          element={
            <ParticipantRoute>
              <ParticipantLayout>
                <ExerciseDetail />
              </ParticipantLayout>
            </ParticipantRoute>
          }
        />
        <Route
          path="/participant/submissions"
          element={
            <ParticipantRoute>
              <ParticipantLayout>
                <MySubmissions />
              </ParticipantLayout>
            </ParticipantRoute>
          }
        />
        <Route
          path="/participant/guide"
          element={
            <ParticipantRoute>
              <ParticipantLayout>
                <UserGuide />
              </ParticipantLayout>
            </ParticipantRoute>
          }
        />

        {/* Public Routes - No authentication required */}
        <Route path="/leaderboard" element={<Leaderboard />} />

        {/* 404 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

export default App
