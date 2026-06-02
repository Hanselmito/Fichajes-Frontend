import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/useAuth'

export function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('password')
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
    <div className="login-shell">
      <section className="hero-panel">
        <div className="login-brand-block">
          <div className="brand-mark login-brand-mark">FP</div>
          <div>
            <span className="eyebrow">Panel de acceso</span>
            <h1 className="hero-title">Sistema de Fichaje Profesional</h1>
          </div>
        </div>

        <div>
          <p className="hero-copy">
            Esta version React toma como referencia visual el `index.html` legacy y mantiene el
            contrato nuevo del backend Laravel: autenticacion, restauracion de sesion y
            navegacion derivada de `capabilities`.
          </p>
        </div>

        <div className="feature-list">
          <div className="feature-item">
            <strong>Estilo base legacy</strong>
            <span>Cabecera clara, tarjetas blancas, navegacion lateral y acentos azules.</span>
          </div>
          <div className="feature-item">
            <strong>Contrato unico</strong>
            <span>Tipos generados desde `../fichaje-backend/docs/openapi.yaml`.</span>
          </div>
          <div className="feature-item">
            <strong>Sesion moderna</strong>
            <span>Access token corto con refresh flow y restauracion automatica.</span>
          </div>
        </div>
      </section>

      <section className="login-panel">
        <div>
          <span className="eyebrow">Acceso</span>
          <h2 className="section-title">Entrar al panel</h2>
          <p className="panel-copy">
            Usa un usuario real de la base legacy para comprobar permisos, dashboard y renovacion
            automatica de sesion.
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="username">Usuario</label>
            <input
              id="username"
              onChange={(event) => setUsername(event.target.value)}
              value={username}
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Contrasena</label>
            <input
              id="password"
              onChange={(event) => setPassword(event.target.value)}
              type="password"
              value={password}
            />
          </div>

          {error ? <div className="error-banner">{error}</div> : null}

          <div className="inline-actions">
            <button className="primary-button" disabled={submitting} type="submit">
              {submitting ? 'Entrando...' : 'Iniciar sesion'}
            </button>
          </div>
        </form>

        <div className="hint-box">
          Backend esperado: `http://127.0.0.1:8000/api` por proxy local de Vite en `5173`.
        </div>
      </section>
    </div>
  )
}
