"use client"

import { useState, useCallback, useEffect } from "react"
import type { StudyRoom, CreateStudyRoomPayload } from "@/lib/types"
import { createStudyRoom } from "@/lib/api"
import {
  Plus, Loader2, MapPin, Users, Clock, Monitor, X, Search, ExternalLink, CheckCircle2,
} from "lucide-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface CreateStudyRoomDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onRoomCreated: (room: StudyRoom) => void
}

interface NominatimResult {
  place_id: number
  display_name: string
  lat: string
  lon: string
  type: string
  address?: {
    road?: string
    building?: string
    neighbourhood?: string
    suburb?: string
    city?: string
    state?: string
    country?: string
  }
}

const TIPOS_SALA = [
  { value: "individual", label: "Individual", description: "Para estudio personal" },
  { value: "grupal", label: "Grupal", description: "Para trabajo en equipo" },
  { value: "silenciosa", label: "Silenciosa", description: "Zona de silencio total" },
] as const

const EQUIPAMIENTO_OPTIONS = [
  "Pizarron",
  "Proyector",
  "TV",
  "Computadora",
  "Webcam",
  "Aire acondicionado",
  "Enchufes multiples",
  "Sillas ergonomicas",
]

const INITIAL_FORM: CreateStudyRoomPayload = {
  nombre: "",
  ubicacion: "",
  capacidad: 4,
  equipamiento: [],
  horario: "08:00 - 20:00",
  tipo: "grupal",
  coordenadas: { lat: 0, lng: 0 },
}

