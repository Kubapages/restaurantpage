import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'

export default function Register() {
  const [form, setForm] = useState({ email: '', full_name: '', password: '', confirm: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError('Hasła nie są identyczne')
      return
    }
    if (form.password.length < 6) {
      setError('Hasło musi mieć minimum 6 znaków')
      return
    }
    setLoading(true)
    try {
      await register(form.email, form.full_name, form.password)
      navigate('/slots')
    } catch (err) {
      setError(err.response?.data?.detail || 'Błąd rejestracji. Sprawdź dane i spróbuj ponownie.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: '100%', maxWidth: 440 }} className="fade-in">
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <span className="section-label">Nowe konto</span>
          <h1 className="section-title" style={{ fontSize: 36 }}>Dołącz do nas</h1>
          <div className="gold-line" style={{ margin: '16px auto' }} />
        </div>

        <div className="card">
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Imię i nazwisko</label>
              <input
                className="form-input"
                type="text"
                name="full_name"
                value={form.full_name}
                onChange={handleChange}
                placeholder="Jan Kowalski"
                required
              />
            </div>
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
                placeholder="Minimum 6 znaków"
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Potwierdź hasło</label>
              <input
                className="form-input"
                type="password"
                name="confirm"
                value={form.confirm}
                onChange={handleChange}
                placeholder="Powtórz hasło"
                required
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 8 }}
              disabled={loading}
            >
              {loading ? 'Tworzenie konta...' : 'Utwórz konto'}
            </button>
          </form>

          <div className="divider">lub</div>

          <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 14 }}>
            Masz już konto?{' '}
            <Link to="/login" style={{ color: 'var(--gold)', textDecoration: 'none' }}>
              Zaloguj się
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
