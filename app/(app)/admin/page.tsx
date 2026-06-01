"use client"

import { useEffect, useState, useCallback } from "react"
import {
  getAllUsers, getAdminDashboardStats, getBooks, getLoans, getBookUploads,
  createBook, updateBook, deleteBook, updateUser, deactivateUser, markLoanReturned,
  approveUpload, rejectUpload,
} from "@/lib/api"
import type { User, DashboardStats, Book, Loan, CreateBookPayload, UpdateUserPayload, BookUpload } from "@/lib/types"
import {
  Users, BookOpen, DoorOpen, TrendingUp, Shield, Search, MoreHorizontal, Eye,
  Plus, Pencil, Trash2, X, UserCog, UserX, CheckCircle, Filter, FileUp, XCircle,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

// ============================================
// CONSTANTS
// ============================================

const CATEGORIAS = [
  "Informatica", "Matematicas", "Fisica", "Quimica", "Ingenieria",
  "Literatura", "Historia", "Economia", "Derecho", "Medicina",
]

const ROLES: Array<{ value: User["rol"]; label: string }> = [
  { value: "estudiante", label: "Estudiante" },
  { value: "docente", label: "Docente" },
  { value: "admin", label: "Admin" },
]

const EMPTY_BOOK_FORM: CreateBookPayload = {
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

// ============================================
// MAIN COMPONENT
// ============================================

export default function AdminPage() {
  // Data state
  const [users, setUsers] = useState<User[]>([])
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [books, setBooks] = useState<Book[]>([])
  const [loans, setLoans] = useState<Loan[]>([])
  const [uploads, setUploads] = useState<BookUpload[]>([])

  // Search state
  const [searchUsers, setSearchUsers] = useState("")
  const [searchBooks, setSearchBooks] = useState("")
  const [loanFilter, setLoanFilter] = useState<string>("todos")
  const [uploadFilter, setUploadFilter] = useState<string>("pendiente")

  // Book dialog state
  const [bookDialogOpen, setBookDialogOpen] = useState(false)
  const [editingBook, setEditingBook] = useState<Book | null>(null)
  const [bookForm, setBookForm] = useState<CreateBookPayload>(EMPTY_BOOK_FORM)
  const [tagInput, setTagInput] = useState("")
  const [bookSaving, setBookSaving] = useState(false)

  // Delete book confirmation
  const [deleteBookId, setDeleteBookId] = useState<string | null>(null)
  const [deleteBookTitle, setDeleteBookTitle] = useState("")

  // User dialog state
  const [userDialogOpen, setUserDialogOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [userForm, setUserForm] = useState<UpdateUserPayload>({})
  const [userSaving, setUserSaving] = useState(false)

  // User profile view
  const [viewingUser, setViewingUser] = useState<User | null>(null)

  // Deactivate user confirmation
  const [deactivateUserId, setDeactivateUserId] = useState<string | null>(null)
  const [deactivateUserName, setDeactivateUserName] = useState("")

  // Loan return confirmation
  const [returnLoanId, setReturnLoanId] = useState<string | null>(null)

  // Upload approval state
  const [processingUploadId, setProcessingUploadId] = useState<string | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectUploadId, setRejectUploadId] = useState<string | null>(null)
  const [rejectMotivo, setRejectMotivo] = useState("")

  // Loading
  const [loading, setLoading] = useState(false)

  // ============================================
  // DATA FETCHING
  // ============================================

  useEffect(() => {
    getAllUsers().then(setUsers)
    getAdminDashboardStats().then(setStats)
    getBooks().then(setBooks)
    getLoans().then(setLoans)
    getBookUploads().then(setUploads)
  }, [])

  // ============================================
  // BOOK HANDLERS
  // ============================================

  const openCreateBookDialog = useCallback(() => {
    setEditingBook(null)
    setBookForm(EMPTY_BOOK_FORM)
    setTagInput("")
    setBookDialogOpen(true)
  }, [])

  const openEditBookDialog = useCallback((book: Book) => {
    setEditingBook(book)
    setBookForm({
      titulo: book.titulo,
      autor: book.autor,
      isbn: book.isbn,
      categoria: book.categoria,
      descripcion: book.descripcion,
      formato: book.formato,
      idioma: book.idioma,
      paginas: book.paginas,
      editorial: book.editorial,
      anioPublicacion: book.anioPublicacion,
      tags: [...book.tags],
    })
    setTagInput("")
    setBookDialogOpen(true)
  }, [])

  const handleSaveBook = useCallback(async () => {
    setBookSaving(true)
    try {
      if (editingBook) {
        const updated = await updateBook(editingBook.id, bookForm)
        setBooks((prev) => prev.map((b) => (b.id === editingBook.id ? updated : b)))
      } else {
        const created = await createBook(bookForm)
        setBooks((prev) => [...prev, created])
      }
      setBookDialogOpen(false)
    } finally {
      setBookSaving(false)
    }
  }, [editingBook, bookForm])

  const handleDeleteBook = useCallback(async () => {
    if (!deleteBookId) return
    setLoading(true)
    try {
      await deleteBook(deleteBookId)
      setBooks((prev) => prev.filter((b) => b.id !== deleteBookId))
      setDeleteBookId(null)
    } finally {
      setLoading(false)
    }
  }, [deleteBookId])

  const addTag = useCallback(() => {
    const tag = tagInput.trim()
    if (tag && !bookForm.tags.includes(tag)) {
      setBookForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }))
      setTagInput("")
    }
  }, [tagInput, bookForm.tags])

  const removeTag = useCallback((tag: string) => {
    setBookForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }))
  }, [])

  // ============================================
  // USER HANDLERS
  // ============================================

  const openEditUserDialog = useCallback((user: User) => {
    setEditingUser(user)
    setUserForm({ nombre: user.nombre, email: user.email, rol: user.rol })
    setUserDialogOpen(true)
  }, [])

  const handleSaveUser = useCallback(async () => {
    if (!editingUser) return
    setUserSaving(true)
    try {
      const updated = await updateUser(editingUser.id, userForm)
      setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? updated : u)))
      setUserDialogOpen(false)
    } finally {
      setUserSaving(false)
    }
  }, [editingUser, userForm])

  const handleDeactivateUser = useCallback(async () => {
    if (!deactivateUserId) return
    setLoading(true)
    try {
      await deactivateUser(deactivateUserId)
      setUsers((prev) => prev.filter((u) => u.id !== deactivateUserId))
      setDeactivateUserId(null)
    } finally {
      setLoading(false)
    }
  }, [deactivateUserId])

  // ============================================
  // LOAN HANDLERS
  // ============================================

  const handleReturnLoan = useCallback(async () => {
    if (!returnLoanId) return
    setLoading(true)
    try {
      const returned = await markLoanReturned(returnLoanId)
      setLoans((prev) => prev.map((l) => (l.id === returnLoanId ? returned : l)))
      setReturnLoanId(null)
    } finally {
      setLoading(false)
    }
  }, [returnLoanId])

  // ============================================
  // UPLOAD HANDLERS
  // ============================================

  const handleApproveUpload = useCallback(async (uploadId: string) => {
    setProcessingUploadId(uploadId)
    try {
      const updated = await approveUpload(uploadId)
      setUploads((prev) => prev.map((u) => (u.id === uploadId ? updated : u)))
    } finally {
      setProcessingUploadId(null)
    }
  }, [])

  const openRejectDialog = useCallback((uploadId: string) => {
    setRejectUploadId(uploadId)
    setRejectMotivo("")
    setRejectDialogOpen(true)
  }, [])

  const handleRejectUpload = useCallback(async () => {
    if (!rejectUploadId) return
    setProcessingUploadId(rejectUploadId)
    try {
      const updated = await rejectUpload(rejectUploadId, rejectMotivo || undefined)
      setUploads((prev) => prev.map((u) => (u.id === rejectUploadId ? updated : u)))
      setRejectDialogOpen(false)
      setRejectUploadId(null)
    } finally {
      setProcessingUploadId(null)
    }
  }, [rejectUploadId, rejectMotivo])

  // ============================================
  // FILTERED DATA
  // ============================================

  const filteredUsers = users.filter(
    (u) =>
      u.nombre.toLowerCase().includes(searchUsers.toLowerCase()) ||
      u.email.toLowerCase().includes(searchUsers.toLowerCase())
  )

  const filteredBooks = books.filter(
    (b) =>
      b.titulo.toLowerCase().includes(searchBooks.toLowerCase()) ||
      b.autor.toLowerCase().includes(searchBooks.toLowerCase())
  )

  const filteredLoans = loans.filter((l) => {
    if (loanFilter === "todos") return true
    return l.estado === loanFilter
  })

  const filteredUploads = uploads.filter((u) => {
    if (uploadFilter === "todos") return true
    return u.estado === uploadFilter
  })

  const pendingUploadsCount = uploads.filter((u) => u.estado === "pendiente").length

  const rolColors: Record<string, string> = {
    admin: "bg-primary/10 text-primary",
    docente: "bg-accent/60 text-accent-foreground",
    estudiante: "bg-secondary text-secondary-foreground",
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Panel de Administracion</h1>
          <p className="text-muted-foreground">Gestiona usuarios, libros y recursos de la plataforma</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats?.usuariosActivos?.toLocaleString() ?? "..."}</p>
              <p className="text-xs text-muted-foreground">Usuarios totales</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/60">
              <BookOpen className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats?.totalLibros?.toLocaleString() ?? "..."}</p>
              <p className="text-xs text-muted-foreground">Libros en catalogo</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/60">
              <TrendingUp className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats?.prestamosActivos ?? "..."}</p>
              <p className="text-xs text-muted-foreground">Prestamos activos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <DoorOpen className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{stats?.salasDisponibles ?? "..."}</p>
              <p className="text-xs text-muted-foreground">Salas disponibles</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card className="border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-foreground">Actividad General</CardTitle>
          <CardDescription>Prestamos y devoluciones esta semana</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.actividadReciente ?? []}>
                <XAxis dataKey="fecha" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ borderRadius: "8px", border: "1px solid hsl(210 25% 90%)" }} />
                <Bar dataKey="prestamos" name="Prestamos" fill="hsl(199 70% 55%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="devoluciones" name="Devoluciones" fill="hsl(160 45% 85%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Data Tables */}
      <Tabs defaultValue="usuarios">
        <TabsList>
          <TabsTrigger value="usuarios">Usuarios ({users.length})</TabsTrigger>
          <TabsTrigger value="libros">Libros ({books.length})</TabsTrigger>
          <TabsTrigger value="prestamos">Prestamos ({loans.length})</TabsTrigger>
          <TabsTrigger value="propuestas" className="gap-2">
            Propuestas
            {pendingUploadsCount > 0 && (
              <Badge variant="secondary" className="bg-primary/10 text-primary text-xs">
                {pendingUploadsCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ==================== USERS TABLE ==================== */}
        <TabsContent value="usuarios" className="mt-4 space-y-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar usuarios..."
              value={searchUsers}
              onChange={(e) => setSearchUsers(e.target.value)}
              className="bg-card pl-10"
            />
          </div>
          <Card className="border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-muted-foreground">Usuario</TableHead>
                  <TableHead className="text-muted-foreground">Rol</TableHead>
                  <TableHead className="text-muted-foreground">Reputacion</TableHead>
                  <TableHead className="text-muted-foreground">Prestamos</TableHead>
                  <TableHead className="text-muted-foreground">Registro</TableHead>
                  <TableHead className="text-muted-foreground w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs">
                            {u.nombre.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-foreground">{u.nombre}</p>
                          <p className="text-xs text-muted-foreground">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={`capitalize ${rolColors[u.rol]}`}>
                        {u.rol}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-foreground">{u.reputacion}</TableCell>
                    <TableCell className="text-foreground">{u.prestamosActivos}</TableCell>
                    <TableCell className="text-muted-foreground">{u.fechaRegistro}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-muted-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setViewingUser(u)}>
                            <Eye className="mr-2 h-4 w-4" /> Ver perfil
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEditUserDialog(u)}>
                            <Pencil className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setDeactivateUserId(u.id)
                              setDeactivateUserName(u.nombre)
                            }}
                          >
                            <UserX className="mr-2 h-4 w-4" /> Desactivar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ==================== BOOKS TABLE ==================== */}
        <TabsContent value="libros" className="mt-4 space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Buscar libros..."
                value={searchBooks}
                onChange={(e) => setSearchBooks(e.target.value)}
                className="bg-card pl-10"
              />
            </div>
            <Button onClick={openCreateBookDialog} className="gap-2">
              <Plus className="h-4 w-4" /> Agregar Libro
            </Button>
          </div>
          <Card className="border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-muted-foreground">Titulo</TableHead>
  <TableHead className="text-muted-foreground">Categoria</TableHead>
  <TableHead className="text-muted-foreground">Disponible</TableHead>
                  <TableHead className="text-muted-foreground">Calificacion</TableHead>
                  <TableHead className="text-muted-foreground w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBooks.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{b.titulo}</p>
                        <p className="text-xs text-muted-foreground">{b.autor}</p>
                      </div>
                    </TableCell>
