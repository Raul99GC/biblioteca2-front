"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getForumPostById, getForumReplies, createForumReply, likeForumPost, unlikeForumPost } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import type { ForumPost, ForumReply } from "@/lib/types"
import {
  ArrowLeft,
  ThumbsUp,
  MessageCircle,
  Send,
  Loader2,
  Tag,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"

const categoriaColors: Record<string, string> = {
  Recomendaciones: "bg-primary/10 text-primary",
  "Grupos de Estudio": "bg-accent/60 text-accent-foreground",
  "Soporte Tecnico": "bg-destructive/10 text-destructive",
  Anuncios: "bg-secondary text-secondary-foreground",
  General: "bg-muted text-muted-foreground",
}

export default function PostDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const postId = params.id as string

  const [post, setPost] = useState<ForumPost | null>(null)
  const [replies, setReplies] = useState<ForumReply[]>([])
  const [loading, setLoading] = useState(true)
  const [repliesLoading, setRepliesLoading] = useState(true)
  
  // Reply form state
  const [newReply, setNewReply] = useState("")
  const [submittingReply, setSubmittingReply] = useState(false)
  
  // Like state
  const [isLiked, setIsLiked] = useState(false)
  const [likingPost, setLikingPost] = useState(false)

  useEffect(() => {
    if (!postId) return
    
    setLoading(true)
    getForumPostById(postId)
      .then(setPost)
      .finally(() => setLoading(false))
    
    setRepliesLoading(true)
    getForumReplies(postId)
      .then(setReplies)
      .finally(() => setRepliesLoading(false))
  }, [postId])

  const handleLikePost = useCallback(async () => {
    if (!post || !user || likingPost) return
    
    setLikingPost(true)
    const wasLiked = isLiked
    
    // Optimistic update
    setIsLiked(!wasLiked)
    setPost((prev) => 
      prev ? { ...prev, likes: wasLiked ? prev.likes - 1 : prev.likes + 1 } : prev
    )
    
    try {
      if (wasLiked) {
        await unlikeForumPost(post.id)
      } else {
        await likeForumPost(post.id)
      }
    } catch (error) {
      // Revert on error
      setIsLiked(wasLiked)
      setPost((prev) => 
        prev ? { ...prev, likes: wasLiked ? prev.likes + 1 : prev.likes - 1 } : prev
      )
      console.error("Error al procesar like:", error)
    } finally {
      setLikingPost(false)
    }
  }, [post, user, isLiked, likingPost])

  const handleSubmitReply = useCallback(async () => {
    if (!post || !newReply.trim() || submittingReply) return
    
    setSubmittingReply(true)
    try {
      const reply = await createForumReply(post.id, newReply.trim())
      setReplies((prev) => [...prev, reply])
      setPost((prev) => prev ? { ...prev, respuestas: prev.respuestas + 1 } : prev)
      setNewReply("")
    } catch (error) {
      console.error("Error al crear respuesta:", error)
    } finally {
      setSubmittingReply(false)
    }
  }, [post, newReply, submittingReply])

  const getInitials = (nombre: string | undefined) => {
    if (!nombre) return "U"
    return nombre
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!post) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>
        <Card className="border-border">
          <CardContent className="flex flex-col items-center py-12 text-center">
            <MessageCircle className="mb-3 h-10 w-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">Publicacion no encontrada</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Volver
        </Button>
        <Badge
          variant="secondary"
          className={categoriaColors[post.categoria] || "bg-muted text-muted-foreground"}
        >
          {post.categoria}
        </Badge>
      </div>

      {/* Post Content */}
      <Card className="border-border">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <Avatar className="h-12 w-12 shrink-0">
              {post.autor.avatar && <AvatarImage src={post.autor.avatar} alt={post.autor.nombre} />}
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(post.autor.nombre)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-foreground md:text-2xl">{post.titulo}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {post.autor.nombre} / <span className="capitalize">{post.autor.rol}</span> / {post.fecha}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">{post.contenido}</p>
          </div>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              {post.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="border-border text-xs text-muted-foreground"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <Separator className="my-6" />

          {/* Actions */}
          <div className="flex items-center gap-4">
            <Button
              variant={isLiked ? "default" : "outline"}
              size="sm"
              onClick={handleLikePost}
              disabled={!user || likingPost}
              className="gap-2"
            >
              <ThumbsUp className={`h-4 w-4 ${isLiked ? "fill-current" : ""}`} />
              {post.likes} Me gusta
            </Button>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MessageCircle className="h-4 w-4" />
              {post.respuestas} respuestas
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reply Form */}
      {user ? (
        <Card className="border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base text-foreground">Escribe una respuesta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Comparte tu opinion o respuesta..."
              value={newReply}
              onChange={(e) => setNewReply(e.target.value)}
              rows={3}
              className="bg-background resize-none"
            />
            <div className="flex justify-end">
              <Button
                onClick={handleSubmitReply}
                disabled={submittingReply || !newReply.trim()}
                className="gap-2"
              >
                {submittingReply ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Responder
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border">
          <CardContent className="flex items-center justify-center gap-2 py-6 text-center">
            <p className="text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline">
                Inicia sesion
              </Link>{" "}
              para responder a esta publicacion
            </p>
          </CardContent>
        </Card>
      )}

      {/* Replies */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">
          Respuestas ({replies.length})
        </h2>

        {repliesLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border-border animate-pulse">
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <div className="h-9 w-9 rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-1/4 rounded bg-muted" />
                      <div className="h-4 w-full rounded bg-muted" />
                      <div className="h-4 w-2/3 rounded bg-muted" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : replies.length === 0 ? (
          <Card className="border-border">
            <CardContent className="flex flex-col items-center py-8 text-center">
              <MessageCircle className="mb-2 h-8 w-8 text-muted-foreground/40" />
              <p className="text-muted-foreground">Aun no hay respuestas</p>
              <p className="text-sm text-muted-foreground">Se el primero en responder</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {replies.map((reply) => (
              <ReplyCard key={reply.id} reply={reply} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ReplyCard({ reply }: { reply: ForumReply }) {
  const initials = reply.autor.nombre
    ? reply.autor.nombre
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U"

  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar className="h-9 w-9 shrink-0">
            {reply.autor.avatar && <AvatarImage src={reply.autor.avatar} alt={reply.autor.nombre} />}
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{reply.autor.nombre}</span>
              <span className="text-xs text-muted-foreground capitalize">/ {reply.autor.rol}</span>
              <span className="text-xs text-muted-foreground">/ {reply.fecha}</span>
            </div>
            <p className="mt-2 text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
              {reply.contenido}
            </p>
            <div className="mt-3 flex items-center gap-4">
              <button className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-primary">
                <ThumbsUp className="h-3.5 w-3.5" />
                {reply.likes}
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
