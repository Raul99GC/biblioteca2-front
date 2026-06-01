"use client"

import { useEffect, useState, useCallback } from "react"
import { getStudyRoomsWithDistance, createReservation, getReservations, getAllReservations } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import type { StudyRoom, Reservation } from "@/lib/types"
import { QRCheckDialog } from "@/components/qr-check-dialog"
import { QRScannerDialog } from "@/components/qr-scanner-dialog"
import { CreateStudyRoomDialog } from "@/components/create-study-room-dialog"
import {
  DoorOpen, Users, Clock, MapPin, Loader2, CheckCircle2, Calendar,
  QrCode, Navigation, ExternalLink, Filter, SlidersHorizontal, LogIn, LogOut,
  Search, MapPinned, Plus, Camera, ClipboardList,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"

const tipoLabels: Record<string, string> = {
  individual: "Individual",
  grupal: "Grupal",
  silenciosa: "Silenciosa",
}

// Default coordinates (campus center)
const DEFAULT_LAT = 20.6600
const DEFAULT_LNG = -103.3498

function formatDistance(meters: number): string {
  if (meters < 1000) return `${meters}m`
  return `${(meters / 1000).toFixed(1)}km`
}

function getGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking&dir_action=navigate`
}

export default function SalasPage() {
  const { user } = useAuth()
  const [rooms, setRooms] = useState<StudyRoom[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [allReservations, setAllReservations] = useState<Reservation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [reserving, setReserving] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<StudyRoom | null>(null)
  const [reserveForm, setReserveForm] = useState({ fecha: "", horaInicio: "", horaFin: "" })
  const [showSuccess, setShowSuccess] = useState(false)

  // Filters
  const [filterTipo, setFilterTipo] = useState("Todos")
  const [filterDisponible, setFilterDisponible] = useState(false)
  const [maxDistancia, setMaxDistancia] = useState(5000)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"distancia" | "nombre" | "capacidad">("distancia")

  // Geolocation
  const [userLat, setUserLat] = useState(DEFAULT_LAT)
  const [userLng, setUserLng] = useState(DEFAULT_LNG)
  const [locationEnabled, setLocationEnabled] = useState(false)
  const [locatingUser, setLocatingUser] = useState(false)

  // QR Dialog (for students to show their QR)
  const [qrReservation, setQrReservation] = useState<Reservation | null>(null)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)

  // QR Scanner Dialog (for admin/docente to scan)
  const [scannerOpen, setScannerOpen] = useState(false)

  // Create Room Dialog (for admin/docente)
  const [createRoomOpen, setCreateRoomOpen] = useState(false)

  // Check if user can manage (admin or docente)
  const canManage = user?.rol === "admin" || user?.rol === "docente"

  const loadRooms = useCallback(async () => {
    setIsLoading(true)
    try {
      const promises: Promise<unknown>[] = [
        getStudyRoomsWithDistance(userLat, userLng, {
          tipo: filterTipo !== "Todos" ? filterTipo : undefined,
          disponible: filterDisponible ? true : undefined,
          maxDistancia: maxDistancia < 5000 ? maxDistancia : undefined,
        }),
        getReservations(user?.id),
      ]
      
      // Admin/docente loads all reservations too
      if (canManage) {
        promises.push(getAllReservations())
      }
      
      const results = await Promise.all(promises)
      setRooms(results[0] as StudyRoom[])
      setReservations(results[1] as Reservation[])
      if (canManage && results[2]) {
        setAllReservations(results[2] as Reservation[])
      }
    } finally {
      setIsLoading(false)
    }
  }, [userLat, userLng, filterTipo, filterDisponible, maxDistancia, user?.id, canManage])

  useEffect(() => {
    loadRooms()
  }, [loadRooms])

  const requestLocation = () => {
    if (!navigator.geolocation) return
    setLocatingUser(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLat(pos.coords.latitude)
        setUserLng(pos.coords.longitude)
        setLocationEnabled(true)
        setLocatingUser(false)
      },
      () => {
        setLocatingUser(false)
      }
    )
  }

  // Search filter applied client-side
  const filteredRooms = rooms.filter((r) => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      r.nombre.toLowerCase().includes(q) ||
      r.ubicacion.toLowerCase().includes(q) ||
      r.equipamiento.some((e) => e.toLowerCase().includes(q))
    )
  }).sort((a, b) => {
    if (sortBy === "distancia") return (a.distancia ?? 0) - (b.distancia ?? 0)
    if (sortBy === "nombre") return a.nombre.localeCompare(b.nombre)
    return b.capacidad - a.capacidad
  })

  const handleReserve = async () => {
    if (!selectedRoom) return
    setReserving(true)
    try {
      const newRes = await createReservation({
        salaId: selectedRoom.id,
        ...reserveForm,
      })
      setReservations((prev) => [...prev, newRes])
      setShowSuccess(true)
      setTimeout(() => {
        setShowSuccess(false)
        setSelectedRoom(null)
        setReserveForm({ fecha: "", horaInicio: "", horaFin: "" })
      }, 2000)
    } finally {
      setReserving(false)
    }
  }

  // Handle check completion from scanner (admin/docente flow)
  const handleCheckComplete = (reservaId: string, tipo: "check-in" | "check-out", hora: string) => {
    // Update in all reservations
    const updateReservation = (r: Reservation) => {
      if (r.id !== reservaId) return r
      if (tipo === "check-in") return { ...r, checkIn: hora, estado: "en-uso" as const }
      return { ...r, checkOut: hora, estado: "completada" as const }
    }
    
    setReservations((prev) => prev.map(updateReservation))
    setAllReservations((prev) => prev.map(updateReservation))
  }

  // Handle new room created
  const handleRoomCreated = (newRoom: StudyRoom) => {
    setRooms((prev) => [...prev, newRoom])
  }

  const statusConfig: Record<string, { color: string; label: string }> = {
    confirmada: { color: "bg-primary/15 text-primary", label: "Confirmada" },
    pendiente: { color: "bg-secondary text-secondary-foreground", label: "Pendiente" },
    cancelada: { color: "bg-destructive/10 text-destructive", label: "Cancelada" },
    "en-uso": { color: "bg-accent/60 text-accent-foreground", label: "En uso" },
    completada: { color: "bg-muted text-muted-foreground", label: "Completada" },
  }

  // Filter for pending check-ins (confirmada or en-uso)
  const pendingReservations = allReservations.filter(
    (r) => r.estado === "confirmada" || r.estado === "en-uso"
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Salas de Estudio</h1>
          <p className="mt-1 text-muted-foreground">
            {canManage 
              ? "Gestiona salas, escanea QR para check-in y visualiza reservaciones"
              : "Reserva espacios y muestra tu QR para el check-in"
            }
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Create Room Button - Admin/Docente only */}
          {canManage && (
            <Button
              variant="default"
              size="sm"
              onClick={() => setCreateRoomOpen(true)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Crear Sala
            </Button>
          )}
          <Button
            variant={locationEnabled ? "outline" : "secondary"}
            size="sm"
            onClick={requestLocation}
            disabled={locatingUser}
            className="gap-2"
          >
            {locatingUser ? <Loader2 className="h-4 w-4 animate-spin" /> : <Navigation className="h-4 w-4" />}
            {locationEnabled ? "Ubicacion activa" : "Activar ubicacion"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="salas">
        <TabsList>
          <TabsTrigger value="salas">Salas Disponibles</TabsTrigger>
          <TabsTrigger value="reservas">Mis Reservaciones ({reservations.length})</TabsTrigger>
          {/* Admin/Docente only: Gestionar tab */}
          {canManage && (
            <TabsTrigger value="gestionar" className="gap-1.5">
              <ClipboardList className="h-3.5 w-3.5" />
              Gestionar ({pendingReservations.length})
            </TabsTrigger>
          )}
        </TabsList>

        {/* ============ TAB: SALAS ============ */}
        <TabsContent value="salas" className="mt-4 space-y-4">
          {/* Search + Filters */}
          <div className="space-y-3">
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, ubicacion o equipamiento..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-card pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Select value={filterTipo} onValueChange={setFilterTipo}>
                  <SelectTrigger className="w-40 bg-card">
                    <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Todos">Todos los tipos</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="grupal">Grupal</SelectItem>
                    <SelectItem value="silenciosa">Silenciosa</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
                  <SelectTrigger className="w-40 bg-card">
                    <SlidersHorizontal className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="distancia">Mas cercanas</SelectItem>
                    <SelectItem value="nombre">Nombre A-Z</SelectItem>
                    <SelectItem value="capacidad">Mayor capacidad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Advanced Filters Row */}
            <div className="flex flex-wrap items-center gap-4 rounded-lg border border-border bg-card p-3">
              <div className="flex items-center gap-2">
                <Switch
                  id="disponible-filter"
                  checked={filterDisponible}
                  onCheckedChange={setFilterDisponible}
                />
                <Label htmlFor="disponible-filter" className="text-sm text-foreground">Solo disponibles</Label>
              </div>
              <div className="hidden h-6 w-px bg-border sm:block" />
              <div className="flex flex-1 items-center gap-3">
                <MapPinned className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Label className="shrink-0 text-sm text-foreground">Distancia max:</Label>
                <Slider
                  value={[maxDistancia]}
                  onValueChange={([v]) => setMaxDistancia(v)}
                  min={100}
                  max={5000}
                  step={100}
                  className="flex-1"
                />
                <span className="min-w-[50px] text-sm font-medium text-foreground">{formatDistance(maxDistancia)}</span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              {filteredRooms.length} sala(s) encontrada(s)
              {locationEnabled && " - distancias calculadas desde tu ubicacion"}
            </p>
          </div>

          {isLoading ? (
            <div className="flex h-32 items-center justify-center">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredRooms.map((room) => (
                <Card key={room.id} className="border-border">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${room.disponible ? "bg-primary/10" : "bg-muted"}`}>
                          <DoorOpen className={`h-5 w-5 ${room.disponible ? "text-primary" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">{room.nombre}</h3>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {room.ubicacion}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge
                          variant="secondary"
                          className={room.disponible ? "bg-accent/60 text-accent-foreground" : "bg-muted text-muted-foreground"}
                        >
                          {room.disponible ? "Disponible" : "Ocupada"}
                        </Badge>
                        {room.distancia !== undefined && (
                          <span className="flex items-center gap-1 text-xs font-medium text-primary">
                            <Navigation className="h-3 w-3" />
                            {formatDistance(room.distancia)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-3.5 w-3.5" />
                        <span>Capacidad: {room.capacidad}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{room.horario}</span>
                      </div>
                    </div>

                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {room.equipamiento.map((eq) => (
                        <Badge key={eq} variant="outline" className="text-xs border-border text-muted-foreground">
                          {eq}
                        </Badge>
                      ))}
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="bg-muted text-muted-foreground capitalize">
                          {tipoLabels[room.tipo]}
                        </Badge>
                        <a
                          href={getGoogleMapsUrl(room.coordenadas.lat, room.coordenadas.lng)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Ver ruta
                        </a>
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            disabled={!room.disponible}
                            onClick={() => setSelectedRoom(room)}
                          >
                            Reservar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          {showSuccess ? (
                            <div className="py-8 text-center">
                              <CheckCircle2 className="mx-auto h-12 w-12 text-accent-foreground" />
                              <p className="mt-3 text-lg font-semibold text-foreground">Reservacion creada</p>
                              <p className="text-sm text-muted-foreground">Tu codigo QR estara disponible en tus reservaciones</p>
                            </div>
                          ) : (
                            <>
                              <DialogHeader>
                                <DialogTitle className="text-foreground">Reservar {room.nombre}</DialogTitle>
                                <DialogDescription>
                                  {room.ubicacion} - Capacidad: {room.capacidad} personas
                                  {room.distancia !== undefined && ` - ${formatDistance(room.distancia)} de distancia`}
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                  <Label className="text-foreground">Fecha</Label>
                                  <Input
                                    type="date"
                                    value={reserveForm.fecha}
                                    onChange={(e) => setReserveForm((f) => ({ ...f, fecha: e.target.value }))}
                                    className="bg-background"
                                  />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="space-y-2">
                                    <Label className="text-foreground">Hora inicio</Label>
                                    <Input
                                      type="time"
                                      value={reserveForm.horaInicio}
                                      onChange={(e) => setReserveForm((f) => ({ ...f, horaInicio: e.target.value }))}
                                      className="bg-background"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <Label className="text-foreground">Hora fin</Label>
                                    <Input
                                      type="time"
                                      value={reserveForm.horaFin}
                                      onChange={(e) => setReserveForm((f) => ({ ...f, horaFin: e.target.value }))}
                                      className="bg-background"
                                    />
                                  </div>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  onClick={handleReserve}
                                  disabled={reserving || !reserveForm.fecha || !reserveForm.horaInicio || !reserveForm.horaFin}
                                  className="w-full"
                                >
                                  {reserving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                  Confirmar Reservacion
                                </Button>
                              </DialogFooter>
                            </>
                          )}
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {filteredRooms.length === 0 && !isLoading && (
                <div className="col-span-full py-12 text-center">
                  <DoorOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <h3 className="mt-4 text-lg font-semibold text-foreground">No se encontraron salas</h3>
                  <p className="mt-1 text-muted-foreground">Intenta con otros filtros de busqueda o amplia la distancia</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ============ TAB: MIS RESERVACIONES (Estudiante view) ============ */}
        <TabsContent value="reservas" className="mt-4 space-y-3">
          {reservations.length === 0 ? (
            <Card className="border-border">
              <CardContent className="py-8 text-center">
                <Calendar className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">No tienes reservaciones</p>
              </CardContent>
            </Card>
          ) : (
            reservations.map((res) => (
              <Card key={res.id} className="border-border">
                <CardContent className="p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <DoorOpen className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{res.sala.nombre}</p>
                        <p className="text-sm text-muted-foreground">{res.sala.ubicacion}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-muted-foreground">{res.fecha}</span>
                      <span className="font-medium text-foreground">{res.horaInicio} - {res.horaFin}</span>
                      <Badge variant="secondary" className={`capitalize ${statusConfig[res.estado]?.color}`}>
                        {statusConfig[res.estado]?.label || res.estado}
                      </Badge>
                    </div>
                  </div>

                  {/* Check-in/out status (read-only for students) */}
                  <div className="mt-3 flex flex-col gap-2 border-t border-border pt-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1.5">
                        <LogIn className={`h-3.5 w-3.5 ${res.checkIn ? "text-primary" : "text-muted-foreground/40"}`} />
                        <span className={res.checkIn ? "font-medium text-foreground" : "text-muted-foreground"}>
                          {res.checkIn ? `Check-in: ${res.checkIn}` : "Sin check-in"}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <LogOut className={`h-3.5 w-3.5 ${res.checkOut ? "text-primary" : "text-muted-foreground/40"}`} />
                        <span className={res.checkOut ? "font-medium text-foreground" : "text-muted-foreground"}>
                          {res.checkOut ? `Check-out: ${res.checkOut}` : "Sin check-out"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={getGoogleMapsUrl(res.sala.coordenadas.lat, res.sala.coordenadas.lng)}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="sm" className="gap-1.5 text-xs">
                          <ExternalLink className="h-3 w-3" />
                          Ruta
                        </Button>
                      </a>
                      {/* Students can only VIEW their QR, not do check-in themselves */}
                      {(res.estado === "confirmada" || res.estado === "en-uso") && res.codigoQR && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1.5 text-xs"
                          onClick={() => {
                            setQrReservation(res)
                            setQrDialogOpen(true)
                          }}
                        >
                          <QrCode className="h-3.5 w-3.5" />
                          Ver mi QR
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* ============ TAB: GESTIONAR (Admin/Docente only) ============ */}
        {canManage && (
          <TabsContent value="gestionar" className="mt-4 space-y-4">
            {/* Scanner button */}
            <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4">
              <div>
                <p className="font-medium text-foreground">Registrar asistencia</p>
                <p className="text-sm text-muted-foreground">Escanea el QR del estudiante para hacer check-in o check-out</p>
              </div>
              <Button onClick={() => setScannerOpen(true)} className="gap-2">
                <Camera className="h-4 w-4" />
                Escanear QR
              </Button>
            </div>

            {/* List of pending reservations */}
            <div className="space-y-1">
              <h3 className="font-medium text-foreground">Reservaciones pendientes de check-in/out</h3>
              <p className="text-sm text-muted-foreground">{pendingReservations.length} reservacion(es) activa(s)</p>
            </div>

            {pendingReservations.length === 0 ? (
              <Card className="border-border">
                <CardContent className="py-8 text-center">
                  <CheckCircle2 className="mx-auto h-10 w-10 text-muted-foreground/50" />
                  <p className="mt-3 text-sm text-muted-foreground">No hay reservaciones pendientes</p>
                </CardContent>
              </Card>
            ) : (
              pendingReservations.map((res) => (
                <Card key={res.id} className="border-border">
                  <CardContent className="p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                          <DoorOpen className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{res.sala.nombre}</p>
                          <p className="text-sm text-muted-foreground">Usuario: {res.usuarioId}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm">
                        <span className="text-muted-foreground">{res.fecha}</span>
                        <span className="font-medium text-foreground">{res.horaInicio} - {res.horaFin}</span>
                        <Badge variant="secondary" className={`capitalize ${statusConfig[res.estado]?.color}`}>
                          {statusConfig[res.estado]?.label || res.estado}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t border-border pt-3">
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5">
                          <LogIn className={`h-3.5 w-3.5 ${res.checkIn ? "text-primary" : "text-muted-foreground/40"}`} />
                          <span className={res.checkIn ? "font-medium text-foreground" : "text-muted-foreground"}>
                            {res.checkIn ? `Check-in: ${res.checkIn}` : "Pendiente"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <LogOut className={`h-3.5 w-3.5 ${res.checkOut ? "text-primary" : "text-muted-foreground/40"}`} />
                          <span className={res.checkOut ? "font-medium text-foreground" : "text-muted-foreground"}>
                            {res.checkOut ? `Check-out: ${res.checkOut}` : "Pendiente"}
                          </span>
                        </div>
                      </div>
                      <Badge variant="outline" className="font-mono text-xs">
                        {res.codigoQR}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* QR Display Dialog (for students to show their QR) */}
      {qrReservation && (
        <QRCheckDialog
          reservation={qrReservation}
          open={qrDialogOpen}
          onOpenChange={(open) => {
            setQrDialogOpen(open)
            if (!open) setQrReservation(null)
          }}
          onCheckComplete={handleCheckComplete}
        />
      )}

      {/* QR Scanner Dialog (for admin/docente) */}
      {canManage && (
        <QRScannerDialog
          open={scannerOpen}
          onOpenChange={setScannerOpen}
          validadorId={user?.id || ""}
          onCheckComplete={handleCheckComplete}
        />
      )}

      {/* Create Study Room Dialog (for admin/docente) */}
      {canManage && (
        <CreateStudyRoomDialog
          open={createRoomOpen}
          onOpenChange={setCreateRoomOpen}
          onRoomCreated={handleRoomCreated}
        />
      )}
    </div>
  )
}
