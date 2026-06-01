"use client"

import { useAuth } from "@/lib/auth-context"
import { updateUserProfile, updateUserAvatar } from "@/lib/api"
import { Star, BookOpen, Calendar, Shield, Award, Camera, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { PasswordResetModal } from "@/components/password-reset-modal"
import { useState, useRef, useEffect } from "react"

export default function PerfilPage() {
  const { user, refreshUser } = useAuth()
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [nombre, setNombre] = useState(user?.nombre || "")
  const [email, setEmail] = useState(user?.email || "")
  const [localAvatarPreview, setLocalAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [passwordModalOpen, setPasswordModalOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sincronizar estados locales cuando el user cambie
  useEffect(() => {
    if (user) {
      setNombre(user.nombre || "")
      setEmail(user.email || "")
    }
  }, [user])

  // La imagen a mostrar: preview local si existe, sino el avatar del servidor
  const displayAvatar = localAvatarPreview || user?.avatar || null

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setLocalAvatarPreview(url)
      setAvatarFile(file)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      // Actualizar avatar si hay uno nuevo
      if (avatarFile) {
        await updateUserAvatar(avatarFile)
      }
      
      // Actualizar datos del perfil
      await updateUserProfile({
        nombre: nombre.trim(),
        email: email.trim(),
      })
      
      // Refrescar datos del usuario en el contexto
      await refreshUser()
      
      setEditing(false)
      setAvatarFile(null)
      setLocalAvatarPreview(null)
    } catch (error) {
      console.error("Error al guardar perfil:", error)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setEditing(false)
    setNombre(user?.nombre || "")
    setEmail(user?.email || "")
    setLocalAvatarPreview(null)
    setAvatarFile(null)
  }

  const initials = user?.nombre
    ? user.nombre
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U"

  const reputationPercent = ((user?.reputacion ?? 0) / 5) * 100

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Mi Perfil</h1>
        <p className="mt-1 text-muted-foreground">Administra tu informacion personal y preferencias</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="border-border lg:col-span-1">
          <CardContent className="flex flex-col items-center p-6 text-center">
            <div className="relative">
              <Avatar className="h-24 w-24">
                {displayAvatar ? (
                  <AvatarImage src={displayAvatar} alt={user?.nombre} />
                ) : null}
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              {editing && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-colors hover:bg-primary/90"
                >
                  <Camera className="h-4 w-4" />
                  <span className="sr-only">Cambiar imagen de perfil</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />
            </div>
            <h2 className="mt-4 text-xl font-bold text-foreground">{user?.nombre}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <Badge variant="secondary" className="mt-2 capitalize bg-primary/10 text-primary">
              <Shield className="mr-1 h-3 w-3" />
              {user?.rol}
            </Badge>

            <Separator className="my-4" />

            {/* Reputation */}
            <div className="w-full space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Star className="h-4 w-4" /> Reputacion
                </span>
                <span className="font-semibold text-foreground">{user?.reputacion}/5.0</span>
              </div>
              <Progress value={reputationPercent} className="h-2" />
            </div>

            <Separator className="my-4" />

            {/* Stats */}
            <div className="grid w-full grid-cols-2 gap-3">
              <div className="rounded-lg bg-muted p-3 text-center">
                <BookOpen className="mx-auto h-5 w-5 text-primary" />
                <p className="mt-1 text-lg font-bold text-foreground">{user?.prestamosActivos}</p>
                <p className="text-xs text-muted-foreground">Activos</p>
              </div>
              <div className="rounded-lg bg-muted p-3 text-center">
                <Award className="mx-auto h-5 w-5 text-primary" />
                <p className="mt-1 text-lg font-bold text-foreground">12</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Miembro desde {user?.fechaRegistro}
            </div>
          </CardContent>
        </Card>

        {/* Edit Form */}
        <Card className="border-border lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground">Informacion Personal</CardTitle>
                <CardDescription>Actualiza tus datos de perfil</CardDescription>
              </div>
              <div className="flex gap-2">
                {editing && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancel}
                    disabled={saving}
                  >
                    Cancelar
                  </Button>
                )}
                <Button
                  variant={editing ? "default" : "outline"}
                  size="sm"
                  onClick={editing ? handleSave : () => setEditing(true)}
                  disabled={saving}
                  className={!editing ? "text-foreground" : ""}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Guardando...
                    </>
                  ) : editing ? (
                    "Guardar"
                  ) : (
                    "Editar"
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-foreground">Nombre completo</Label>
                <Input
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  disabled={!editing}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Correo electronico</Label>
                <Input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!editing}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">Rol</Label>
                <Input value={user?.rol || ""} disabled className="bg-muted capitalize" />
              </div>
              <div className="space-y-2">
                <Label className="text-foreground">ID de usuario</Label>
                <Input value={user?.id || ""} disabled className="bg-muted" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Activity / Security */}
        <Card className="border-border lg:col-span-2 lg:col-start-2">
          <CardHeader>
            <CardTitle className="text-foreground">Seguridad</CardTitle>
            <CardDescription>Gestiona tu contrasena y acceso</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="font-medium text-foreground">Cambiar contrasena</p>
                <p className="text-sm text-muted-foreground">Actualiza tu contrasena de acceso</p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="text-foreground"
                onClick={() => setPasswordModalOpen(true)}
              >
                Cambiar
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="font-medium text-foreground">Sesiones activas</p>
                <p className="text-sm text-muted-foreground">1 sesion activa en este dispositivo</p>
              </div>
              <Badge variant="secondary" className="bg-accent/60 text-accent-foreground">Activa</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Password Reset Modal */}
      <PasswordResetModal
        open={passwordModalOpen}
        onOpenChange={setPasswordModalOpen}
        defaultEmail={user?.email}
      />
    </div>
  )
}
