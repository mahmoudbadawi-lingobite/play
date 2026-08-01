import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { GuestProgressProvider } from './contexts/GuestProgressContext';
import { Header } from './components/layout/Header';
import { AnnouncementBar } from './components/layout/AnnouncementBar';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { LibraryPage } from './pages/LibraryPage';
import { GamePickerPage } from './pages/GamePickerPage';
import { GameShell } from './components/games/GameShell';
import { CreateContentPage } from './pages/CreateContentPage';
import { MyGamesPage } from './pages/MyGamesPage';
import { EditContentPage } from './pages/EditContentPage';
import { TeacherClassesPage } from './pages/TeacherClassesPage';
import { AdminPage } from './pages/AdminPage';
import { JoinClassPage } from './pages/JoinClassPage';
import { ConsentGate } from './components/auth/ConsentGate';
import './i18n/config';

export default function App() {
  return (
    <AuthProvider>
      <GuestProgressProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <div className="min-h-screen bg-background">
            <AnnouncementBar />
            <Header />
            <main>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/library" element={<LibraryPage />} />
                <Route path="/play/:setId" element={<ConsentGate><GamePickerPage /></ConsentGate>} />
                <Route path="/play/:setId/:gameKey" element={<ConsentGate><GameShell /></ConsentGate>} />
                <Route path="/join" element={
                  <ProtectedRoute roles={['student']}><JoinClassPage /></ProtectedRoute>
                } />

                <Route path="/dashboard" element={
                  <ProtectedRoute><DashboardPage /></ProtectedRoute>
                } />
                <Route path="/teacher/create" element={
                  <ProtectedRoute roles={['teacher']}><CreateContentPage /></ProtectedRoute>
                } />
                <Route path="/teacher/my-games" element={
                  <ProtectedRoute roles={['teacher']}><MyGamesPage /></ProtectedRoute>
                } />
                <Route path="/teacher/edit/:setId" element={
                  <ProtectedRoute roles={['teacher', 'admin']}><EditContentPage /></ProtectedRoute>
                } />
                <Route path="/teacher/classes" element={
                  <ProtectedRoute roles={['teacher']}><TeacherClassesPage /></ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute roles={['admin']}><AdminPage /></ProtectedRoute>
                } />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </GuestProgressProvider>
    </AuthProvider>
  );
}
