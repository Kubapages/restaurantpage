import { useState, useEffect, useCallback } from 'react'
import { useLocation, Link } from 'react-router-dom'
import { format } from 'date-fns'
import { pl } from 'date-fns/locale'
import { reservationsAPI } from '../api/client'
import { saveReservationsLocally, getLocalReservations, updateLocalReservation, getLastSyncTime } from '../offline/db'

const LOCATION_ICONS = { 'Window': '🪟', 'Terrace': '🌿', 'Main Hall': '🕯️', 'Private Room': '🔒' }

function ReservationCard({ res, onCancel, isOffline }) {
  const [cancelling, setCancelling] = useState(false)
  const start = new Date(res.slot.start_time)
  const isPast = start < new Date()

  const handleCancel = async () => {
    if (!confirm('Czy na pewno chcesz anulować tę rezerwację?')) return
    setCancelling(true)
    await onCancel(res.id)
    setCancelling(false)
  }

  return (
    <div className="card fade-in" style={{
      borderColor: res.status === 'active' && !isPast ? 'var(--border)' : 'transparent',
      opacity: res.status === 'cancelled' ? 0.6 : 1,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div>
          <span className={`badge badge-${res.status === 'active' && !isPast ? 'active' : res.status === 'cancelled' ? 'cancelled' : 'completed'}`}>
            {res.status === 'active' && !isPast ? 'Aktywna'
              : res.status === 'cancelled' ? 'Anulowana'
              : 'Zakończona'}
          </span>
          {res._local_change && (
            <span className="badge badge-offline" style={{ marginLeft: 8 }}>⚡ Lokalnie</span>
          )}
        </div>
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          #{res.id}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 16 }}>
        <div>
          <p className="form-label" style={{ marginBottom: 4 }}>Stolik</p>
          <p style={{ fontFamily: 'var(--font-display)', fontSize: 20, color: 'var(--cream)' }}>
            {LOCATION_ICONS[res.table.location]} #{res.table.number}
          </p>
          <p className="text-muted" style={{ fontSize: 13 }}>{res.table.location}</p>
        </div>
        <div>
          <p className="form-label" style={{ marginBottom: 4 }}>Data i godzina</p>
          <p style={{ color: 'var(--cream)', fontSize: 15 }}>
            {format(start, 'EEEE, d MMMM', { locale: pl })}
          </p>
          <p className="text-muted" style={{ fontSize: 13 }}>
            {format(start, 'HH:mm')} – {format(new Date(res.slot.end_time), 'HH:mm')}
          </p>
        </div>
        <div>
          <p className="form-label" style={{ marginBottom: 4 }}>Liczba osób</p>
          <p style={{ color: 'var(--cream)', fontSize: 15 }}>{res.party_size}</p>
        </div>
        {res.special_requests && (
          <div style={{ flex: 1, minWidth: 200 }}>
            <p className="form-label" style={{ marginBottom: 4 }}>Życzenia</p>
            <p className="text-muted" style={{ fontSize: 13 }}>{res.special_requests}</p>
          </div>
        )}
      </div>

      {res.status === 'active' && !isPast && !isOffline && (
        <button
          className="btn btn-danger btn-sm"
          onClick={handleCancel}
          disabled={cancelling}
        >
          {cancelling ? 'Anulowanie...' : 'Anuluj rezerwację'}
        </button>
      )}
      {isOffline && res.status === 'active' && !isPast && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
          ⚡ Anulowanie dostępne po przywróceniu połączenia
        </p>
      )}
    </div>
  )
}

export default function Reservations({ isOnline }) {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [isOffline, setIsOffline] = useState(false)
  const [lastSync, setLastSync] = useState(null)
  const { state } = useLocation()

  const loadReservations = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      // Try to load from server
      const res = await reservationsAPI.getMyReservations()
      setReservations(res.data)
      setIsOffline(false)
      // Save to IndexedDB for offline use
      await saveReservationsLocally(res.data)
      setLastSync(new Date().toLocaleTimeString('pl'))
    } catch (err) {
      if (!navigator.onLine || err.code === 'ERR_NETWORK') {
        // Load from local IndexedDB
        const local = await getLocalReservations()
        if (local.length > 0) {
          setReservations(local)
          setIsOffline(true)
          const syncedAt = local[0]?.synced_at
          setLastSync(syncedAt ? new Date(syncedAt).toLocaleTimeString('pl') : null)
        } else {
          setError('Brak połączenia z internetem i brak danych lokalnych.')
        }
      } else {
        setError('Nie udało się załadować rezerwacji.')
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadReservations()

    // Re-sync when coming back online
    const handleOnline = () => loadReservations()
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [loadReservations])

  const handleCancel = async (id) => {
    try {
      await reservationsAPI.cancel(id)
      // Optimistic update
      setReservations(prev =>
        prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r)
      )
      // Update local DB too
      await updateLocalReservation(id, { status: 'cancelled' })
    } catch (err) {
      setError(err.response?.data?.detail || 'Nie udało się anulować rezerwacji.')
    }
  }

  const active = reservations.filter(r => r.status === 'active' && new Date(r.slot.start_time) >= new Date())
  const past = reservations.filter(r => r.status !== 'active' || new Date(r.slot.start_time) < new Date())

  return (
    <div className="page">
      <div className="container">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
          <div>
            <span className="section-label">Historia</span>
            <h1 className="section-title">Moje rezerwacje</h1>
          </div>
          {!isOffline && (
            <Link to="/slots" className="btn btn-primary btn-sm">
              + Nowa rezerwacja
            </Link>
          )}
        </div>

        {/* Offline Banner */}
        {isOffline && (
          <div className="offline-banner">
            <span>⚡</span>
            <div>
              <strong>Tryb offline</strong> — wyświetlane są ostatnio pobrane dane.
              {lastSync && <span style={{ marginLeft: 8, opacity: 0.7 }}>Ostatnia synchronizacja: {lastSync}</span>}
            </div>
          </div>
        )}

        {/* Online sync notice */}
        {!isOffline && lastSync && (
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
            ✓ Zsynchronizowano o {lastSync}
          </p>
        )}

        {state?.newId && (
          <div className="alert alert-success" style={{ marginBottom: 24 }}>
            ✓ Rezerwacja #{state.newId} została pomyślnie złożona!
          </div>
        )}

        {loading ? (
          <div className="loader"><div className="spinner" /></div>
        ) : error ? (
          <div className="alert alert-error">{error}</div>
        ) : reservations.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: 60 }}>
            <p style={{ fontSize: 40, marginBottom: 16 }}>📋</p>
            <p className="text-muted">Nie masz jeszcze żadnych rezerwacji.</p>
            <Link to="/slots" className="btn btn-primary" style={{ marginTop: 20 }}>
              Zarezerwuj stolik
            </Link>
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <div style={{ marginBottom: 40 }}>
                <p className="section-label" style={{ marginBottom: 16 }}>Aktywne ({active.length})</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {active.map(r => (
                    <ReservationCard key={r.id} res={r} onCancel={handleCancel} isOffline={isOffline} />
                  ))}
                </div>
              </div>
            )}

            {past.length > 0 && (
              <div>
                <p className="section-label" style={{ marginBottom: 16 }}>Poprzednie ({past.length})</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {past.map(r => (
                    <ReservationCard key={r.id} res={r} onCancel={handleCancel} isOffline={isOffline} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
