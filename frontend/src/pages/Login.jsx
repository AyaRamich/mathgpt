import { useState } from 'react'
import api from '../lib/api'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [mode, setMode] = useState('login')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [needsVerification, setNeedsVerification] = useState(false)
  const [verificationCode, setVerificationCode] = useState('')
  const [pendingEmail, setPendingEmail] = useState('')
  const [debugCode, setDebugCode] = useState('')

  const handleGoogle = () => {
    window.location.href = `${API_URL}/api/auth/google`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')
    setLoading(true)

    try {
      if (needsVerification) {
        await api.post('/api/auth/email/verify', { email: pendingEmail, code: verificationCode })
        setNeedsVerification(false)
        setVerificationCode('')
        setMessage('Compte vérifié. Vous pouvez maintenant vous connecter.')
        setMode('login')
        return
      }

      const endpoint = mode === 'login' ? '/api/auth/email/login' : '/api/auth/email/register'
      const res = await api.post(endpoint, form)
      setMessage(res.data.message || 'Succès')

      if (mode === 'login') {
        window.location.href = '/dashboard'
      } else {
        setPendingEmail(form.email)
        setNeedsVerification(true)
        setDebugCode(res.data?.debugCode || '')
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Une erreur est survenue')
      setDebugCode(err.response?.data?.debugCode || '')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError('')
    setMessage('')
    setLoading(true)

    try {
      const res = await api.post('/api/auth/email/resend-verification', { email: pendingEmail })
      setMessage(res.data.message || 'Code renvoyé')
      setDebugCode(res.data?.debugCode || '')
    } catch (err) {
      setError(err.response?.data?.error || 'Impossible de renvoyer le code')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="card">
        <div className="logo">∑</div>

        <h1 className="brand">
          Math<span className="accent">GPT</span>
        </h1>

        <p className="lead">Solve complex problems step by step</p>

        {needsVerification ? (
          <form onSubmit={handleSubmit} className="auth-form">
            <p className="small-muted">Un code a été envoyé à {pendingEmail}</p>
            <input
              className="auth-input"
              type="text"
              inputMode="numeric"
              placeholder="Code à 6 chiffres"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              required
            />

            {error ? <div className="error-box">{error}</div> : null}
            {message ? <div className="success-box">{message}</div> : null}

            <button type="submit" className="btn-primary full" disabled={loading}>
              {loading ? 'Chargement...' : 'Vérifier mon compte'}
            </button>
            <button type="button" className="btn-ghost full" onClick={handleResend} disabled={loading}>
              Renvoyer le code
            </button>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <input
              className="auth-input"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
            <input
              className="auth-input"
              type="password"
              placeholder="Mot de passe"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />

            <div className="auth-tabs">
              <button type="button" className={mode === 'login' ? 'auth-tab active' : 'auth-tab'} onClick={() => setMode('login')}>
                Connexion
              </button>
              <button type="button" className={mode === 'register' ? 'auth-tab active' : 'auth-tab'} onClick={() => setMode('register')}>
                Inscription
              </button>
            </div>

            {error ? <div className="error-box">{error}</div> : null}
            {message ? <div className="success-box">{message}</div> : null}

            <button type="submit" className="btn-primary full" disabled={loading}>
              {loading ? 'Chargement...' : mode === 'login' ? 'Se connecter' : 'Créer un compte'}
            </button>
          </form>
        )}

        <div className="divider">ou</div>

        <button onClick={handleGoogle} className="btn-primary google-btn">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continue with Google
        </button>

        <p className="small-muted">Financial • Statistical • Algebraic</p>
      </div>
    </div>
  )
}
