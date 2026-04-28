import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { restaurantAPI } from '../api/client'
import { useAuth } from '../store/AuthContext'

const DAYS_PL = {
  Monday: 'Poniedziałek', Tuesday: 'Wtorek', Wednesday: 'Środa',
  Thursday: 'Czwartek', Friday: 'Piątek', Saturday: 'Sobota', Sunday: 'Niedziela'
}

export default function Home() {
  const [info, setInfo] = useState(null)
  const { user } = useAuth()

  useEffect(() => {
    restaurantAPI.getInfo()
      .then(res => setInfo(res.data))
      .catch(() => {})
  }, [])

  return (
    <div>
      {/* Hero */}
      <section style={{
        minHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background texture */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 80% 60% at 60% 40%, rgba(201,169,110,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `repeating-linear-gradient(
            0deg, transparent, transparent 39px,
            rgba(201,169,110,0.03) 39px, rgba(201,169,110,0.03) 40px
          )`,
          pointerEvents: 'none',
        }} />

        <div className="container fade-in">
          <span className="section-label">Wrocław — od 1998</span>
          <h1 className="display-title" style={{ marginBottom: 28 }}>
            Wyjątkowe chwile<br />
            zasługują na <em>wyjątkowy</em><br />
            stół
          </h1>
          <p style={{ color: 'var(--text-muted)', maxWidth: 480, marginBottom: 40, fontSize: 16, lineHeight: 1.8 }}>
            {info?.description || 'Zarezerwuj stolik w La Maison Dorée i pozwól nam zadbać o każdy szczegół Twojego wieczoru.'}
          </p>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {user ? (
              <Link to="/slots" className="btn btn-primary">
                Zarezerwuj stolik
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary">
                  Zarezerwuj stolik
                </Link>
                <Link to="/login" className="btn btn-outline">
                  Mam już konto
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Info Section */}
      {info && (
        <section className="page" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="gold-line" />
            <div className="ornament" style={{ marginBottom: 48 }}>
              Informacje o restauracji
            </div>

            <div className="grid-3" style={{ marginBottom: 48 }}>
              <div className="card fade-in">
                <span className="section-label">Adres</span>
                <p style={{ fontSize: 16, color: 'var(--cream)' }}>{info.address}</p>
                <p className="text-muted" style={{ fontSize: 14, marginTop: 8 }}>Centrum Wrocławia</p>
              </div>
              <div className="card fade-in" style={{ animationDelay: '0.1s' }}>
                <span className="section-label">Kontakt</span>
                <p style={{ fontSize: 16, color: 'var(--cream)' }}>{info.phone}</p>
                <p className="text-muted" style={{ fontSize: 14, marginTop: 4 }}>{info.email}</p>
              </div>
              <div className="card fade-in" style={{ animationDelay: '0.2s' }}>
                <span className="section-label">Kuchnia</span>
                <p style={{ fontSize: 16, color: 'var(--cream)' }}>{info.cuisine}</p>
                <p style={{ color: 'var(--gold)', fontSize: 14, marginTop: 4 }}>
                  {'★'.repeat(Math.round(info.rating))} {info.rating}/5
                </p>
              </div>
            </div>

            {/* Opening Hours */}
            <div className="card fade-in">
              <span className="section-label">Godziny otwarcia</span>
              <div className="grid-2" style={{ marginTop: 16 }}>
                {Object.entries(info.opening_hours).map(([day, hours]) => (
                  <div key={day} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '10px 0',
                    borderBottom: '1px solid var(--border)',
                  }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>
                      {DAYS_PL[day] || day}
                    </span>
                    <span style={{
                      color: hours === 'Closed' ? 'var(--error)' : 'var(--cream)',
                      fontSize: 14,
                    }}>
                      {hours === 'Closed' ? 'Zamknięte' : hours}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
