"use client"

import { useState } from "react"
import { forgotPassword, resetPassword } from "@/lib/api"
import { Loader2, Mail, KeyRound, CheckCircle } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface PasswordResetModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Si el usuario ya esta logueado, pasar su email para prellenar */
  defaultEmail?: string
}

type Step = "email" | "code" | "success"

export function PasswordResetModal({ open, onOpenChange, defaultEmail }: PasswordResetModalProps) {
  const [step, setStep] = useState<Step>("email")
  const [email, setEmail] = useState(defaultEmail || "")
  const [codigo, setCodigo] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      await forgotPassword(email)
      setStep("code")
    } catch (err) {
      // No mostrar error especifico por seguridad - siempre avanzar
      setStep("code")
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (password !== confirmPassword) {
      setError("Las contrasenas no coinciden")
      return
    }

    if (password.length < 8) {
      setError("La contrasena debe tener al menos 8 caracteres")
      return
    }

    setLoading(true)
    try {
      await resetPassword(codigo, password, confirmPassword)
      setStep("success")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Codigo invalido o expirado")
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    // Reset state when closing
    setStep("email")
    setEmail(defaultEmail || "")
    setCodigo("")
    setPassword("")
    setConfirmPassword("")
    setError("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === "email" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-foreground">Recuperar contrasena</DialogTitle>
              <DialogDescription>
                Ingresa tu correo electronico y te enviaremos un codigo de verificacion.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSendCode} className="space-y-4 pt-2">
              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-foreground">Correo electronico</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="tu.correo@tecmm.edu.mx"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="pl-10"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading || !email}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  "Enviar codigo"
                )}
              </Button>
            </form>
          </>
        )}

        {step === "code" && (
          <>
            <DialogHeader>
              <DialogTitle className="text-foreground">Ingresa el codigo</DialogTitle>
              <DialogDescription>
                Hemos enviado un codigo de 6 digitos a <span className="font-medium text-foreground">{email}</span>. Revisa tu bandeja de entrada.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleResetPassword} className="space-y-4 pt-2">
              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="reset-code" className="text-foreground">Codigo de verificacion</Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="reset-code"
                    type="text"
                    placeholder="123456"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                    maxLength={6}
                    className="pl-10 text-center tracking-widest text-lg"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-foreground">Nueva contrasena</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Minimo 8 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-foreground">Confirmar contrasena</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Repite tu contrasena"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setStep("email")} className="flex-1">
                  Atras
                </Button>
                <Button type="submit" className="flex-1" disabled={loading || codigo.length !== 6 || !password}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cambiando...
                    </>
                  ) : (
                    "Cambiar contrasena"
                  )}
                </Button>
              </div>
              <p className="text-center text-xs text-muted-foreground">
                No recibiste el codigo?{" "}
                <button
                  type="button"
                  onClick={() => setStep("email")}
                  className="text-primary hover:underline"
                >
                  Reenviar
                </button>
              </p>
            </form>
          </>
        )}

        {step === "success" && (
          <div className="flex flex-col items-center py-6 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/60">
              <CheckCircle className="h-8 w-8 text-accent-foreground" />
            </div>
            <DialogHeader className="text-center">
              <DialogTitle className="text-foreground">Contrasena actualizada</DialogTitle>
              <DialogDescription className="mt-2">
                Tu contrasena ha sido cambiada exitosamente. Ya puedes iniciar sesion con tu nueva contrasena.
              </DialogDescription>
            </DialogHeader>
            <Button onClick={handleClose} className="mt-6">
              Entendido
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
