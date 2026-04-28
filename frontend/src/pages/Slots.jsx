import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, addDays } from 'date-fns'
import { pl } from 'date-fns/locale'
import { slotsAPI } from '../api/client'

const LOCATION_ICONS = {
  'Window': '🪟',
  'Terrace': '🌿',
  'Main Hall': '🕯️',
  'Private Room': '🔒',
}

function SlotCard({ slot, selected, onSelect }) {
  const start = new Date(slot.start_time)
  const end = new Date(slot.end_time)
  return (
    <div
      className={`card card-hover ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(slot)}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <span style={{ fontSize: 13, color: 'var(--gold)', letterSpacing: '0.08em' }}>
            {LOCATION_ICONS[slot.table.location] || '🍽️'} {slot.table.location}
          </span>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 22, color: 'var(--cream)', marginTop: 2 }}>
            Stolik #{slot.table.number}
          </p>
        </div>
        {selected && (
          <span style={{
            width: 24, height: 24, borderRadius: '50%',
            background: 'var(--gold)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--bg)', fontSize: 12,
          }}>✓</span>
        )}
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        <div>
          <p className="form-label" style={{ marginBottom: 4 }}>Godzina</p>
          <p style={{ color: 'var(--cream)', fontSize: 15 }}>
            {format(start, 'HH:mm')} – {format(end, 'HH:mm')}
          </p>
        </div>
        <div>
          <p className="form-label" style={{ marginBottom: 4 }}>Miejsca</p>
          <p style={{ color: 'var(--cream)', fontSize: 15 }}>
            do {slot.table.capacity} osób
          </p>
        </div>
      </div>
    </div>
  )
}

export default function Slots() {
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [partySize, setPartySize] = useState('')
  const [selectedSlot, setSelectedSlot] = useState(null)
  const navigate = useNavigate()

  // Generate next 14 days for the date picker
  const dates = Array.from({ length: 14 }, (_, i) => {
    const d = addDays(new Date(), i)
    return { value: format(d, 'yyyy-MM-dd'), label: format(d, 'EEE dd MMM', { locale: pl }) }
  })

  useEffect(() => {
    fetchSlots()
  }, [selectedDate, partySize])

  const fetchSlots = async () => {
    setLoading(true)
    setError('')
    setSelectedSlot(null)
    try {
      const params = { date: selectedDate }
      if (partySize) params.party_size = partySize
      const res = await slotsAPI.getAll(params)
      setSlots(res.data)
    } catch {
      setError('Nie udało się załadować dostępnych terminów.')
    } finally {
      setLoading(false)
    }
  }

  const handleBook = () => {
    if (selectedSlot) {
      navigate('/new-reservation', { state: { slot: selectedSlot } })
    }
  }

  return (
    <div className="page">
      <div className="container">
        <span className="section-label">Rezerwacja online</span>
        <h1 className="section-title" style={{ marginBottom: 32 }}>Wolne terminy</h1>

        {/* Filters */}
        <div className="card" style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div className="form-group" style={{ flex: 1, minWidth: 200, marginBottom: 0 }}>
              <label className="form-label">Wybierz datę</label>
              <select
                className="form-select"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
              >
                {dates.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ flex: 1, minWidth: 160, marginBottom: 0 }}>
              <label className="form-label">Liczba osób</label>
              <select
                className="form-select"
                value={partySize}
                onChange={e => setPartySize(e.target.value)}
              >
                <option value="">Dowolna</option>
                {[1,2,3,4,5,6,7,8].map(n => (
                  <option key={n} value={n}>{n} {n === 1 ? 'osoba' : n < 5 ? 'osoby' : 'osób'}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Slots Grid */}
        {loading ? (
          <div className="loader"><div className="spinner" /></div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : slots.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 60 }}>
            <p style={{ fontSize: 40, marginBottom: 16 }}>🍽️</p>
            <p className="text-muted">Brak wolnych stolików w wybranym terminie.</p>
            <p className="text-muted" style={{ fontSize: 13 }}>Spróbuj wybrać inną datę lub liczbę osób.</p>
          </div>
        ) : (
          <>
            <p className="text-muted" style={{ marginBottom: 16, fontSize: 14 }}>
              Znaleziono <strong style={{ color: 'var(--cream)' }}>{slots.length}</strong> wolnych terminów
            </p>
            <div className="grid-2 fade-in" style={{ marginBottom: 24 }}>
              {slots.map(slot => (
                <SlotCard
                  key={slot.id}
                  slot={slot}
                  selected={selectedSlot?.id === slot.id}
                  onSelect={setSelectedSlot}
                />
              ))}
            </div>

            {selectedSlot && (
              <div style={{
                position: 'sticky', bottom: 24,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--gold)',
                borderRadius: 'var(--radius)',
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 8px 40px rgba(0,0,0,0.6)',
              }}>
                <div>
                  <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Wybrany stolik</p>
                  <p style={{ fontFamily: 'var(--font-display)', fontSize: 18, color: 'var(--cream)' }}>
                    Stolik #{selectedSlot.table.number} — {selectedSlot.table.location} —{' '}
                    {format(new Date(selectedSlot.start_time), 'HH:mm')}
                  </p>
                </div>
                <button className="btn btn-primary" onClick={handleBook}>
                  Przejdź do rezerwacji →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