export function CreateStudyRoomDialog({ open, onOpenChange, onRoomCreated }: CreateStudyRoomDialogProps) {
  const [form, setForm] = useState<CreateStudyRoomPayload>(INITIAL_FORM)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  
  // OpenStreetMap search state
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<NominatimResult | null>(null)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const updateField = <K extends keyof CreateStudyRoomPayload>(
    field: K,
    value: CreateStudyRoomPayload[K]
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const toggleEquipamiento = (item: string) => {
    setForm((prev) => ({
      ...prev,
      equipamiento: prev.equipamiento.includes(item)
        ? prev.equipamiento.filter((e) => e !== item)
        : [...prev.equipamiento, item],
    }))
  }

  // Search location using OpenStreetMap Nominatim API
  const searchLocation = useCallback(async () => {
    if (!searchQuery.trim() || searchQuery.length < 3) return
    
    setSearching(true)
    setSearchResults([])
    
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        format: "json",
        addressdetails: "1",
        limit: "5",
        countrycodes: "mx", // Limitar a Mexico
      })
      
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params.toString()}`,
        {
          headers: {
            "Accept-Language": "es",
            "User-Agent": "BibliotecaTecNM/1.0",
          },
        }
      )
      
      if (response.ok) {
        const data: NominatimResult[] = await response.json()
        setSearchResults(data)
      }
    } catch (error) {
      console.error("Error searching location:", error)
    } finally {
      setSearching(false)
    }
  }, [searchQuery])

  // Handle location selection
  const selectLocation = (result: NominatimResult) => {
    setSelectedLocation(result)
    setSearchResults([])
    setSearchQuery("")
    
    // Parse the display name to get a shorter location string
    const shortLocation = result.address
      ? [result.address.building, result.address.road, result.address.neighbourhood, result.address.suburb]
          .filter(Boolean)
          .slice(0, 2)
          .join(", ") || result.display_name.split(",").slice(0, 2).join(",")
      : result.display_name.split(",").slice(0, 2).join(",")
    
    // Update form with coordinates and location
    updateField("ubicacion", shortLocation)
    updateField("coordenadas", {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
    })
  }

  // Clear selected location
  const clearLocation = () => {
    setSelectedLocation(null)
    updateField("ubicacion", "")
    updateField("coordenadas", { lat: 0, lng: 0 })
  }

  useEffect(() => {
    if (!selectedImage) {
      setPreviewUrl(null)
      return
    }

    const url = URL.createObjectURL(selectedImage)
    setPreviewUrl(url)
    return () => URL.revokeObjectURL(url)
  }, [selectedImage])

  // Open Google Maps with coordinates
  const openInGoogleMaps = () => {
    if (form.coordenadas.lat && form.coordenadas.lng) {
      const url = `https://www.google.com/maps?q=${form.coordenadas.lat},${form.coordenadas.lng}`
      window.open(url, "_blank")
    }
  }

  const handleSubmit = async () => {
    if (!form.nombre.trim() || !form.ubicacion.trim() || !form.coordenadas.lat) return
    
    setLoading(true)
    try {
      // attach selected image to form payload if present
      if (selectedImage) {
        updateField("imagen", selectedImage as any)
      }
      const newRoom = await createStudyRoom(form)
      setSuccess(true)
      onRoomCreated(newRoom)
      setTimeout(() => {
        handleClose()
      }, 1500)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setForm(INITIAL_FORM)
    setSuccess(false)
    setSearchQuery("")
    setSearchResults([])
    setSelectedLocation(null)
    setSelectedImage(null)
    setPreviewUrl(null)
    onOpenChange(false)
  }

  const canSubmit = form.nombre.trim() && form.ubicacion.trim() && form.capacidad > 0 && form.coordenadas.lat !== 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Plus className="h-5 w-5 text-primary" />
            Crear Sala de Estudio
          </DialogTitle>
          <DialogDescription>
            Agrega una nueva sala de estudio al sistema
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/30">
              <Plus className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-lg font-semibold text-foreground">Sala creada exitosamente</p>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="room-name" className="text-foreground">
                Nombre de la sala <span className="text-destructive">*</span>
              </Label>
              <Input
                id="room-name"
                placeholder="Ej: Sala de Estudio A-101"
                value={form.nombre}
                onChange={(e) => updateField("nombre", e.target.value)}
              />
            </div>

            {/* Busqueda de Ubicacion OpenStreetMap */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-foreground">
                <MapPin className="h-3.5 w-3.5" />
                Ubicacion <span className="text-destructive">*</span>
              </Label>
              
              {selectedLocation ? (
                // Ubicacion seleccionada
                <div className="rounded-lg border border-border bg-muted/50 p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                        <span className="font-medium text-sm text-foreground truncate">
                          {form.ubicacion}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                        {selectedLocation.display_name}
                      </p>
                      <div className="mt-2 flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          {form.coordenadas.lat.toFixed(6)}, {form.coordenadas.lng.toFixed(6)}
                        </span>
                        <button
                          type="button"
                          onClick={openInGoogleMaps}
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <ExternalLink className="h-3 w-3" />
                          Ver en Google Maps
                        </button>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={clearLocation}
                    >
                      <X className="h-4 w-4" />
                      <span className="sr-only">Cambiar ubicacion</span>
                    </Button>
                  </div>
                </div>
              ) : (
                // Campo de busqueda
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Buscar direccion en OpenStreetMap..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault()
                          searchLocation()
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={searchLocation}
                      disabled={searching || searchQuery.length < 3}
                    >
                      {searching ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Escribe al menos 3 caracteres y presiona buscar o Enter
                  </p>
                  
                  {/* Resultados de busqueda */}
                  {searchResults.length > 0 && (
                    <div className="rounded-lg border border-border bg-card shadow-lg max-h-48 overflow-y-auto">
                      {searchResults.map((result) => (
                        <button
                          key={result.place_id}
                          type="button"
                          className="w-full px-3 py-2 text-left hover:bg-muted transition-colors border-b border-border last:border-0"
                          onClick={() => selectLocation(result)}
                        >
                          <p className="text-sm font-medium text-foreground line-clamp-1">
                            {result.display_name.split(",")[0]}
                          </p>
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {result.display_name.split(",").slice(1, 4).join(",")}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                  
                  {searching && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Buscando ubicaciones...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tipo y Capacidad */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="room-type" className="text-foreground">Tipo de sala</Label>
                <Select
                  value={form.tipo}
                  onValueChange={(v) => updateField("tipo", v as CreateStudyRoomPayload["tipo"])}
                >
                  <SelectTrigger id="room-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_SALA.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        <div className="flex flex-col">
                          <span>{tipo.label}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="room-capacity" className="flex items-center gap-1.5 text-foreground">
                  <Users className="h-3.5 w-3.5" />
                  Capacidad
                </Label>
                <Input
                  id="room-capacity"
                  type="number"
                  min={1}
                  max={50}
                  value={form.capacidad}
                  onChange={(e) => updateField("capacidad", parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            {/* Horario */}
            <div className="space-y-2">
              <Label htmlFor="room-schedule" className="flex items-center gap-1.5 text-foreground">
                <Clock className="h-3.5 w-3.5" />
                Horario de disponibilidad
              </Label>
              <Input
                id="room-schedule"
                placeholder="Ej: 08:00 - 20:00"
                value={form.horario}
                onChange={(e) => updateField("horario", e.target.value)}
              />
            </div>

            {/* Equipamiento */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5 text-foreground">
                <Monitor className="h-3.5 w-3.5" />
                Equipamiento disponible
              </Label>
              <div className="flex flex-wrap gap-2">
                {EQUIPAMIENTO_OPTIONS.map((item) => {
                  const isSelected = form.equipamiento.includes(item)
                  return (
                    <Badge
                      key={item}
                      variant={isSelected ? "default" : "outline"}
                      className={`cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-primary text-primary-foreground hover:bg-primary/90"
                          : "hover:bg-muted"
                      }`}
                      onClick={() => toggleEquipamiento(item)}
                    >
                      {item}
                      {isSelected && <X className="ml-1 h-3 w-3" />}
                    </Badge>
                  )
                })}
              </div>
              {form.equipamiento.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {form.equipamiento.length} elemento(s) seleccionado(s)
                </p>
              )}
            </div>

            {/* Imagen (opcional) */}
            <div className="space-y-2">
              <Label className="text-foreground">Imagen (opcional)</Label>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null
                    setSelectedImage(file)
                    if (file) updateField("imagen", file as any)
                    else updateField("imagen", "")
                  }}
                  className="text-sm"
                />
                {previewUrl && (
                  <div className="h-16 w-16 overflow-hidden rounded-md border">
                    <img src={previewUrl} alt="Preview" className="h-full w-full object-cover" />
                  </div>
                )}
                {selectedImage && (
                  <Button variant="ghost" size="icon" onClick={() => { setSelectedImage(null); updateField("imagen", "") }}>
                    <X className="h-4 w-4" />
                    <span className="sr-only">Eliminar imagen</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleClose} disabled={loading}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={!canSubmit || loading} className="gap-2">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Crear Sala
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
