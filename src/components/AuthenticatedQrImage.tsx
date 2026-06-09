import { useEffect, useState } from 'react'
import { getApiBaseUrl } from '../api/config'
import { getStoredAccessToken } from '../auth/session'

type AuthenticatedQrImageProps = {
  code: string | null | undefined
  alt: string
  className?: string
  size?: number
}

type QrImageState = {
  requestKey: string
  imageUrl: string | null
  loadError: string | null
}

function resolveQrUrl(code: string, size: number): string {
  const baseUrl = getApiBaseUrl().replace(/\/$/, '')
  const path = `/qr-generator?code=${encodeURIComponent(code)}&size=${size}`

  if (baseUrl.startsWith('http://') || baseUrl.startsWith('https://')) {
    return `${baseUrl}${path}`
  }

  return `${window.location.origin}${baseUrl}${path}`
}

export function AuthenticatedQrImage({ code, alt, className, size = 280 }: AuthenticatedQrImageProps) {
  const requestKey = code ? `${code}:${size}` : ''
  const [state, setState] = useState<QrImageState>({
    requestKey: '',
    imageUrl: null,
    loadError: null,
  })

  useEffect(() => {
    if (!code) {
      return
    }

    const controller = new AbortController()
    const token = getStoredAccessToken()
    let objectUrl: string | null = null

    void (async () => {
      try {
        const response = await fetch(resolveQrUrl(code, size), {
          method: 'GET',
          headers: {
            Accept: 'image/png',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('No se pudo cargar la imagen QR')
        }

        const blob = await response.blob()
        objectUrl = URL.createObjectURL(blob)
        setState({
          requestKey,
          imageUrl: objectUrl,
          loadError: null,
        })
      } catch (error) {
        if (controller.signal.aborted) {
          return
        }

        setState({
          requestKey,
          imageUrl: null,
          loadError: error instanceof Error ? error.message : 'No se pudo cargar la imagen QR',
        })
      }
    })()

    return () => {
      controller.abort()
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [code, requestKey, size])

  if (!code) {
    return <div className="employee-overview-empty">No hay QR disponible.</div>
  }

  const imageUrl = state.requestKey === requestKey ? state.imageUrl : null
  const loadError = state.requestKey === requestKey ? state.loadError : null

  if (loadError) {
    return <div className="employee-overview-empty">{loadError}</div>
  }

  if (!imageUrl) {
    return <div className="employee-overview-empty">Cargando QR...</div>
  }

  return <img alt={alt} className={className} src={imageUrl} />
}