"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { getForumPosts, createForumPost, likeForumPost, unlikeForumPost } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import type { ForumPost } from "@/lib/types"
import {
  MessageSquare,
  Search,
  ThumbsUp,
  MessageCircle,
  Plus,
  Filter,
  Tag,
  TrendingUp,
  Clock,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const categorias = [
  "Todas",
  "Recomendaciones",
  "Grupos de Estudio",
  "Soporte Tecnico",
  "Anuncios",
  "General",
]

const categoriaColors: Record<string, string> = {
  Recomendaciones: "bg-primary/10 text-primary",
  "Grupos de Estudio": "bg-accent/60 text-accent-foreground",
  "Soporte Tecnico": "bg-destructive/10 text-destructive",
  Anuncios: "bg-secondary text-secondary-foreground",
  General: "bg-muted text-muted-foreground",
}

export default function ComunidadPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [posts, setPosts] = useState<ForumPost[]>([])
  const [search, setSearch] = useState("")
  const [categoriaActiva, setCategoriaActiva] = useState("Todas")
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  
  // Form state for new post
  const [newPostTitulo, setNewPostTitulo] = useState("")
  const [newPostCategoria, setNewPostCategoria] = useState("")
  const [newPostContenido, setNewPostContenido] = useState("")
  const [newPostTags, setNewPostTags] = useState("")
  const [submittingPost, setSubmittingPost] = useState(false)
  
  // Track liked posts by the current user (optimistic UI)
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set())

  useEffect(() => {
    setIsLoading(true)
    const params: { search?: string; categoria?: string } = {}
    if (search) params.search = search
    if (categoriaActiva !== "Todas") params.categoria = categoriaActiva
    getForumPosts(params)
      .then(setPosts)
      .finally(() => setIsLoading(false))
  }, [search, categoriaActiva])

  const postsMasPopulares = [...posts].sort((a, b) => b.likes - a.likes)
  const postsMasRecientes = [...posts].sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

  const handleLikePost = useCallback(async (postId: string) => {
    if (!user) return
    
    // Optimistic update
    const alreadyLiked = likedPosts.has(postId)
    
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? { ...post, likes: alreadyLiked ? post.likes - 1 : post.likes + 1 }
          : post
      )
    )
    
    setLikedPosts((prev) => {
      const newSet = new Set(prev)
      if (alreadyLiked) {
        newSet.delete(postId)
      } else {
        newSet.add(postId)
      }
      return newSet
    })
    
    try {
      if (alreadyLiked) {
        await unlikeForumPost(postId)
      } else {
        await likeForumPost(postId)
      }
    } catch (error) {
      // Revert on error
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, likes: alreadyLiked ? post.likes + 1 : post.likes - 1 }
            : post
        )
      )
      setLikedPosts((prev) => {
        const newSet = new Set(prev)
        if (alreadyLiked) {
          newSet.add(postId)
        } else {
          newSet.delete(postId)
        }
        return newSet
      })
      console.error("Error al procesar like:", error)
    }
  }, [user, likedPosts])

  const handleOpenPost = useCallback((postId: string) => {
    router.push(`/comunidad/${postId}`)
  }, [router])

  const handleCreatePost = async () => {
    if (!newPostTitulo.trim() || !newPostCategoria || !newPostContenido.trim()) return
    
    setSubmittingPost(true)
    try {
      const tagsArray = newPostTags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0)
      
      const newPost = await createForumPost({
        titulo: newPostTitulo.trim(),
        contenido: newPostContenido.trim(),
        categoria: newPostCategoria,
        tags: tagsArray,
      })
      
      setPosts((prev) => [newPost, ...prev])
      setDialogOpen(false)
      // Reset form
      setNewPostTitulo("")
      setNewPostCategoria("")
      setNewPostContenido("")
      setNewPostTags("")
    } catch (error) {
      console.error("Error al crear publicacion:", error)
    } finally {
      setSubmittingPost(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">Comunidad</h1>
            <p className="text-muted-foreground">
              Comparte, aprende y conecta con la comunidad TecNM
            </p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" /> Nueva Publicacion
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-foreground">Nueva Publicacion</DialogTitle>
              <DialogDescription>
                Comparte con la comunidad una pregunta, recomendacion o recurso
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="titulo" className="text-foreground">
                  Titulo
                </Label>
                <Input
                  id="titulo"
                  placeholder="Escribe un titulo descriptivo..."
                  className="bg-background"
                  value={newPostTitulo}
                  onChange={(e) => setNewPostTitulo(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="categoria" className="text-foreground">
                  Categoria
                </Label>
                <Select value={newPostCategoria} onValueChange={setNewPostCategoria}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Selecciona una categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categorias
                      .filter((c) => c !== "Todas")
                      .map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contenido" className="text-foreground">
                  Contenido
                </Label>
                <Textarea
                  id="contenido"
                  placeholder="Escribe tu publicacion..."
                  rows={5}
                  className="bg-background resize-none"
                  value={newPostContenido}
                  onChange={(e) => setNewPostContenido(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tags" className="text-foreground">
                  Etiquetas (separadas por coma)
                </Label>
                <Input
                  id="tags"
                  placeholder="programacion, libros, estudio..."
                  className="bg-background"
                  value={newPostTags}
                  onChange={(e) => setNewPostTags(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={submittingPost}>
                Cancelar
              </Button>
              <Button 
                onClick={handleCreatePost} 
                disabled={submittingPost || !newPostTitulo.trim() || !newPostCategoria || !newPostContenido.trim()}
              >
                {submittingPost ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Publicando...
                  </>
                ) : (
                  "Publicar"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar publicaciones..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-card pl-10"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter className="h-4 w-4 shrink-0 text-muted-foreground" />
          {categorias.map((cat) => (
            <Button
              key={cat}
              variant={categoriaActiva === cat ? "default" : "outline"}
              size="sm"
              onClick={() => setCategoriaActiva(cat)}
              className="shrink-0"
            >
              {cat}
            </Button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Feed */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="recientes">
            <TabsList>
              <TabsTrigger value="recientes" className="gap-1.5">
                <Clock className="h-3.5 w-3.5" /> Recientes
              </TabsTrigger>
              <TabsTrigger value="populares" className="gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" /> Populares
              </TabsTrigger>
            </TabsList>

            <TabsContent value="recientes" className="mt-4 space-y-3">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="border-border animate-pulse">
                      <CardContent className="p-5">
                        <div className="h-5 w-3/4 rounded bg-muted" />
                        <div className="mt-3 h-4 w-full rounded bg-muted" />
                        <div className="mt-2 h-4 w-2/3 rounded bg-muted" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : postsMasRecientes.length === 0 ? (
                <Card className="border-border">
                  <CardContent className="flex flex-col items-center py-12 text-center">
                    <MessageSquare className="mb-3 h-10 w-10 text-muted-foreground/40" />
                    <p className="text-muted-foreground">No se encontraron publicaciones</p>
                    <p className="text-sm text-muted-foreground">
                      Intenta con otros filtros o crea la primera publicacion
                    </p>
                  </CardContent>
                </Card>
              ) : (
                postsMasRecientes.map((post) => (
                  <ForumPostCard 
                    key={post.id} 
                    post={post} 
                    isLiked={likedPosts.has(post.id)}
                    onLike={handleLikePost}
                    onOpenPost={handleOpenPost}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="populares" className="mt-4 space-y-3">
              {postsMasPopulares.map((post) => (
                <ForumPostCard 
                  key={post.id} 
                  post={post} 
                  isLiked={likedPosts.has(post.id)}
                  onLike={handleLikePost}
                  onOpenPost={handleOpenPost}
                />
              ))}
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Stats */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-foreground">Estadisticas del Foro</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Publicaciones</span>
                <span className="text-sm font-semibold text-foreground">{posts.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Respuestas totales</span>
                <span className="text-sm font-semibold text-foreground">
                  {posts.reduce((acc, p) => acc + p.respuestas, 0)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Miembros activos</span>
                <span className="text-sm font-semibold text-foreground">156</span>
              </div>
            </CardContent>
          </Card>

          {/* Tags populares */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-foreground">
                <Tag className="h-4 w-4 text-primary" />
                Etiquetas Populares
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {[
                  "programacion",
                  "libros",
                  "calculo",
                  "grupo de estudio",
                  "IA",
                  "bases de datos",
                  "redes",
                  "matematicas",
                  "soporte",
                  "nuevos libros",
                ].map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="cursor-pointer border-border text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Reglas */}
          <Card className="border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-foreground">Reglas del Foro</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  Se respetuoso con todos los miembros
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  Publica en la categoria correcta
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  No compartas contenido con derechos de autor
                </li>
                <li className="flex items-start gap-2">
                  <span className="mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  Usa etiquetas relevantes en tus publicaciones
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function ForumPostCard({ 
  post, 
  isLiked,
  onLike,
  onOpenPost,
}: { 
  post: ForumPost
  isLiked: boolean
  onLike: (postId: string) => void
  onOpenPost: (postId: string) => void
}) {
  const initials = post.autor.nombre
    ? post.autor.nombre
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U"

  return (
    <Card className="border-border transition-shadow hover:shadow-sm">
      <CardContent className="p-5">
        <div className="flex items-start gap-3">
          <Avatar className="mt-0.5 h-9 w-9 shrink-0">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 overflow-hidden">
            <div className="flex items-start justify-between gap-2">
              <button 
                onClick={() => onOpenPost(post.id)}
                className="text-left hover:underline"
              >
                <h3 className="text-sm font-semibold text-foreground leading-snug">{post.titulo}</h3>
              </button>
              <Badge
                variant="secondary"
                className={`shrink-0 text-xs ${categoriaColors[post.categoria] || "bg-muted text-muted-foreground"}`}
              >
                {post.categoria}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {post.autor.nombre} /{" "}
              <span className="capitalize">{post.autor.rol}</span> / {post.fecha}
            </p>
            <button 
              onClick={() => onOpenPost(post.id)}
              className="text-left w-full"
            >
              <p className="mt-2 line-clamp-2 text-sm text-foreground/80 leading-relaxed">
                {post.contenido}
              </p>
            </button>
            <div className="mt-3 flex items-center gap-4">
              <button 
                onClick={() => onLike(post.id)}
                className={`flex items-center gap-1.5 text-xs transition-colors ${
                  isLiked 
                    ? "text-primary font-medium" 
                    : "text-muted-foreground hover:text-primary"
                }`}
              >
                <ThumbsUp className={`h-3.5 w-3.5 ${isLiked ? "fill-primary" : ""}`} />
                {post.likes}
              </button>
              <button 
                onClick={() => onOpenPost(post.id)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                {post.respuestas} respuestas
              </button>
              <div className="ml-auto flex items-center gap-1.5">
                {post.tags.slice(0, 3).map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="border-border text-[10px] text-muted-foreground"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