<TableCell><Badge variant="outline" className="border-border text-muted-foreground">{b.categoria}</Badge></TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={b.disponible ? "bg-accent/60 text-accent-foreground" : "bg-muted text-muted-foreground"}>
                        {b.disponible ? "Si" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-foreground">{b.calificacion}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-muted-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditBookDialog(b)}>
                            <Pencil className="mr-2 h-4 w-4" /> Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => {
                              setDeleteBookId(b.id)
                              setDeleteBookTitle(b.titulo)
                            }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ==================== LOANS TABLE ==================== */}
        <TabsContent value="prestamos" className="mt-4 space-y-3">
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={loanFilter} onValueChange={setLoanFilter}>
              <SelectTrigger className="w-44 bg-card">
                <SelectValue placeholder="Filtrar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="activo">Activos</SelectItem>
                <SelectItem value="devuelto">Devueltos</SelectItem>
                <SelectItem value="vencido">Vencidos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Card className="border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-muted-foreground">Libro</TableHead>
                  <TableHead className="text-muted-foreground">Tipo</TableHead>
                  <TableHead className="text-muted-foreground">Fecha Prestamo</TableHead>
                  <TableHead className="text-muted-foreground">Devolucion</TableHead>
                  <TableHead className="text-muted-foreground">Estado</TableHead>
                  <TableHead className="text-muted-foreground w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLoans.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>
                      <p className="font-medium text-foreground">{l.libro.titulo}</p>
                    </TableCell>
                    <TableCell className="capitalize text-foreground">{l.tipo}</TableCell>
                    <TableCell className="text-muted-foreground">{l.fechaPrestamo}</TableCell>
                    <TableCell className="text-muted-foreground">{l.fechaDevolucion}</TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`capitalize ${
                          l.estado === "activo" ? "bg-primary/10 text-primary" :
                          l.estado === "devuelto" ? "bg-accent/60 text-accent-foreground" :
                          "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {l.estado}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {l.estado === "activo" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs text-primary"
                          onClick={() => setReturnLoanId(l.id)}
                        >
                          <CheckCircle className="h-3.5 w-3.5" /> Devolver
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ==================== UPLOADS/PROPUESTAS TABLE ==================== */}
        <TabsContent value="propuestas" className="mt-4 space-y-3">
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Select value={uploadFilter} onValueChange={setUploadFilter}>
              <SelectTrigger className="w-44 bg-card">
                <SelectValue placeholder="Filtrar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="pendiente">Pendientes</SelectItem>
                <SelectItem value="aprobado">Aprobados</SelectItem>
                <SelectItem value="rechazado">Rechazados</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Card className="border-border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-muted-foreground">Libro Propuesto</TableHead>
                  <TableHead className="text-muted-foreground">Propuesto por</TableHead>
                  <TableHead className="text-muted-foreground">Fecha</TableHead>
                  <TableHead className="text-muted-foreground">Estado</TableHead>
                  <TableHead className="text-muted-foreground w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUploads.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                      <FileUp className="mx-auto mb-2 h-8 w-8 opacity-40" />
                      No hay propuestas {uploadFilter !== "todos" ? `con estado "${uploadFilter}"` : ""}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUploads.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{u.titulo}</p>
                          <p className="text-xs text-muted-foreground">{u.autor} - {u.categoria}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-foreground">{u.subidoPor?.nombre || "Usuario desconocido"}</p>
                        <p className="text-xs text-muted-foreground">{u.subidoPor?.email || "-"}</p>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{u.fechaSubida}</TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={`capitalize ${
                            u.estado === "pendiente" ? "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400" :
                            u.estado === "aprobado" ? "bg-accent/60 text-accent-foreground" :
                            "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {u.estado}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {u.estado === "pendiente" && (
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-xs text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20"
                              onClick={() => handleApproveUpload(u.id)}
                              disabled={processingUploadId === u.id}
                            >
                              {processingUploadId === u.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <CheckCircle className="h-3.5 w-3.5" />
                              )}
                              Aprobar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => openRejectDialog(u.id)}
                              disabled={processingUploadId === u.id}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              Rechazar
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ==================== BOOK CREATE/EDIT DIALOG ==================== */}
      <Dialog open={bookDialogOpen} onOpenChange={setBookDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingBook ? "Editar Libro" : "Agregar Nuevo Libro"}
            </DialogTitle>
            <DialogDescription>
              {editingBook ? "Modifica los campos necesarios y guarda los cambios." : "Completa la informacion del nuevo libro para agregarlo al catalogo."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="titulo">Titulo</Label>
                <Input
                  id="titulo"
                  value={bookForm.titulo}
                  onChange={(e) => setBookForm((p) => ({ ...p, titulo: e.target.value }))}
                  placeholder="Titulo del libro"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="autor">Autor</Label>
                <Input
                  id="autor"
                  value={bookForm.autor}
                  onChange={(e) => setBookForm((p) => ({ ...p, autor: e.target.value }))}
                  placeholder="Nombre del autor"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="isbn">ISBN</Label>
                <Input
                  id="isbn"
                  value={bookForm.isbn}
                  onChange={(e) => setBookForm((p) => ({ ...p, isbn: e.target.value }))}
                  placeholder="978-0-000-00000-0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoria">Categoria</Label>
                <Select
                  value={bookForm.categoria}
                  onValueChange={(v) => setBookForm((p) => ({ ...p, categoria: v }))}
                >
                  <SelectTrigger id="categoria">
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
              <Label htmlFor="descripcion">Descripcion</Label>
              <Textarea
                id="descripcion"
                value={bookForm.descripcion}
                onChange={(e) => setBookForm((p) => ({ ...p, descripcion: e.target.value }))}
                placeholder="Descripcion del libro..."
                rows={3}
              />
            </div>

  <div className="grid gap-4 sm:grid-cols-2">
  <div className="space-y-2">
                <Label htmlFor="idioma">Idioma</Label>
                <Input
                  id="idioma"
                  value={bookForm.idioma}
                  onChange={(e) => setBookForm((p) => ({ ...p, idioma: e.target.value }))}
                  placeholder="Espanol"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paginas">Paginas</Label>
                <Input
                  id="paginas"
                  type="number"
                  value={bookForm.paginas || ""}
                  onChange={(e) => setBookForm((p) => ({ ...p, paginas: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="editorial">Editorial</Label>
                <Input
                  id="editorial"
                  value={bookForm.editorial}
                  onChange={(e) => setBookForm((p) => ({ ...p, editorial: e.target.value }))}
                  placeholder="Nombre de la editorial"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="anio">Anio de Publicacion</Label>
                <Input
                  id="anio"
                  type="number"
                  value={bookForm.anioPublicacion || ""}
                  onChange={(e) => setBookForm((p) => ({ ...p, anioPublicacion: parseInt(e.target.value) || 0 }))}
                  placeholder="2024"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
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
              {bookForm.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {bookForm.tags.map((tag) => (
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBookDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleSaveBook}
              disabled={bookSaving || !bookForm.titulo || !bookForm.autor}
            >
              {bookSaving ? "Guardando..." : editingBook ? "Guardar Cambios" : "Crear Libro"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== DELETE BOOK CONFIRMATION ==================== */}
      <AlertDialog open={!!deleteBookId} onOpenChange={(open) => !open && setDeleteBookId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Eliminar libro</AlertDialogTitle>
            <AlertDialogDescription>
              {"Esta seguro de eliminar \""}{deleteBookTitle}{"\"? Esta accion no se puede deshacer."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBook}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ==================== USER PROFILE VIEW DIALOG ==================== */}
      <Dialog open={!!viewingUser} onOpenChange={(open) => !open && setViewingUser(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Perfil de Usuario</DialogTitle>
          </DialogHeader>
          {viewingUser && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-primary/10 text-primary text-lg">
                    {viewingUser.nombre.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold text-foreground">{viewingUser.nombre}</p>
                  <p className="text-sm text-muted-foreground">{viewingUser.email}</p>
                  <Badge variant="secondary" className={`capitalize mt-1 ${rolColors[viewingUser.rol]}`}>
                    {viewingUser.rol}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Reputacion</p>
                  <p className="text-xl font-bold text-foreground">{viewingUser.reputacion}</p>
                </div>
                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Prestamos Activos</p>
                  <p className="text-xl font-bold text-foreground">{viewingUser.prestamosActivos}</p>
                </div>
                <div className="col-span-2 rounded-lg border border-border p-3">
                  <p className="text-xs text-muted-foreground">Fecha de Registro</p>
                  <p className="font-medium text-foreground">{viewingUser.fechaRegistro}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingUser(null)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== USER EDIT DIALOG ==================== */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica la informacion del usuario.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="user-nombre">Nombre</Label>
              <Input
                id="user-nombre"
                value={userForm.nombre ?? ""}
                onChange={(e) => setUserForm((p) => ({ ...p, nombre: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-email">Email</Label>
              <Input
                id="user-email"
                type="email"
                value={userForm.email ?? ""}
                onChange={(e) => setUserForm((p) => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-rol">Rol</Label>
              <Select
                value={userForm.rol ?? ""}
                onValueChange={(v) => setUserForm((p) => ({ ...p, rol: v as User["rol"] }))}
              >
                <SelectTrigger id="user-rol">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveUser} disabled={userSaving}>
              {userSaving ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ==================== DEACTIVATE USER CONFIRMATION ==================== */}
      <AlertDialog open={!!deactivateUserId} onOpenChange={(open) => !open && setDeactivateUserId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Desactivar usuario</AlertDialogTitle>
            <AlertDialogDescription>
              {"Esta seguro de desactivar a \""}{deactivateUserName}{"\"? El usuario no podra acceder a la plataforma."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivateUser}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Desactivando..." : "Desactivar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ==================== RETURN LOAN CONFIRMATION ==================== */}
      <AlertDialog open={!!returnLoanId} onOpenChange={(open) => !open && setReturnLoanId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Marcar como devuelto</AlertDialogTitle>
            <AlertDialogDescription>
              Confirma que el prestamo ha sido devuelto correctamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleReturnLoan} disabled={loading}>
              {loading ? "Procesando..." : "Confirmar Devolucion"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ==================== REJECT UPLOAD DIALOG ==================== */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">Rechazar Propuesta</DialogTitle>
            <DialogDescription>
              Opcionalmente indica el motivo del rechazo para que el usuario pueda mejorar su propuesta.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="reject-motivo">Motivo (opcional)</Label>
            <Textarea
              id="reject-motivo"
              value={rejectMotivo}
              onChange={(e) => setRejectMotivo(e.target.value)}
              placeholder="Ej: El libro ya existe en el catalogo, informacion incompleta, etc."
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectUpload}
              disabled={!!processingUploadId}
            >
              {processingUploadId ? "Rechazando..." : "Rechazar Propuesta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
