import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AdminDashboard } from './features/misc/routes/AdminDashboard'
import Auth from './features/auth/routes/Auth'

export default function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/auth/login" replace />} />
        <Route path="/login" element={<Navigate to="/auth/login" replace />} />
  <Route path="/auth/login" element={<Auth />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<Navigate to="/auth/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
