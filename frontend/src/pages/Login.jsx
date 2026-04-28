import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/slots')
    } catch (err) {
      setError(err.response?.data?.detail || 'Nieprawidłowy email lub hasło')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 440 }} className="fade-in">
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span className="section-label">Dostęp do konta</span>
          <h1 className="section-title" style={{ fontSize: 36 }}>Zaloguj się</h1>
          <div className="gold-line" style={{ margin: '16px auto' }} />
        </div>

        <div className="card">
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Adres e-mail</label>
              <input
                className="form-input"
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="twoj@email.pl"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Hasło</label>
              <input
                className="form-input"
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 8 }}
              disabled={loading}
            >
              {loading ? 'Logowanie...' : 'Zaloguj się'}
            </button>
          </form>

          <div className="divider">lub</div>

          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            Nie masz konta?{' '}
            <Link to="/register" style={{ color: 'var(--gold)', textDecoration: 'none' }}>
              Zarejestruj się
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
