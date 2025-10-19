import { Routes, Route } from 'react-router-dom'
import Home from '../features/misc/routes/Home'
import { AdminDashboard as Dashboard } from '../features/misc/routes/AdminDashboard'

export default function RoutesIndex(){
  return (
    <Routes>
      <Route path="/" element={<Home/>} />
      <Route path="/dashboard" element={<Dashboard/>} />
    </Routes>
  )
}
