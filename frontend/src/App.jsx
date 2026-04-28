import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { AuthProvider } from './store/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Slots from './pages/Slots'
import NewReservation from './pages/NewReservation'
import Reservations from './pages/Reservations'

export default function App() {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar isOnline={isOnline} />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/slots"
            element={<ProtectedRoute><Slots /></ProtectedRoute>}
          />
          <Route
            path="/new-reservation"
            element={<ProtectedRoute><NewReservation /></ProtectedRoute>}
          />
          <Route
            path="/reservations"
            element={<ProtectedRoute><Reservations isOnline={isOnline} /></ProtectedRoute>}
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
