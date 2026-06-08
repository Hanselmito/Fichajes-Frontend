import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { apiClient, getErrorMessage, withAccessRefresh } from '../api/client'

type QrScannerState = 'idle' | 'scanning' | 'processing' | 'success' | 'error'

export function FicharPage() {
  const readerRef = useRef<HTMLDivElement>(null)
  const scannerRef = useRef<Html5Qrcode | null>(null)
  
  const [scannerState, setScannerState] = useState<QrScannerState>('idle')
  const [statusMessage, setStatusMessage] = useState<string>('')
  const [fichajeType, setFichajeType] = useState<'entrada' | 'salida'>('entrada')

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(console.error)
      }
    }
  }, [])

  const startScanner = async () => {
    if (!readerRef.current) return

    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop()
    }

    setScannerState('scanning')
    setStatusMessage('Buscando cámara...')

    scannerRef.current = new Html5Qrcode(readerRef.current.id)
    
    const qrboxFunction = (viewfinderWidth: number) => {
      const minEdgePercentage = 0.7
      const minEdgeSize = Math.min(viewfinderWidth, 300)
      const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage)
      return {
        width: qrboxSize,
        height: qrboxSize
      }
    }

    try {
      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: qrboxFunction, aspectRatio: 1.0 },
        async (decodedText) => {
          if (scannerState !== 'scanning') return
          // Stop scanner upon reading
          if (scannerRef.current?.isScanning) {
            await scannerRef.current.stop()
          }
          await processScan(decodedText)
        },
        () => {
          // Ignore parse errors, they happen continuously until a QR is found
        }
      )
      setStatusMessage('Apunta la cámara al código QR')
    } catch (err) {
      console.error('Error starting scanner:', err)
      setScannerState('error')
      setStatusMessage('No se pudo acceder a la cámara. Verifica los permisos.')
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop()
    }
    setScannerState('idle')
    setStatusMessage('')
  }

  const processScan = async (qrCode: string) => {
    setScannerState('processing')
    setStatusMessage('Procesando código QR...')

    try {
      // Analizamos si es una url con info pre-cargada, aunque lo enviaremos igual al backend para validar
      let locationName = 'Desconocido'
      let locationType = ''
      
      if (qrCode.startsWith('http://') || qrCode.startsWith('https://')) {
        const url = new URL(qrCode)
        const params = new URLSearchParams(url.search)
        locationType = params.get('qr') || ''
        locationName = decodeURIComponent(params.get('name') || '')
      }

      setStatusMessage(`Confirmando ${locationType === 'zona' ? 'zona' : 'cliente'} ${locationName ? `(${locationName})` : ''}...`)

      // Simularemos la llamada al backend enviando solo el qrCode
      // El controlador de Laravel se encargará de resolver el qrCode a un clientId o zoneId
      const payload = {
        type: fichajeType,
        qrCode: qrCode,
        latitude: null as number | null,
        longitude: null as number | null,
      }

      // Si el navegador soporta geolocalización, lo intentamos añadir rápido
      if ('geolocation' in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 })
          })
          payload.latitude = position.coords.latitude
          payload.longitude = position.coords.longitude
        } catch (geoError) {
          console.warn('No se pudo obtener la geolocalización a tiempo:', geoError)
        }
      }

      const result = await withAccessRefresh(() => apiClient.POST('/records', {
        body: payload
      }))

      if (result.error) {
        throw new Error(getErrorMessage(result.error, 'Error al registrar el fichaje'))
      }

      setScannerState('success')
      setStatusMessage(`¡Fichaje de ${fichajeType} registrado con éxito!`)
      
      setTimeout(() => {
        setScannerState('idle')
        setStatusMessage('')
      }, 3000)

    } catch (error) {
      console.error(error)
      setScannerState('error')
      setStatusMessage(error instanceof Error ? error.message : 'Error desconocido')
      setTimeout(() => {
        setScannerState('idle')
        setStatusMessage('')
      }, 4000)
    }
  }

  const handleManualPunch = async (type: 'entrada' | 'salida') => {
    setScannerState('processing')
    setStatusMessage(`Registrando ${type} manual (Teletrabajo)...`)

    try {
      const payload = {
        type: type,
        qrCode: null,
        latitude: null as number | null,
        longitude: null as number | null,
      }

      if ('geolocation' in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 3000 })
          })
          payload.latitude = position.coords.latitude
          payload.longitude = position.coords.longitude
        } catch (geoError) {
          console.warn('No se pudo obtener la geolocalización a tiempo:', geoError)
        }
      }

      const result = await withAccessRefresh(() => apiClient.POST('/records', {
        body: payload
      }))

      if (result.error) {
        throw new Error(getErrorMessage(result.error, 'Error al registrar el fichaje manual'))
      }

      setScannerState('success')
      setStatusMessage(`¡Fichaje manual de ${type} registrado con éxito!`)
      
      setTimeout(() => {
        setScannerState('idle')
        setStatusMessage('')
      }, 3000)

    } catch (error) {
      console.error(error)
      setScannerState('error')
      setStatusMessage(error instanceof Error ? error.message : 'Error desconocido')
      setTimeout(() => {
        setScannerState('idle')
        setStatusMessage('')
      }, 4000)
    }
  }

  const handleBreak = async (breakType: 'comida' | 'cafe' | 'personal' | 'fin') => {
    setStatusMessage(`Procesando descanso: ${breakType}...`)
    // Simulation of break for now
    setTimeout(() => {
        setStatusMessage(`Descanso (${breakType}) procesado (simulado).`)
        setTimeout(() => setStatusMessage(''), 3000)
    }, 1000)
  }

  return (
    <div className="card">
      <h2>⏱️ Registrar Fichaje</h2>

      <div className="card fichar-qr-card">
        <h3>📱 Fichaje en Zona/Cliente con QR</h3>
        <p className="fichar-card-copy">Escanea el código QR de tu zona o cliente para registrar entrada o salida:</p>
        
        <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
          <label style={{ marginRight: '1rem', fontWeight: 'bold' }}>
            <input 
              type="radio" 
              name="fichajeType" 
              value="entrada" 
              checked={fichajeType === 'entrada'}
              onChange={() => setFichajeType('entrada')}
              style={{ marginRight: '0.5rem' }}
            />
            Entrada
          </label>
          <label style={{ fontWeight: 'bold' }}>
            <input 
              type="radio" 
              name="fichajeType" 
              value="salida" 
              checked={fichajeType === 'salida'}
              onChange={() => setFichajeType('salida')}
              style={{ marginRight: '0.5rem' }}
            />
            Salida
          </label>
        </div>

        {scannerState === 'idle' && (
          <div style={{ textAlign: 'center' }}>
            <button className="btn btn-primary" onClick={startScanner} style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}>
              📷 Escanear QR
            </button>
          </div>
        )}

        {scannerState === 'scanning' && (
          <div style={{ textAlign: 'center' }}>
            <button className="btn btn-secondary" onClick={stopScanner}>
              Cancelar Escaneo
            </button>
          </div>
        )}

        {statusMessage && (
          <div className={`alert ${scannerState === 'error' ? 'alert-error' : scannerState === 'success' ? 'alert-success' : 'alert-info'}`} style={{ marginTop: '1rem' }}>
            {statusMessage}
          </div>
        )}

        <div id="qr-reader-container" className="fichar-qr-reader" style={{ marginTop: '2rem', display: scannerState === 'idle' || scannerState === 'success' ? 'none' : 'block' }}>
          <div id="qr-reader" ref={readerRef} style={{ width: '100%', margin: '0 auto', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}></div>
        </div>
      </div>

      <div className="card fichar-breaks-card">
          <h3>☕ Descansos</h3>
          <div className="fichar-actions-row fichar-actions-row-tight">
              <button className="btn btn-break-meal btn-action-wide" onClick={() => handleBreak('comida')}>
                  🍽️ Comida
              </button>
              <button className="btn btn-break-coffee btn-action-wide" onClick={() => handleBreak('cafe')}>
                  ☕ Café
              </button>
              <button className="btn btn-break-personal btn-action-wide" onClick={() => handleBreak('personal')}>
                  ⏸️ Personal
              </button>
              <button className="btn btn-danger btn-action-wide" onClick={() => handleBreak('fin')}>
                  ⏹️ Finalizar
              </button>
          </div>
      </div>

      <div className="card fichar-manual-card">
          <h3>🖱️ Fichaje Rápido (Manual)</h3>
          <p className="fichar-manual-helper">Úsalo solo si no puedes escanear el QR</p>
          <p className="fichar-manual-note"><em>Se registrará como teletrabajo</em></p>
          <div className="fichar-actions-row">
              <button className="btn btn-success btn-fichar-main" onClick={() => handleManualPunch('entrada')}>
                  ✅ ENTRADA
              </button>
              <button className="btn btn-danger btn-fichar-main" onClick={() => handleManualPunch('salida')}>
                  ❌ SALIDA
              </button>
          </div>
      </div>
    </div>
  )
}
