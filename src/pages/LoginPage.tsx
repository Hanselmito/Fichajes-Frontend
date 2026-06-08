import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      await login(username, password)
      navigate('/')
    } catch (caughtError) {
      const message = caughtError instanceof Error ? caughtError.message : 'No se pudo iniciar sesion'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div id="loginScreen" className="login-container">
      <div className="login-box">
        <h1 style={{ textAlign: 'center', marginBottom: '30px', color: '#667eea' }}>🔐 Control Horario</h1>
        {error && (
          <div id="loginAlert">
            <div className="alert alert-error" style={{ marginBottom: '15px' }}>{error}</div>
          </div>
        )}
        <form id="loginForm" onSubmit={handleSubmit}>
          <div className="form-group" style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Usuario</label>
            <input
              type="text"
              id="loginUsername"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Contraseña</label>
            <input
              type="password"
              id="loginPassword"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ddd' }}
            />
          </div>
          <button 
            type="submit" 
            className="btn btn-primary btn-full-width" 
            disabled={submitting}
            style={{ width: '100%', padding: '12px', background: '#667eea', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}
          >
            {submitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}
