"use client"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import Image from "next/image"
import { getBooks, deleteMyBook } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import type { Book } from "@/lib/types"
import { Search, BookOpen, Star, Filter, Grid3X3, List, Upload, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const categorias = ["Todas", "Informatica", "Matematicas", "Fisica", "Quimica"]

export default function CatalogoPage() {
  const [books, setBooks] = useState<Book[]>([])
  const [search, setSearch] = useState("")
  const [categoria, setCategoria] = useState("Todas")
  const { user } = useAuth()
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isLoading, setIsLoading] = useState(true)
  const [deleteBookId, setDeleteBookId] = useState<string | null>(null)
  const [deleteBookTitle, setDeleteBookTitle] = useState<string>("")
  const [deletingBook, setDeletingBook] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    getBooks({
      search: search || undefined,
      categoria: categoria !== "Todas" ? categoria : undefined,
    })
      .then(setBooks)
      .finally(() => setIsLoading(false))
  }, [search, categoria])

  const openDeleteDialog = useCallback((bookId: string, titulo: string) => {
    setDeleteBookId(bookId)
    setDeleteBookTitle(titulo)
  }, [])

  const handleDeleteBook = useCallback(async () => {
    if (!deleteBookId) return
    setDeletingBook(true)
    try {
      await deleteMyBook(deleteBookId)
      setBooks((prev) => prev.filter((book) => book.id !== deleteBookId))
      setDeleteBookId(null)
      setDeleteBookTitle("")
    } finally {
      setDeletingBook(false)
    }
  }, [deleteBookId])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground md:text-3xl">Catalogo de Libros</h1>
          <p className="mt-1 text-muted-foreground">Explora y solicita prestamos de nuestra coleccion</p>
        </div>
        <Link href="/catalogo/agregar">
          <Button className="gap-2">
            <Upload className="h-4 w-4" /> Subir Libro
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por titulo, autor o tema..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-card pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={categoria} onValueChange={setCategoria}>
            <SelectTrigger className="w-40 bg-card">
              <Filter className="mr-2 h-4 w-4 text-muted-foreground" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categorias.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="hidden items-center rounded-lg border border-border sm:flex">
            <Button
              variant="ghost"
              size="icon"
              className={viewMode === "grid" ? "text-primary" : "text-muted-foreground"}
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={viewMode === "list" ? "text-primary" : "text-muted-foreground"}
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Results count */}
      <p className="text-sm text-muted-foreground">
        {books.length} libro(s) encontrado(s)
      </p>

      {/* Books Grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="border-border animate-pulse">
              <CardContent className="p-4">
                <div className="mb-3 h-40 rounded-md bg-muted" />
                <div className="h-4 w-3/4 rounded bg-muted" />
                <div className="mt-2 h-3 w-1/2 rounded bg-muted" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {books.map((book) => {
            const isOwn = Boolean(user?.id && book.subidoPor?.id === user.id)
            return (
              <Link key={book.id} href={`/catalogo/${book.id}`}>
                <Card className="group relative h-full border-border transition-all hover:shadow-md">
                  <CardContent className="p-4">
                    {isOwn && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-3 top-3 z-10 h-9 w-9 text-muted-foreground hover:text-destructive"
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          openDeleteDialog(book.id, book.titulo)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar libro</span>
                      </Button>
                    )}
                    <div className="relative mb-3 flex h-40 items-center justify-center rounded-md bg-primary/5 overflow-hidden">
                      {book.portada ? (
                        <Image
                          src={book.portada}
                          alt={book.titulo}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <BookOpen className="h-12 w-12 text-primary/30 transition-colors group-hover:text-primary/50" />
                      )}
                      {!book.disponible && (
                        <div className="absolute inset-0 flex items-center justify-center rounded-md bg-foreground/5">
                          <Badge variant="secondary" className="bg-muted text-muted-foreground">No disponible</Badge>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <h3 className="truncate text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {book.titulo}
                      </h3>
                      <p className="truncate text-xs text-muted-foreground">{book.autor}</p>
                      <div className="flex items-center gap-1 pt-1">
                        <Star className="h-3 w-3 fill-primary text-primary" />
                        <span className="text-xs font-medium text-foreground">{book.calificacion}</span>
                      </div>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {book.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="bg-muted text-muted-foreground text-[10px] px-1.5 py-0">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      ) : (
        <div className="space-y-3">
          {books.map((book) => {
            const isOwn = Boolean(user?.id && book.subidoPor?.id === user.id)
            return (
              <Link key={book.id} href={`/catalogo/${book.id}`}>
                <Card className="group relative border-border transition-all hover:shadow-md">
                  <CardContent className="flex items-center gap-4 p-4">
                    {isOwn && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-3 top-3 z-10 h-9 w-9 text-muted-foreground hover:text-destructive"
                        onClick={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                          openDeleteDialog(book.id, book.titulo)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Eliminar libro</span>
                      </Button>
                    )}
                    <div className="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-primary/5 overflow-hidden">
                      {book.portada ? (
                        <Image
                          src={book.portada}
                          alt={book.titulo}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <BookOpen className="h-8 w-8 text-primary/30 group-hover:text-primary/50" />
                      )}
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <h3 className="truncate font-semibold text-foreground group-hover:text-primary transition-colors">
                        {book.titulo}
                      </h3>
                      <p className="text-sm text-muted-foreground">{book.autor} - {book.editorial}</p>
                      <div className="mt-1 flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-primary text-primary" />
                          <span className="text-xs font-medium text-foreground">{book.calificacion}</span>
                        </div>
                        {!book.disponible && (
                          <Badge variant="secondary" className="bg-muted text-muted-foreground text-xs">No disponible</Badge>
                        )}
                      </div>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="text-sm text-foreground">{book.paginas} pags</p>
                      <p className="text-xs text-muted-foreground">{book.idioma}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      <AlertDialog open={!!deleteBookId} onOpenChange={(open) => !open && setDeleteBookId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Eliminar libro propio</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Seguro que deseas eliminar "{deleteBookTitle}" de tu catálogo? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBook}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deletingBook}
            >
              {deletingBook ? "Eliminando..." : "Eliminar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {books.length === 0 && !isLoading && (
        <div className="py-12 text-center">
          <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
          <h3 className="mt-4 text-lg font-semibold text-foreground">No se encontraron libros</h3>
          <p className="mt-1 text-muted-foreground">Intenta con otros filtros de busqueda</p>
        </div>
      )}
    </div>
  )
}
