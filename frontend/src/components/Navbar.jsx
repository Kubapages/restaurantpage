import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../store/AuthContext'

export default function Navbar({ isOnline }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <div className="container navbar-inner">
        <Link to="/" className="navbar-logo">
          La <span>Maison</span> Dorée
        </Link>

        <ul className="navbar-links">
          <li><NavLink to="/">O nas</NavLink></li>
          {user && <li><NavLink to="/slots">Wolne terminy</NavLink></li>}
          {user && <li><NavLink to="/reservations">Moje rezerwacje</NavLink></li>}
          {!isOnline && (
            <li><span style={{ color: 'var(--gold)', fontSize: 12 }}>⚡ Tryb offline</span></li>
          )}
        </ul>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {user ? (
            <>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                {user.full_name.split(' ')[0]}
              </span>
              <button className="btn-nav" onClick={handleLogout}>Wyloguj</button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn-nav">Zaloguj</Link>
              <Link to="/register" style={{ color: 'var(--gold)', fontSize: 13, textDecoration: 'none' }}>
                Rejestracja
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  )
}
