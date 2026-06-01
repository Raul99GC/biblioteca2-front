"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { uploadBook, getMyUploads, getMyBooks, deleteMyUpload, deleteMyBook } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import type { Book, BookUpload, CreateBookUploadPayload } from "@/lib/types"
import {
  BookPlus, ArrowLeft, Upload, Loader2, Clock, CheckCircle2, XCircle,
  BookOpen, FileText, X, FileUp, Info, Trash2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"

const CATEGORIAS = [
  "Informatica", "Matematicas", "Fisica", "Quimica", "Ingenieria",
  "Literatura", "Historia", "Economia", "Derecho", "Medicina",
]

const estadoConfig: Record<string, { icon: React.ElementType; color: string; label: string }> = {
  pendiente: { icon: Clock, color: "bg-secondary text-secondary-foreground", label: "Pendiente" },
  aprobado: { icon: CheckCircle2, color: "bg-accent/60 text-accent-foreground", label: "Aprobado" },
  rechazado: { icon: XCircle, color: "bg-destructive/10 text-destructive", label: "Rechazado" },
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const EMPTY_FORM: Omit<CreateBookUploadPayload, "imagen"> = {
  titulo: "",
  autor: "",
  isbn: "",
  categoria: "",
  descripcion: "",
  formato: "fisico",
  idioma: "Espanol",
  paginas: 0,
  editorial: "",
  anioPublicacion: new Date().getFullYear(),
  tags: [],
}

export default function SubirLibroPage() {
  const router = useRouter()
  const { user } = useAuth()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [uploads, setUploads] = useState<BookUpload[]>([])
  const [myBooks, setMyBooks] = useState<Book[]>([])
  const [loadingUploads, setLoadingUploads] = useState(true)
  const [loadingBooks, setLoadingBooks] = useState(true)
  const [activeSection, setActiveSection] = useState<"propuestas" | "mis-libros">("propuestas")
  const handleSectionChange = useCallback((value: string) => {
    setActiveSection(value as "propuestas" | "mis-libros")
  }, [])
  const [form, setForm] = useState<Omit<CreateBookUploadPayload, "imagen">>(EMPTY_FORM)
  const [tagInput, setTagInput] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [deleteUploadId, setDeleteUploadId] = useState<string | null>(null)
  const [deleteUploadTitle, setDeleteUploadTitle] = useState<string>("")
  const [deleteUploadEstado, setDeleteUploadEstado] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!user) return

    setLoadingUploads(true)
    setLoadingBooks(true)

    getMyUploads(user.id)
      .then(setUploads)
      .finally(() => setLoadingUploads(false))

    getMyBooks()
      .then(setMyBooks)
      .finally(() => setLoadingBooks(false))
  }, [user])

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOver(false)
  }, [])

  const removeFile = useCallback(() => {
    setSelectedFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }, [])

  const handleDeleteUpload = useCallback(async () => {
    if (!deleteUploadId) return
    setDeleting(true)
    try {
      // Si está aprobado, es un libro en el catálogo (usar /mio)
      // Si está pendiente o rechazado, es una propuesta (usar /uploads)
      if (deleteUploadEstado === "aprobado") {
        await deleteMyBook(deleteUploadId)
      } else {
        await deleteMyUpload(deleteUploadId)
      }
      setUploads((prev) => prev.filter((upload) => upload.id !== deleteUploadId))
      setDeleteUploadId(null)
      setDeleteUploadTitle("")
      setDeleteUploadEstado(null)
    } finally {
      setDeleting(false)
    }
  }, [deleteUploadId, deleteUploadEstado])

  const addTag = useCallback(() => {
    const tag = tagInput.trim()
    if (tag && !form.tags.includes(tag)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }))
      setTagInput("")
    }
  }, [tagInput, form.tags])

  const removeTag = useCallback((tag: string) => {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }))
  }, [])

  const canSubmit = form.titulo.trim() && form.autor.trim() && form.categoria

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return
    setSubmitting(true)
    try {
      // Construir payload con el archivo
      console.log("[v0] Enviando libro con archivo:", selectedFile ? `${selectedFile.name} (${selectedFile.size} bytes)` : "SIN ARCHIVO")
      const payload: CreateBookUploadPayload = {
        ...form,
        imagen: selectedFile || undefined,
      }
      console.log("[v0] Payload keys:", Object.keys(payload))
      const newUpload = await uploadBook(payload)
      setUploads((prev) => [newUpload, ...prev])
      setForm(EMPTY_FORM)
      setSelectedFile(null)
      setTagInput("")
      if (fileInputRef.current) fileInputRef.current.value = ""
      setSubmitted(true)
      setTimeout(() => setSubmitted(false), 5000)
    } finally {
      setSubmitting(false)
    }
  }, [form, selectedFile, canSubmit])

  const updateField = <K extends keyof Omit<CreateBookUploadPayload, "imagen">>(field: K, value: Omit<CreateBookUploadPayload, "imagen">[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="text-muted-foreground" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Volver</span>
        </Button>
        <div className="flex items-center gap-3">
          <BookPlus className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">Proponer Libro</h1>
            <p className="text-muted-foreground">
              Propone un libro fisico para que sea agregado al catalogo de la biblioteca
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upload Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Informacion del Libro</CardTitle>
              <CardDescription>
                Completa los datos del libro fisico. Los administradores revisaran la propuesta antes de agregarla al catalogo.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {submitted && (
                <div className="flex items-center gap-3 rounded-lg bg-accent/60 p-3">
                  <CheckCircle2 className="h-5 w-5 text-accent-foreground" />
                  <p className="text-sm font-medium text-accent-foreground">
                    La propuesta se ha enviado correctamente. Esta pendiente de revision por un administrador.
                  </p>
                </div>
              )}

              {/* Cover Image Upload Zone */}
              <div className="space-y-2">
                <Label className="text-foreground">
                  Imagen de portada <span className="text-xs text-muted-foreground">(opcional)</span>
                </Label>
                {selectedFile ? (
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-card p-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate text-sm font-medium text-foreground">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={removeFile}>
                      <X className="h-4 w-4" />
                      <span className="sr-only">Quitar imagen</span>
                    </Button>
                  </div>
                ) : (
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`flex cursor-pointer flex-col items-center gap-3 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                      dragOver
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50 hover:bg-muted/50"
                    }`}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter") fileInputRef.current?.click() }}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                      <FileUp className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Arrastra la portada aqui o haz clic para seleccionar
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        JPG, PNG, WEBP (max. 5MB)
                      </p>
                    </div>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handleFileSelect(file)
                  }}
                />
              </div>

              {/* Book metadata fields */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="upload-titulo" className="text-foreground">
                    Titulo <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="upload-titulo"
                    value={form.titulo}
                    onChange={(e) => updateField("titulo", e.target.value)}
                    placeholder="Ej: Clean Code"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="upload-autor" className="text-foreground">
                    Autor <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="upload-autor"
                    value={form.autor}
                    onChange={(e) => updateField("autor", e.target.value)}
                    placeholder="Ej: Robert C. Martin"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="upload-isbn" className="text-foreground">ISBN (opcional)</Label>
                  <Input
                    id="upload-isbn"
                    value={form.isbn}
                    onChange={(e) => updateField("isbn", e.target.value)}
                    placeholder="978-0-00-000000-0"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="upload-categoria" className="text-foreground">
                    Categoria <span className="text-destructive">*</span>
                  </Label>
                  <Select value={form.categoria} onValueChange={(v) => updateField("categoria", v)}>
                    <SelectTrigger id="upload-categoria">
                      <SelectValue placeholder="Seleccionar categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="upload-desc" className="text-foreground">Descripcion</Label>
                <Textarea
                  id="upload-desc"
                  value={form.descripcion}
                  onChange={(e) => updateField("descripcion", e.target.value)}
                  placeholder="Breve descripcion del contenido del libro..."
                  rows={3}
                  className="resize-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="upload-idioma" className="text-foreground">Idioma</Label>
                  <Input
                    id="upload-idioma"
                    value={form.idioma}
                    onChange={(e) => updateField("idioma", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="upload-paginas" className="text-foreground">Paginas</Label>
                  <Input
                    id="upload-paginas"
                    type="number"
                    value={form.paginas || ""}
                    onChange={(e) => updateField("paginas", parseInt(e.target.value) || 0)}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="upload-editorial" className="text-foreground">Editorial</Label>
                  <Input
                    id="upload-editorial"
                    value={form.editorial}
                    onChange={(e) => updateField("editorial", e.target.value)}
                    placeholder="Nombre de la editorial"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="upload-anio" className="text-foreground">Anio de Publicacion</Label>
                  <Input
                    id="upload-anio"
                    type="number"
                    value={form.anioPublicacion || ""}
                    onChange={(e) => updateField("anioPublicacion", parseInt(e.target.value) || 0)}
                    placeholder="2024"
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label className="text-foreground">Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    placeholder="Agregar tag..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault()
                        addTag()
                      }
                    }}
                  />
                  <Button type="button" variant="secondary" onClick={addTag} size="sm">
                    Agregar
                  </Button>
                </div>
                {form.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {form.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-0.5 rounded-full p-0.5 hover:bg-muted"
                        >
                          <X className="h-3 w-3" />
                          <span className="sr-only">Eliminar tag {tag}</span>
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  className="text-foreground"
                  onClick={() => {
                    setForm(EMPTY_FORM)
                    setSelectedFile(null)
                    setTagInput("")
                    if (fileInputRef.current) fileInputRef.current.value = ""
                  }}
                >
                  Limpiar
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={submitting || !canSubmit}
                  className="gap-2"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  Enviar Propuesta
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* My Uploads */}
          <Card className="border-border">
            <Tabs value={activeSection} onValueChange={handleSectionChange}>
              <CardHeader className="space-y-4">
                <div>
                  <CardTitle className="text-foreground">
                    {activeSection === "propuestas" ? "Mis Propuestas" : "Mis Libros"}
                  </CardTitle>
                  <CardDescription>
                    {activeSection === "propuestas"
                      ? "Libros fisicos que has propuesto y su estado de revision"
                      : "Libros del catálogo que has subido y que ya están aprobados"
                    }
                  </CardDescription>
                </div>
                <TabsList className="gap-2">
                  <TabsTrigger value="propuestas">Mis Propuestas</TabsTrigger>
                  <TabsTrigger value="mis-libros">Mis Libros</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent>
                <TabsContent value="propuestas">
                {loadingUploads ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="animate-pulse rounded-lg border border-border p-4 space-y-2">
                        <div className="h-4 w-1/2 rounded bg-muted" />
                        <div className="h-3 w-1/3 rounded bg-muted" />
                        <div className="h-3 w-full rounded bg-muted" />
                      </div>
                    ))}
                  </div>
                ) : uploads.length === 0 ? (
                  <div className="py-8 text-center">
                    <BookOpen className="mx-auto h-8 w-8 text-muted-foreground/40" />
                    <p className="mt-2 text-sm text-muted-foreground">No has propuesto libros aun</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {uploads.map((up) => {
                      const config = estadoConfig[up.estado]
                      const StatusIcon = config.icon

                      return (
                        <div key={up.id} className="rounded-lg border border-border p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                <FileText className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">{up.titulo}</p>
                                <p className="text-sm text-muted-foreground">{up.autor}</p>
                                {up.archivoNombre && (
                                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                                  <span>Portada: {up.archivoNombre}</span>
                                  <span>({formatFileSize(up.archivoTamano)})</span>
                                </div>
                              )}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className={`shrink-0 gap-1 ${config.color}`}>
                                <StatusIcon className="h-3 w-3" />
                                {config.label}
                              </Badge>
                              {up.estado === "pendiente" && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 text-muted-foreground hover:text-destructive"
                                  onClick={() => {
                                    setDeleteUploadId(up.id)
                                    setDeleteUploadTitle(up.titulo)
                                    setDeleteUploadEstado(up.estado)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span className="sr-only">Eliminar subida</span>
                                </Button>
                              )}
                            </div>
                          </div>
                          {up.descripcion && (
                            <p className="mt-2 text-sm text-foreground/80 leading-relaxed">{up.descripcion}</p>
                          )}
                          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                              {up.categoria}
                            </Badge>
                            <span>-</span>
                            <span>{up.fechaSubida}</span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
                </TabsContent>
                <TabsContent value="mis-libros">
                  {loadingBooks ? (
                    <div className="space-y-3">
                      {[1, 2].map((i) => (
                        <div key={i} className="animate-pulse rounded-lg border border-border p-4 space-y-2">
                          <div className="h-4 w-1/2 rounded bg-muted" />
                          <div className="h-3 w-1/3 rounded bg-muted" />
                          <div className="h-3 w-full rounded bg-muted" />
                        </div>
                      ))}
                    </div>
                  ) : myBooks.length === 0 ? (
                    <div className="py-8 text-center">
                      <BookOpen className="mx-auto h-8 w-8 text-muted-foreground/40" />
                      <p className="mt-2 text-sm text-muted-foreground">No tienes libros aprobados en el catálogo</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {myBooks.map((book) => (
                        <div key={book.id} className="rounded-lg border border-border p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-3">
                              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                                <FileText className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="font-semibold text-foreground">{book.titulo}</p>
                                <p className="text-sm text-muted-foreground">{book.autor}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="shrink-0 gap-1 bg-accent/60 text-accent-foreground">
                                Aprobado
                              </Badge>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-9 w-9 text-muted-foreground hover:text-destructive"
                                onClick={() => {
                                  setDeleteUploadId(book.id)
                                  setDeleteUploadTitle(book.titulo)
                                  setDeleteUploadEstado("aprobado")
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Eliminar libro</span>
                              </Button>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">
                              {book.categoria}
                            </Badge>
                            <span>-</span>
                            <span>{book.idioma}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>

          <AlertDialog open={!!deleteUploadId} onOpenChange={(open) => {
            if (!open) {
              setDeleteUploadId(null)
              setDeleteUploadEstado(null)
            }
          }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle className="text-foreground">Eliminar {deleteUploadEstado === "aprobado" ? "libro" : "propuesta"}</AlertDialogTitle>
                <AlertDialogDescription>
                  {deleteUploadEstado === "aprobado" 
                    ? "¿Seguro que deseas eliminar este libro del catálogo? Esta acción no se puede deshacer."
                    : "¿Deseas eliminar esta propuesta de libro? Esta acción quitará el libro de tu lista de subidas."
                  }
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteUpload}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleting}
                >
                  {deleting ? "Eliminando..." : "Eliminar"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-foreground">
                <Info className="h-4 w-4 text-primary" />
                Como funciona
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">1</span>
                  <span>Selecciona el archivo del libro (PDF, EPUB, DOCX)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">2</span>
                  <span>Completa la informacion del libro (titulo, autor, categoria)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">3</span>
                  <span>Un administrador o docente revisa y aprueba la subida</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">4</span>
                  <span>El libro aparece en el catalogo disponible para todos</span>
                </li>
              </ol>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-foreground">Quien puede subir</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <Badge variant="secondary" className="bg-secondary text-secondary-foreground text-[10px]">Alumno</Badge>
                  <span>Puede subir libros (requiere aprobacion)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="secondary" className="bg-accent/60 text-accent-foreground text-[10px]">Docente</Badge>
                  <span>Puede subir y aprobar libros</span>
                </li>
                <li className="flex items-start gap-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px]">Admin</Badge>
                  <span>Control total sobre las subidas</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-foreground">Formatos aceptados</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="font-medium text-foreground">PDF</span> - Formato preferido
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="font-medium text-foreground">EPUB</span> - Libros electronicos
                </li>
                <li className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span className="font-medium text-foreground">DOCX</span> - Documentos de Word
                </li>
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">Tamano maximo: 50 MB</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total subidos</span>
                <span className="font-semibold text-foreground">{uploads.length}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Aprobados</span>
                <span className="font-semibold text-foreground">
                  {uploads.filter((u) => u.estado === "aprobado").length}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Pendientes</span>
                <span className="font-semibold text-foreground">
                  {uploads.filter((u) => u.estado === "pendiente").length}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
