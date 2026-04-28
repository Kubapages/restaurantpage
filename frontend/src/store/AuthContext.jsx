import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const clearAuth = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    if (token && storedUser) {
      setUser(JSON.parse(storedUser))
      // Verify token is still valid against server
      authAPI.me()
        .then(res => setUser(res.data))
        .catch(() => clearAuth())
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const login = async (email, password) => {
    const res = await authAPI.login({ email, password })
    const { access_token } = res.data
    localStorage.setItem('token', access_token)
    const meRes = await authAPI.me()
    setUser(meRes.data)
    localStorage.setItem('user', JSON.stringify(meRes.data))
    return meRes.data
  }

  const register = async (email, full_name, password) => {
    await authAPI.register({ email, full_name, password })
    return login(email, password)
  }

  const logout = () => clearAuth()

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

