"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { BookOpen, Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { PasswordResetModal } from "@/components/password-reset-modal"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const { login, user } = useAuth()
  const router = useRouter()

  // Redirigir si ya esta logueado
  useEffect(() => {
    if (user) {
      router.push("/dashboard")
    }
  }, [user, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsSubmitting(true)
    try {
      await login(email, password)
      router.push("/dashboard")
    } catch {
      setError("Credenciales invalidas. Intenta de nuevo.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel - decorative */}
      <div className="hidden flex-1 items-center justify-center bg-primary/5 lg:flex">
        <div className="max-w-md px-8 text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary">
            <BookOpen className="h-10 w-10 text-primary-foreground" />
          </div>
          <h2 className="mb-4 text-3xl font-bold text-foreground text-balance">
            Bienvenido a Biblioteca 2.0
          </h2>
          <p className="text-muted-foreground leading-relaxed">
            Tu plataforma colaborativa de prestamos de libros fisicos, intercambio entre companeros y gestion de salas de estudio del TecNM.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            <div className="rounded-xl bg-card p-4 shadow-sm">
              <p className="text-2xl font-bold text-primary">2,450</p>
              <p className="text-xs text-muted-foreground">Libros</p>
            </div>
            <div className="rounded-xl bg-card p-4 shadow-sm">
              <p className="text-2xl font-bold text-secondary-foreground">1,823</p>
              <p className="text-xs text-muted-foreground">Usuarios</p>
            </div>
            <div className="rounded-xl bg-card p-4 shadow-sm">
              <p className="text-2xl font-bold text-accent-foreground">12</p>
              <p className="text-xs text-muted-foreground">Salas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex flex-1 items-center justify-center bg-background p-6">
        <Card className="w-full max-w-md border-border shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary lg:hidden">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
            <CardTitle className="text-2xl text-foreground">Iniciar Sesion</CardTitle>
            <CardDescription className="text-muted-foreground">
              Ingresa con tu cuenta institucional
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Correo electronico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu.correo@tecmm.edu.mx"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-foreground">Contrasena</Label>
                  <button 
                    type="button"
                    onClick={() => setPasswordModalOpen(true)}
                    className="text-xs text-primary hover:underline"
                  >
                    Olvidaste tu contrasena?
                  </button>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Tu contrasena"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="bg-background pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    <span className="sr-only">Mostrar contrasena</span>
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Iniciar Sesion
              </Button>
            </form>
          </CardContent>
          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground">
              No tienes cuenta?{" "}
              <Link href="/registro" className="font-medium text-primary hover:underline">
                Registrate aqui
              </Link>
            </p>
          </CardFooter>
        </Card>

        {/* Password Reset Modal */}
        <PasswordResetModal
          open={passwordModalOpen}
          onOpenChange={setPasswordModalOpen}
        />
      </div>
    </div>
  )
}
