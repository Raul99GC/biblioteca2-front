"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import type { Reservation, QRCheckEvent } from "@/lib/types"
import { validateQRCheckInByScanning, validateQRCheckOutByScanning, parseScannedQR } from "@/lib/api"
import jsQR from "jsqr"
import {
  Camera, CheckCircle2, XCircle, Loader2, QrCode, LogIn, LogOut, User, MapPin, Clock, AlertTriangle,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

interface QRScannerDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  validadorId: string
  onCheckComplete: (reservaId: string, tipo: "check-in" | "check-out", hora: string) => void
}

type ScanStep = "camera" | "scanning" | "found" | "validating" | "success" | "error"

export function QRScannerDialog({ open, onOpenChange, validadorId, onCheckComplete }: QRScannerDialogProps) {
  const [step, setStep] = useState<ScanStep>("camera")
  const [error, setError] = useState<string | null>(null)
  const [foundReservation, setFoundReservation] = useState<Reservation | null>(null)
  const [scannedQR, setScannedQR] = useState<string | null>(null)
  const [result, setResult] = useState<QRCheckEvent | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [manualQR, setManualQR] = useState<string>("")
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const detectorRef = useRef<any>(null)
  const scanIntervalRef = useRef<number | null>(null)

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (scanIntervalRef.current) {
      clearTimeout(scanIntervalRef.current)
      scanIntervalRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
  }, [])

  // Start camera stream
  const startCamera = useCallback(async () => {
    setCameraError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 640 }, height: { ideal: 480 } },
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.muted = true
        videoRef.current.playsInline = true
        videoRef.current.autoplay = true
        await videoRef.current.play()
        startScanning()
      }
    } catch (err) {
      console.error("Camera error:", err)
      setCameraError("No se pudo acceder a la camara. Verifica los permisos del navegador.")
    }
  }, [])

  const startScanning = async () => {
    const video = videoRef.current
    const canvas = canvasRef.current

    if (!video || !canvas) return

    const barcodeSupported = typeof (window as any).BarcodeDetector !== "undefined"
    if (barcodeSupported && !detectorRef.current) {
      try {
        detectorRef.current = new (window as any).BarcodeDetector({ formats: ["qr_code"] })
      } catch (err) {
        console.error("BarcodeDetector init error:", err)
        detectorRef.current = null
      }
    }

    const context = canvas.getContext("2d")
    if (!context) {
      setCameraError("No se pudo preparar el canvas para escaneo.")
      return
    }

    const scanFrame = async () => {
      if (!video) return
      if (video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) {
        scanIntervalRef.current = window.setTimeout(scanFrame, 250)
        return
      }

      canvas.width = video.videoWidth || 640
      canvas.height = video.videoHeight || 480
      context.drawImage(video, 0, 0, canvas.width, canvas.height)

      try {
        let qrText: string | null = null

        if (barcodeSupported && detectorRef.current) {
          const barcodes = await detectorRef.current.detect(canvas)
          if (barcodes.length > 0 && barcodes[0]?.rawValue) {
            qrText = barcodes[0].rawValue
          }
        }

        if (!qrText) {
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
          const code = jsQR(imageData.data, canvas.width, canvas.height, { inversionAttempts: "attemptBoth" })
          if (code?.data) {
            qrText = code.data
          }
        }

        if (qrText) {
          handleQRDetected(qrText)
          return
        }
      } catch (err) {
        console.error("QR detection error:", err)
      }

      scanIntervalRef.current = window.setTimeout(scanFrame, 250)
    }

    scanFrame()
  }

  // Handle QR detection (called when a QR is found)
  const handleQRDetected = async (qrData: string) => {
    stopCamera()
    setStep("scanning")
    setScannedQR(qrData)
    
    try {
      const parseResult = await parseScannedQR(qrData)
      if (parseResult.success && parseResult.reservation) {
        setFoundReservation(parseResult.reservation)
        setStep("found")
      } else {
        setError(parseResult.error || "Codigo QR no valido")
        setStep("error")
      }
    } catch {
      setError("Error al procesar el codigo QR")
      setStep("error")
    }
  }

  const handleCaptureQR = async () => {
    setError(null)
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) {
      setError("No se puede capturar el QR. Reinicia la cámara.")
      return
    }

    let attempts = 0
    while (video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA && attempts < 5) {
      await new Promise((resolve) => setTimeout(resolve, 250))
      attempts += 1
    }

    if (video.readyState < HTMLMediaElement.HAVE_ENOUGH_DATA) {
      setError("La cámara aún no está lista. Intenta de nuevo en unos segundos.")
      return
    }

    const context = canvas.getContext("2d")
    if (!context) {
      setError("No se pudo preparar el canvas para captura.")
      return
    }

    const width = Math.max(640, video.videoWidth || 640)
    const height = Math.max(480, video.videoHeight || 480)
    canvas.width = width
    canvas.height = height
    context.drawImage(video, 0, 0, width, height)

    const scanImageData = (imageData: ImageData): string | null => {
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "attemptBoth",
      })
      return code?.data || null
    }

    const detectNative = async (source: HTMLCanvasElement): Promise<string | null> => {
      if (!detectorRef.current) return null
      try {
        const barcodes = await detectorRef.current.detect(source)
        if (barcodes.length > 0 && barcodes[0]?.rawValue) {
          return barcodes[0].rawValue
        }
      } catch (err) {
        console.error("QR capture native error:", err)
      }
      return null
    }

    const scanRegion = (x: number, y: number, w: number, h: number): string | null => {
      try {
        const imageData = context.getImageData(x, y, w, h)
        return scanImageData(imageData)
      } catch (err) {
        console.error("QR capture region error:", err)
        return null
      }
    }

    const tryScanFullCanvas = async (): Promise<string | null> => {
      const nativeResult = await detectNative(canvas)
      if (nativeResult) return nativeResult
      return scanImageData(context.getImageData(0, 0, width, height))
    }

    const centerSize = Math.min(width, height) * 0.75
    const centerX = Math.max(0, Math.floor((width - centerSize) / 2))
    const centerY = Math.max(0, Math.floor((height - centerSize) / 2))
    const centerWidth = Math.floor(centerSize)
    const centerHeight = Math.floor(centerSize)

    let qrText: string | null = await tryScanFullCanvas()
    if (!qrText) {
      qrText = scanRegion(centerX, centerY, centerWidth, centerHeight)
    }
    if (!qrText) {
      const smallSize = Math.min(width, height) * 0.5
      const smallX = Math.max(0, Math.floor((width - smallSize) / 2))
      const smallY = Math.max(0, Math.floor((height - smallSize) / 2))
      qrText = scanRegion(smallX, smallY, Math.floor(smallSize), Math.floor(smallSize))
    }

    if (qrText) {
      handleQRDetected(qrText)
    } else {
      setError("No se encontró un QR en la captura. Ajusta el encuadre y prueba otra vez.")
    }
  }

  const handleCheckIn = async () => {
    if (!scannedQR) return
    setStep("validating")
    
    try {
      const response = await validateQRCheckInByScanning(scannedQR, validadorId)
      if (response.success && response.event) {
        setResult(response.event)
        setStep("success")
        onCheckComplete(response.event.reservaId, "check-in", response.event.hora)
      } else {
        setError(response.error || "Error al validar check-in")
        setStep("error")
      }
    } catch {
      setError("Error de conexion al validar")
      setStep("error")
    }
  }

  const handleCheckOut = async () => {
    if (!scannedQR) return
    setStep("validating")
    
    try {
      const response = await validateQRCheckOutByScanning(scannedQR, validadorId)
      if (response.success && response.event) {
        setResult(response.event)
        setStep("success")
        onCheckComplete(response.event.reservaId, "check-out", response.event.hora)
      } else {
        setError(response.error || "Error al validar check-out")
        setStep("error")
      }
    } catch {
      setError("Error de conexion al validar")
      setStep("error")
    }
  }

  const handleClose = () => {
    stopCamera()
    setStep("camera")
    setError(null)
    setFoundReservation(null)
    setScannedQR(null)
    setResult(null)
    setCameraError(null)
    onOpenChange(false)
  }

  const handleRetry = () => {
    setError(null)
    setFoundReservation(null)
    setScannedQR(null)
    setStep("camera")
    startCamera()
  }

  // Start camera when dialog opens
  useEffect(() => {
    if (open && step === "camera") {
      startCamera()
    }
    return () => {
      if (!open) stopCamera()
    }
  }, [open, step, startCamera, stopCamera])

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Camera className="h-5 w-5 text-primary" />
            Escanear QR de Estudiante
          </DialogTitle>
          <DialogDescription>
            Escanea el codigo QR que muestra el estudiante para registrar su asistencia
          </DialogDescription>
        </DialogHeader>

        {/* Camera View */}
        {step === "camera" && (
          <div className="flex flex-col items-center gap-4">
            <div className="relative aspect-square w-full max-w-[300px] overflow-hidden rounded-xl border-2 border-dashed border-border bg-muted">
              {cameraError ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 p-4 text-center">
                  <AlertTriangle className="h-10 w-10 text-destructive" />
                  <p className="text-sm text-muted-foreground">{cameraError}</p>
                  <Button size="sm" variant="outline" onClick={startCamera}>
                    Reintentar
                  </Button>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    className="h-full w-full object-cover"
                    playsInline
                    muted
                  />
                  <canvas ref={canvasRef} className="hidden" />
                  {/* Scanning overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-48 w-48 rounded-lg border-2 border-primary/50">
                      <div className="h-full w-full animate-pulse rounded-lg border-2 border-dashed border-primary" />
                    </div>
                  </div>
                </>
              )}
            </div>
            
            <p className="text-center text-xs text-muted-foreground">
              Posiciona el codigo QR dentro del recuadro
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <Button type="button" size="sm" onClick={handleCaptureQR} className="gap-2">
                <QrCode className="h-4 w-4" />
                Capturar QR
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={startCamera} className="gap-2">
                <QrCode className="h-4 w-4" />
                Reiniciar cámara
              </Button>
            </div>

            <div className="flex flex-col gap-2 w-full max-w-md">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="manual-qr">
                Ingresar código QR manual
              </label>
              <div className="flex gap-2">
                <input
                  id="manual-qr"
                  value={manualQR}
                  onChange={(event) => setManualQR(event.target.value)}
                  placeholder="Pega el texto del QR aquí"
                  className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (manualQR.trim()) {
                      handleQRDetected(manualQR.trim())
                    }
                  }}
                >
                  Enviar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Si el escaneo no funciona, pega aquí el texto del código QR.
              </p>
            </div>

            {error && (
              <p className="text-center text-sm text-destructive">{error}</p>
            )}

            {cameraError && (
              <div className="flex flex-col gap-2">
                <label className="text-xs font-medium text-muted-foreground" htmlFor="manual-qr">
                  Código QR manual
                </label>
                <div className="flex gap-2">
                  <input
                    id="manual-qr"
                    value={manualQR}
                    onChange={(event) => setManualQR(event.target.value)}
                    placeholder="Pega aquí el código QR"
                    className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                  <Button
                    size="sm"
                    onClick={() => {
                      if (manualQR.trim()) {
                        handleQRDetected(manualQR.trim())
                      }
                    }}
                  >
                    Enviar
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Scanning/Processing */}
        {step === "scanning" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <p className="font-medium text-foreground">Procesando codigo QR...</p>
          </div>
        )}

        {/* Found Reservation - Show details and action buttons */}
        {step === "found" && foundReservation && (
          <div className="flex flex-col gap-4">
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <p className="font-semibold text-foreground">{foundReservation.sala.nombre}</p>
                  <p className="text-sm text-muted-foreground">{foundReservation.fecha}</p>
                </div>
                <Badge variant={foundReservation.estado === "confirmada" ? "default" : "secondary"}>
                  {foundReservation.estado}
                </Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-3.5 w-3.5" />
                  <span>Usuario: {foundReservation.usuarioId}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" />
                  <span>{foundReservation.sala.ubicacion}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>{foundReservation.horaInicio} - {foundReservation.horaFin}</span>
                </div>
              </div>

              {/* Current status */}
              <div className="mt-3 flex items-center gap-4 border-t border-border pt-3">
                <div className="flex items-center gap-1.5">
                  <div className={`h-2 w-2 rounded-full ${foundReservation.checkIn ? "bg-green-500" : "bg-muted-foreground"}`} />
                  <span className="text-xs text-muted-foreground">
                    Check-in: {foundReservation.checkIn || "Pendiente"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className={`h-2 w-2 rounded-full ${foundReservation.checkOut ? "bg-green-500" : "bg-muted-foreground"}`} />
                  <span className="text-xs text-muted-foreground">
                    Check-out: {foundReservation.checkOut || "Pendiente"}
                  </span>
                </div>
              </div>
            </div>

            {/* Action buttons based on reservation state */}
            <div className="flex gap-2">
              {foundReservation.estado === "confirmada" && !foundReservation.checkIn && (
                <Button onClick={handleCheckIn} className="flex-1 gap-2">
                  <LogIn className="h-4 w-4" />
                  Registrar Check-in
                </Button>
              )}
              {foundReservation.estado === "en-uso" && foundReservation.checkIn && !foundReservation.checkOut && (
                <Button onClick={handleCheckOut} className="flex-1 gap-2">
                  <LogOut className="h-4 w-4" />
                  Registrar Check-out
                </Button>
              )}
              {foundReservation.estado === "completada" && (
                <div className="flex-1 rounded-lg bg-accent/50 p-3 text-center">
                  <p className="text-sm font-medium text-accent-foreground">Sesion ya completada</p>
                </div>
              )}
              <Button variant="outline" onClick={handleRetry}>
                Escanear otro
              </Button>
            </div>
          </div>
        )}

        {/* Validating */}
        {step === "validating" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">Validando...</p>
              <p className="text-sm text-muted-foreground">Registrando asistencia</p>
            </div>
          </div>
        )}

        {/* Success */}
        {step === "success" && result && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/30">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">
                {result.tipo === "check-in" ? "Check-in registrado" : "Check-out registrado"}
              </p>
              <p className="text-sm text-muted-foreground">
                {result.hora} - {result.fecha}
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleRetry} variant="outline">
                Escanear otro
              </Button>
              <Button onClick={handleClose}>
                Cerrar
              </Button>
            </div>
          </div>
        )}

        {/* Error */}
        {step === "error" && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-foreground">Error</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleRetry} variant="outline">
                Reintentar
              </Button>
              <Button onClick={handleClose}>
                Cerrar
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
