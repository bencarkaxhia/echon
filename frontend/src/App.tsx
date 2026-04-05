/**
 * Echon Main App
 * Complete routing system
 * 
 * PATH: echon/frontend/src/App.tsx
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './pages/Landing';
import Register from './pages/Register';
import Login from './pages/Login';
import JoinSpace from './pages/JoinSpace';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import SpaceSelector from './pages/SpaceSelector';
import CreateSpace from './pages/CreateSpace';
import Space from './pages/Space';
import Memories from './pages/Memories';
import Family from './pages/Family';
import MemberProfile from './pages/MemberProfile';
import FamilyTree from './pages/FamilyTree';
import Stories from './pages/Stories';
import Now from './pages/Now';
import Chat from './pages/Chat';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        {/* Magic-link invite: echon.app/join/:token */}
        <Route path="/join/:token" element={<JoinSpace />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Protected routes (require authentication) */}
        <Route
          path="/select-space"
          element={
            <ProtectedRoute>
              <SpaceSelector />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-space"
          element={
            <ProtectedRoute>
              <CreateSpace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/space"
          element={
            <ProtectedRoute>
              <Space />
            </ProtectedRoute>
          }
        />

        {/* Placeholder routes for doors (will build later) */}
        <Route
          path="/space/memories"
          element={
            <ProtectedRoute>
              <Memories />
            </ProtectedRoute>
          }
        />
        <Route
          path="/space/stories"
          element={
            <ProtectedRoute>
              <Stories />
            </ProtectedRoute>
          }
        />
        <Route
          path="/space/family"
          element={
            <ProtectedRoute>
              <Family />
            </ProtectedRoute>
          }
        />
        <Route
          path="/space/family/tree"
          element={
            <ProtectedRoute>
              <FamilyTree />
            </ProtectedRoute>
          }
        />
        <Route
          path="/space/family/:memberId"
          element={
            <ProtectedRoute>
              <MemberProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/space/now"
          element={
            <ProtectedRoute>
              <Now />
            </ProtectedRoute>
          }
        />
        <Route
          path="/space/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;