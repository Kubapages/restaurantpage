import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import { reservationsAPI } from '../api/client'

const LOCATION_ICONS = { 'Window': '🪟', 'Terrace': '🌿', 'Main Hall': '🕯️', 'Private Room': '🔒' }

export default function NewReservation() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const slot = state?.slot

  const [partySize, setPartySize] = useState(2)
  const [specialRequests, setSpecialRequests] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!slot) {
    return (
      <div className="page">
        <div className="container" style={{ textAlign: 'center' }}>
          <p className="text-muted">Brak wybranego terminu.</p>
          <Link to="/slots" className="btn btn-primary" style={{ marginTop: 16 }}>
            Wróć do terminów
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await reservationsAPI.create({
        slot_id: slot.id,
        party_size: Number(partySize),
        special_requests: specialRequests || null,
      })
      navigate('/reservations', { state: { newId: res.data.id } })
    } catch (err) {
      setError(err.response?.data?.detail || 'Nie udało się dokonać rezerwacji.')
    } finally {
      setLoading(false)
    }
  }

  const start = new Date(slot.start_time)
  const end = new Date(slot.end_time)

  return (
    <div className="page">
      <div className="container">
        <Link to="/slots" style={{ color: 'var(--text-muted)', fontSize: 13, textDecoration: 'none' }}>
          ← Wróć do terminów
        </Link>

        <div style={{ maxWidth: 560, margin: '40px auto' }}>
          <span className="section-label">Potwierdzenie</span>
          <h1 className="section-title" style={{ marginBottom: 32 }}>Nowa rezerwacja</h1>

          {/* Slot Summary */}
          <div className="card" style={{ marginBottom: 24, background: 'var(--bg-elevated)', borderColor: 'var(--gold)' }}>
            <span className="section-label">Wybrany termin</span>
            <div style={{ display: 'flex', gap: 32, marginTop: 12 }}>
              <div>
                <p className="form-label" style={{ marginBottom: 4 }}>Stolik</p>
                <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--cream)' }}>
                  {LOCATION_ICONS[slot.table.location]} #{slot.table.number}
                </p>
                <p className="text-muted" style={{ fontSize: 13 }}>{slot.table.location}</p>
              </div>
              <div>
                <p className="form-label" style={{ marginBottom: 4 }}>Data</p>
                <p style={{ color: 'var(--cream)', fontSize: 16 }}>
                  {format(start, 'EEEE, d MMMM yyyy', { locale: pl })}
                </p>
              </div>
              <div>
                <p className="form-label" style={{ marginBottom: 4 }}>Godzina</p>
                <p style={{ color: 'var(--cream)', fontSize: 16 }}>
                  {format(start, 'HH:mm')} – {format(end, 'HH:mm')}
                </p>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="card fade-in">
            {error && <div className="alert alert-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Liczba osób</label>
                <select
                  className="form-select"
                  value={partySize}
                  onChange={e => setPartySize(e.target.value)}
                  required
                >
                  {Array.from({ length: slot.table.capacity }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'osoba' : n < 5 ? 'osoby' : 'osób'}
                    </option>
                  ))}
                </select>
                <p className="text-muted" style={{ fontSize: 12 }}>
                  Ten stolik pomieści maksymalnie {slot.table.capacity} osoby
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Specjalne życzenia (opcjonalnie)</label>
                <textarea
                  className="form-input"
                  value={specialRequests}
                  onChange={e => setSpecialRequests(e.target.value)}
                  placeholder="Alergie, dieta wegetariańska, okazja specjalna..."
                  rows={3}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                <Link to="/slots" className="btn btn-outline" style={{ flex: 1 }}>
                  Anuluj
                </Link>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ flex: 2 }}
                  disabled={loading}
                >
                  {loading ? 'Rezerwuję...' : '✓ Potwierdź rezerwację'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
