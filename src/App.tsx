import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { AdminNotificationsProvider } from './contexts/AdminNotificationsContext';
import { GuestProgressProvider } from './contexts/GuestProgressContext';
import { Header } from './components/layout/Header';
import { AnnouncementBar } from './components/layout/AnnouncementBar';
import { HeroMediaBanner } from './components/layout/HeroMediaBanner';
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
import { AdminChatPage } from './pages/AdminChatPage';
import { JoinClassPage } from './pages/JoinClassPage';
import { EscapeRoomsPage } from './pages/EscapeRoomsPage';
import { MyEscapeRoomsPage } from './pages/MyEscapeRoomsPage';
import { CreateEscapeRoomPage } from './pages/CreateEscapeRoomPage';
import { EditEscapeRoomPage } from './pages/EditEscapeRoomPage';
import { EscapeRoomPlayPage } from './pages/EscapeRoomPlayPage';
import { ConsentGate } from './components/auth/ConsentGate';
import './i18n/config';

export default function App() {
  return (
    <AuthProvider>
      <AdminNotificationsProvider>
      <GuestProgressProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <div className="min-h-screen bg-background">
            <AnnouncementBar />
            <Header />
            <HeroMediaBanner />
            <main>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/library" element={<LibraryPage />} />
                <Route path="/play/:setId" element={<ConsentGate><GamePickerPage /></ConsentGate>} />
                <Route path="/play/:setId/:gameKey" element={<ConsentGate><GameShell /></ConsentGate>} />
                <Route path="/join" element={
                  <ProtectedRoute roles={['student']}><JoinClassPage /></ProtectedRoute>
                } />
                <Route path="/escape-rooms" element={<EscapeRoomsPage />} />
                <Route path="/escape-room/:roomId" element={<ConsentGate><EscapeRoomPlayPage /></ConsentGate>} />
                <Route path="/teacher/create-escape-room" element={
                  <ProtectedRoute roles={['teacher']}><CreateEscapeRoomPage /></ProtectedRoute>
                } />
                <Route path="/teacher/my-escape-rooms" element={
                  <ProtectedRoute roles={['teacher']}><MyEscapeRoomsPage /></ProtectedRoute>
                } />
                <Route path="/escape-room/edit/:roomId" element={
                  <ProtectedRoute roles={['teacher', 'admin']}><EditEscapeRoomPage /></ProtectedRoute>
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
                <Route path="/admin/chat" element={
                  <ProtectedRoute roles={['admin']}><AdminChatPage /></ProtectedRoute>
                } />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </GuestProgressProvider>
      </AdminNotificationsProvider>
    </AuthProvider>
  );
}
