"use client"

import type { Reservation } from "@/lib/types"
import { QRCodeDisplay } from "@/components/qr-code-display"
import {
  QrCode, CheckCircle2, LogIn, LogOut, Clock, Info,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"

interface QRCheckDialogProps {
  reservation: Reservation
  open: boolean
  onOpenChange: (open: boolean) => void
  onCheckComplete?: (reservaId: string, tipo: "check-in" | "check-out", hora: string) => void
}

/**
 * QRCheckDialog - Shows the student's QR code for the reservation.
 * Students show this QR to a profesor/admin who scans it to register check-in/out.
 * Students CANNOT do check-in themselves - this is display only.
 */
export function QRCheckDialog({ reservation, open, onOpenChange }: QRCheckDialogProps) {
  const hasCheckedIn = !!reservation.checkIn
  const hasCheckedOut = !!reservation.checkOut
  const isCompleted = reservation.estado === "completada"

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <QrCode className="h-5 w-5 text-primary" />
            Mi Codigo QR
          </DialogTitle>
          <DialogDescription>
            {reservation.sala.nombre} - {reservation.fecha}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-2">
          {/* QR Code */}
          <div className="rounded-xl border-2 border-dashed border-border bg-card p-4">
            <QRCodeDisplay
              value={reservation.codigoQR || reservation.id}
              size={180}
            />
          </div>

          <p className="max-w-[280px] text-center text-xs text-muted-foreground">
            Codigo: <span className="font-mono font-medium text-foreground">{reservation.codigoQR}</span>
          </p>

          {/* Status timeline */}
          <div className="flex w-full items-center justify-center gap-6 rounded-lg bg-muted/50 p-3">
            <div className="flex flex-col items-center gap-1">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${hasCheckedIn ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                <LogIn className="h-4 w-4" />
              </div>
              <span className="text-[10px] text-muted-foreground">Check-in</span>
              {hasCheckedIn && <span className="text-[10px] font-medium text-primary">{reservation.checkIn}</span>}
            </div>
            <div className={`h-px w-8 ${hasCheckedIn ? "bg-primary" : "bg-border"}`} />
            <div className="flex flex-col items-center gap-1">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${hasCheckedOut ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                <LogOut className="h-4 w-4" />
              </div>
              <span className="text-[10px] text-muted-foreground">Check-out</span>
              {hasCheckedOut && <span className="text-[10px] font-medium text-primary">{reservation.checkOut}</span>}
            </div>
          </div>

          {/* Horario */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            <span>Horario reservado: {reservation.horaInicio} - {reservation.horaFin}</span>
          </div>

          {/* Status message */}
          {isCompleted ? (
            <Badge className="bg-accent/60 text-accent-foreground">
              <CheckCircle2 className="mr-1 h-3 w-3" /> Sesion completada
            </Badge>
          ) : (
            <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Muestra este codigo QR a un profesor o administrador para registrar tu {!hasCheckedIn ? "check-in" : "check-out"}.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
