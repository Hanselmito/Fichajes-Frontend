import { useEffect, useRef, useState } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { apiClient, getErrorMessage, withAccessRefresh } from '../api/client'
import { PageHeader } from '../components/PageHeader'

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

  return (
    <>
      <PageHeader
        eyebrow="Control Horario"
        subtitle="Escanea el código QR de un cliente o zona para registrar tu entrada o salida."
        title="Fichar con QR"
      />

      <section className="table-card resource-shell-card" style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
        
        <div style={{ marginBottom: '1.5rem' }}>
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
          <button className="primary-button" onClick={startScanner} style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}>
            📷 Escanear QR para Fichar
          </button>
        )}

        {scannerState === 'scanning' && (
          <button className="secondary-button" onClick={stopScanner}>
            Cancelar Escaneo
          </button>
        )}

        {statusMessage && (
          <div className={`alert ${scannerState === 'error' ? 'alert-error' : scannerState === 'success' ? 'alert-success' : 'alert-info'}`} style={{ marginTop: '1rem' }}>
            {statusMessage}
          </div>
        )}

        <div id="qr-reader-container" style={{ marginTop: '2rem', display: scannerState === 'idle' || scannerState === 'success' ? 'none' : 'block' }}>
          <div id="qr-reader" ref={readerRef} style={{ width: '100%', margin: '0 auto', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}></div>
        </div>

      </section>
    </>
  )
}
