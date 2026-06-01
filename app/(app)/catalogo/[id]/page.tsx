"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { getBookById, createLoan, getBookReviews, createReview, deleteReview, addFavorite, removeFavorite, isBookFavorited, getFavorites, deleteMyBook } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import type { Book, BookReview, CreateReviewPayload } from "@/lib/types"
import {
  BookOpen, Star, ArrowLeft, BookMarked, Calendar, Globe, Building2,
  Hash, Tag, Loader2, Heart, MessageSquare, Send, Trash2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function BookDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const [book, setBook] = useState<Book | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [borrowing, setBorrowing] = useState(false)
  const [borrowed, setBorrowed] = useState(false)

  // Reviews state
  const [reviews, setReviews] = useState<BookReview[]>([])
  const [reviewsLoading, setReviewsLoading] = useState(true)
  const [newReviewRating, setNewReviewRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [newReviewTitle, setNewReviewTitle] = useState("")
  const [newReviewComment, setNewReviewComment] = useState("")
  const [submittingReview, setSubmittingReview] = useState(false)
  const [deleteReviewId, setDeleteReviewId] = useState<string | null>(null)
  const [deleteBookDialogOpen, setDeleteBookDialogOpen] = useState(false)
  const [deletingBook, setDeletingBook] = useState(false)

  // Favorites state
  const [isFavorited, setIsFavorited] = useState(false)
  const [favId, setFavId] = useState<string | null>(null)
  const [togglingFav, setTogglingFav] = useState(false)

  useEffect(() => {
    if (params.id) {
      const bookId = params.id as string
      getBookById(bookId)
        .then(setBook)
        .finally(() => setIsLoading(false))

      getBookReviews(bookId)
        .then(setReviews)
        .finally(() => setReviewsLoading(false))

      isBookFavorited(bookId).then(setIsFavorited)
      getFavorites("usr-001").then((favs) => {
        const found = favs.find((f) => f.libroId === bookId)
        if (found) setFavId(found.id)
      })
    }
  }, [params.id])

  const handleBorrow = async () => {
    if (!book) return
    setBorrowing(true)
    try {
      await createLoan(book.id)
      setBorrowed(true)
    } finally {
      setBorrowing(false)
    }
  }

  const handleToggleFavorite = useCallback(async () => {
    if (!book) return
    setTogglingFav(true)
    try {
      if (isFavorited && favId) {
        await removeFavorite(favId)
        setIsFavorited(false)
        setFavId(null)
      } else {
        const fav = await addFavorite(book.id)
        setIsFavorited(true)
        setFavId(fav.id)
      }
    } finally {
      setTogglingFav(false)
    }
  }, [book, isFavorited, favId])

  const handleSubmitReview = useCallback(async () => {
    if (!book || newReviewRating === 0 || !newReviewTitle.trim() || !newReviewComment.trim()) return
    setSubmittingReview(true)
    try {
      const payload: CreateReviewPayload = {
        libroId: book.id,
        titulo: newReviewTitle.trim(),
        calificacion: newReviewRating,
        comentario: newReviewComment.trim(),
      }
      const newRev = await createReview(payload)
      setReviews((prev) => [newRev, ...prev])
      setNewReviewRating(0)
      setNewReviewTitle("")
      setNewReviewComment("")
    } finally {
      setSubmittingReview(false)
    }
  }, [book, newReviewRating, newReviewTitle, newReviewComment])

  const handleDeleteReview = useCallback(async () => {
    if (!deleteReviewId) return
    await deleteReview(deleteReviewId)
    setReviews((prev) => prev.filter((r) => r.id !== deleteReviewId))
    setDeleteReviewId(null)
  }, [deleteReviewId])

  const handleDeleteBook = useCallback(async () => {
    if (!book) return
    setDeletingBook(true)
    try {
      await deleteMyBook(book.id)
      router.push("/catalogo")
    } finally {
      setDeletingBook(false)
    }
  }, [book, router])

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.calificacion, 0) / reviews.length).toFixed(1)
    : book?.calificacion ?? 0

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!book) {
    return (
      <div className="py-16 text-center">
        <BookOpen className="mx-auto h-12 w-12 text-muted-foreground/50" />
        <h2 className="mt-4 text-xl font-semibold text-foreground">Libro no encontrado</h2>
        <Button variant="ghost" className="mt-4 text-primary" onClick={() => router.push("/catalogo")}>
          Volver al catalogo
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" className="gap-2 text-muted-foreground" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>
        <div className="flex items-center gap-2">
          {book.subidoPor?.id === user?.id && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-destructive"
              onClick={() => setDeleteBookDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4" /> Eliminar
            </Button>
          )}
          <Button
            variant={isFavorited ? "default" : "outline"}
            size="sm"
            className={`gap-2 ${!isFavorited ? "text-foreground" : ""}`}
            onClick={handleToggleFavorite}
            disabled={togglingFav}
          >
            <Heart className={`h-4 w-4 ${isFavorited ? "fill-current" : ""}`} />
            {isFavorited ? "En favoritos" : "Agregar a favoritos"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Book Cover */}
        <div className="lg:col-span-1">
          <Card className="border-border overflow-hidden">
            <div className="relative flex aspect-[3/4] items-center justify-center bg-primary/5 overflow-hidden">
              {book.portada ? (
                <Image
                  src={book.portada}
                  alt={book.titulo}
                  fill
                  className="object-cover"
                />
              ) : (
                <BookOpen className="h-20 w-20 text-primary/30" />
              )}
            </div>
            <CardContent className="p-4 space-y-3">
              {borrowed ? (
                <div className="rounded-lg bg-accent/60 p-3 text-center">
                  <p className="text-sm font-medium text-accent-foreground">Prestamo solicitado con exito</p>
                </div>
              ) : book.disponible ? (
                <Button className="w-full gap-2" onClick={handleBorrow} disabled={borrowing}>
                  {borrowing ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookMarked className="h-4 w-4" />}
                  Solicitar Prestamo
                </Button>
              ) : (
                <div className="rounded-lg bg-muted p-3 text-center">
                  <p className="text-sm font-medium text-muted-foreground">No disponible actualmente</p>
                </div>
              )}

              <Separator />

              {/* Quick Stats */}
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Calificacion</span>
                  <div className="flex items-center gap-1">
                    <Star className="h-3.5 w-3.5 fill-primary text-primary" />
                    <span className="font-semibold text-foreground">{avgRating}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Resenas</span>
                  <span className="font-semibold text-foreground">{reviews.length}</span>
                </div>

              </div>
            </CardContent>
          </Card>
        </div>

        {/* Book Details + Reviews */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-2xl text-foreground">{book.titulo}</CardTitle>
                  <p className="mt-1 text-muted-foreground">{book.autor}</p>
                </div>
                <Badge
                  variant={book.disponible ? "default" : "secondary"}
                  className={book.disponible ? "" : "bg-muted text-muted-foreground"}
                >
                  {book.disponible ? "Disponible" : "No disponible"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Rating */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-5 w-5 ${
                        star <= Math.floor(Number(avgRating))
                          ? "fill-primary text-primary"
                          : "text-muted"
                      }`}
                    />
                  ))}
                </div>
                <span className="text-lg font-semibold text-foreground">{avgRating}</span>
                <span className="text-sm text-muted-foreground">({reviews.length} resenas)</span>
              </div>
              <Progress value={(Number(avgRating) / 5) * 100} className="h-2" />

              <Separator />

              {/* Description */}
              <div>
                <h3 className="mb-2 font-semibold text-foreground">Descripcion</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{book.descripcion}</p>
              </div>

              <Separator />

              {/* Metadata */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Editorial:</span>
                  <span className="font-medium text-foreground">{book.editorial}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Publicacion:</span>
                  <span className="font-medium text-foreground">{book.anioPublicacion}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Idioma:</span>
                  <span className="font-medium text-foreground">{book.idioma}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Paginas:</span>
                  <span className="font-medium text-foreground">{book.paginas}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">ISBN:</span>
                  <span className="font-medium text-foreground">{book.isbn}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Categoria:</span>
                  <span className="font-medium text-foreground">{book.categoria}</span>
                </div>
              </div>

              <Separator />

              {/* Tags */}
              <div>
                <h3 className="mb-2 font-semibold text-foreground">Etiquetas</h3>
                <div className="flex flex-wrap gap-2">
                  {book.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="bg-muted text-muted-foreground">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reviews Section */}
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-primary" />
                <CardTitle className="text-foreground">Resenas ({reviews.length})</CardTitle>
              </div>
              <CardDescription>Comparte tu opinion sobre este libro</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Write Review Form */}
              <div className="rounded-lg border border-border p-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Tu calificacion</Label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReviewRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="rounded p-0.5 transition-colors hover:bg-muted"
                      >
                        <Star
                          className={`h-6 w-6 transition-colors ${
                            star <= (hoverRating || newReviewRating)
                              ? "fill-primary text-primary"
                              : "text-muted"
                          }`}
                        />
                        <span className="sr-only">{star} estrellas</span>
                      </button>
                    ))}
                    {newReviewRating > 0 && (
                      <span className="ml-2 text-sm text-muted-foreground">{newReviewRating}/5</span>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="review-title" className="text-foreground">Titulo de tu resena</Label>
                  <Input
                    id="review-title"
                    value={newReviewTitle}
                    onChange={(e) => setNewReviewTitle(e.target.value)}
                    placeholder="Escribe un titulo para tu resena..."
                    className="bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="review-comment" className="text-foreground">Tu comentario</Label>
                  <Textarea
                    id="review-comment"
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    placeholder="Comparte que te parecio este libro..."
                    rows={3}
                    className="resize-none"
                  />
                </div>
                <Button
                  onClick={handleSubmitReview}
                  disabled={submittingReview || newReviewRating === 0 || !newReviewTitle.trim() || !newReviewComment.trim()}
                  className="gap-2"
                  size="sm"
                >
                  {submittingReview ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Publicar Resena
                </Button>
              </div>

              <Separator />

              {/* Reviews List */}
              {reviewsLoading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="animate-pulse space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-muted" />
                        <div className="h-4 w-32 rounded bg-muted" />
                      </div>
                      <div className="h-3 w-full rounded bg-muted" />
                      <div className="h-3 w-2/3 rounded bg-muted" />
                    </div>
                  ))}
                </div>
              ) : reviews.length === 0 ? (
                <div className="py-6 text-center">
                  <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/40" />
                  <p className="mt-2 text-sm text-muted-foreground">Aun no hay resenas. Se el primero en opinar.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => {
                    const initials = review.usuario.nombre
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()
                    const isOwn = review.usuarioId === user?.id

                    return (
                      <div key={review.id} className="flex gap-3">
                        <Avatar className="h-9 w-9 shrink-0">
                          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-foreground">{review.usuario.nombre}</span>
                              <Badge variant="secondary" className="text-[10px] capitalize bg-muted text-muted-foreground">
                                {review.usuario.rol}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{review.fecha}</span>
                              {isOwn && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                  onClick={() => setDeleteReviewId(review.id)}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span className="sr-only">Eliminar resena</span>
                                </Button>
                              )}
                            </div>
                          </div>
                          <div className="mt-1 flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star
                                key={s}
                                className={`h-3.5 w-3.5 ${
                                  s <= review.calificacion ? "fill-primary text-primary" : "text-muted"
                                }`}
                              />
                            ))}
                          </div>
                          <p className="mt-1.5 text-sm text-foreground/80 leading-relaxed">
                            {review.comentario}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Delete Book Confirmation */}
      <AlertDialog open={deleteBookDialogOpen} onOpenChange={setDeleteBookDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Eliminar libro</AlertDialogTitle>
            <AlertDialogDescription>
              El libro se borrará de tu catálogo y no se podrá recuperar.
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

      {/* Delete Review Confirmation */}
      <AlertDialog open={!!deleteReviewId} onOpenChange={(open) => !open && setDeleteReviewId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Eliminar resena</AlertDialogTitle>
            <AlertDialogDescription>
              Esta seguro de que desea eliminar su resena? Esta accion no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteReview}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
