import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import MobileShell from '@/components/layout/MobileShell'
import ProfileInputPage from '@/pages/ProfileInputPage'
import OotdUploadPage from '@/pages/OotdUploadPage'
import AnalysisPage from '@/pages/AnalysisPage'
import StyleProfilePage from '@/pages/StyleProfilePage'
import MatchListPage from '@/pages/MatchListPage'
import LoginPage from '@/pages/LoginPage'

function App() {
  const { user, loading, init } = useAuthStore()

  useEffect(() => {
    const unsubscribe = init()
    return unsubscribe
  }, [init])

  if (loading) {
    return (
      <MobileShell>
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </MobileShell>
    )
  }

  return (
    <BrowserRouter>
      <MobileShell>
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/profile" /> : <LoginPage />} />
          <Route path="/profile" element={user ? <ProfileInputPage /> : <Navigate to="/login" />} />
          <Route path="/upload" element={user ? <OotdUploadPage /> : <Navigate to="/login" />} />
          <Route path="/analyzing" element={user ? <AnalysisPage /> : <Navigate to="/login" />} />
          <Route path="/style-profile" element={user ? <StyleProfilePage /> : <Navigate to="/login" />} />
          <Route path="/matches" element={user ? <MatchListPage /> : <Navigate to="/login" />} />
          <Route path="*" element={<Navigate to={user ? '/profile' : '/login'} />} />
        </Routes>
      </MobileShell>
    </BrowserRouter>
  )
}

export default App
