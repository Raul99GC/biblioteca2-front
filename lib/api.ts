/**
 * API Client - Biblioteca 2.0
 * 
 * Conexion real al backend en http://localhost:8080
 */

import type {
  Book, Loan, StudyRoom, Reservation, ForumPost, ForumReply, User, Notification, DashboardStats,
  CreateBookPayload, UpdateBookPayload, UpdateUserPayload, BookReview, CreateReviewPayload,
  Favorite, BookUpload, CreateBookUploadPayload, QRCheckEvent, CreateStudyRoomPayload, QRScanResult,
} from "./types"

// Base URL del backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080"

// Clave del token (debe coincidir con auth-context.tsx)
const TOKEN_KEY = "biblioteca2_token"

// Helper para obtener el token JWT del sessionStorage
function getToken(): string | null {
  if (typeof window === "undefined") return null
  return sessionStorage.getItem(TOKEN_KEY)
}

// Helper para hacer peticiones con auth
async function fetchWithAuth<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken()
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Error desconocido" }))
    throw new Error(error.message || `HTTP Error: ${response.status}`)
  }
  // si no regresa un json el response no regresa nada
  if (response.status === 204) {
    return {} as T
  }

  return response.json()
}

// Helper para peticiones sin auth
async function fetchPublic<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...options.headers,
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Error desconocido" }))
    throw new Error(error.message || `HTTP Error: ${response.status}`)
  }

  return response.json()
}

// ============================================
// AUTH ENDPOINTS (PASSWORD RESET)
// ============================================

export async function forgotPassword(email: string): Promise<{ message: string }> {
  return fetchPublic<{ message: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  })
}

export async function resetPassword(codigo: string, password: string, confirmPassword: string): Promise<{ message: string }> {
  return fetchPublic<{ message: string }>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ codigo, password, confirmPassword }),
  })
}

// ============================================
// AUTH ENDPOINTS
// ============================================

export async function loginUser(email: string, password: string): Promise<{ user: User; token: string }> {
  return fetchPublic<{ user: User; token: string }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  })
}

export async function registerUser(data: {
  nombre: string
  email: string
  password: string
  rol: string
}): Promise<{ user: User; token: string }> {
  return fetchPublic<{ user: User; token: string }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function verifyToken(token: string): Promise<User | null> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) return null
    return response.json()
  } catch {
    return null
  }
}

// ============================================
// LIBROS ENDPOINTS
// ============================================

// Tipo para respuestas paginadas del backend
interface PaginatedResponse<T> {
  data: T[]
  page: number
  limit: number
  total: number
}

export async function getBooks(params?: {
  search?: string
  categoria?: string
  formato?: string
}): Promise<Book[]> {
  const searchParams = new URLSearchParams()
  if (params?.search) searchParams.set("search", params.search)
  if (params?.categoria) searchParams.set("categoria", params.categoria)
  if (params?.formato) searchParams.set("formato", params.formato)
  
  const query = searchParams.toString() ? `?${searchParams.toString()}` : ""
  const response = await fetchWithAuth<PaginatedResponse<Book> | Book[]>(`/api/libros${query}`)
  
  // Manejar respuesta paginada o array directo
  if (Array.isArray(response)) {
    return response
  }
  return response.data
}

export async function getBookById(id: string): Promise<Book | null> {
  try {
    return await fetchWithAuth<Book>(`/api/libros/${id}`)
  } catch {
    return null
  }
}

export async function getMyBooks(): Promise<Book[]> {
  return fetchWithAuth<Book[]>("/api/libros/mis-libros")
}

// ============================================
// PRESTAMOS ENDPOINTS
// ============================================

export async function getLoans(userId?: string): Promise<Loan[]> {
  const query = userId ? `?userId=${userId}` : ""
  return fetchWithAuth<Loan[]>(`/api/prestamos${query}`)
}

export async function createLoan(bookId: string): Promise<Loan> {
  return fetchWithAuth<Loan>("/api/prestamos", {
    method: "POST",
    body: JSON.stringify({ libroId: bookId }),
  })
}

export async function returnLoan(loanId: string): Promise<Loan> {
  return fetchWithAuth<Loan>(`/api/prestamos/${loanId}/devolver`, {
    method: "PUT",
  })
}

// ============================================
// SALAS DE ESTUDIO ENDPOINTS
// ============================================

export async function getStudyRooms(params?: {
  tipo?: string
  disponible?: boolean
  lat?: number
  lng?: number
  maxDistancia?: number
}): Promise<StudyRoom[]> {
  const searchParams = new URLSearchParams()
  if (params?.tipo) searchParams.set("tipo", params.tipo)
  if (params?.disponible !== undefined) searchParams.set("disponible", String(params.disponible))
  if (params?.lat !== undefined) searchParams.set("lat", String(params.lat))
  if (params?.lng !== undefined) searchParams.set("lng", String(params.lng))
  if (params?.maxDistancia !== undefined) searchParams.set("maxDistancia", String(params.maxDistancia))
  
  const query = searchParams.toString() ? `?${searchParams.toString()}` : ""
  return fetchWithAuth<StudyRoom[]>(`/api/salas${query}`)
}

export async function getStudyRoomById(id: string): Promise<StudyRoom | null> {
  try {
    return await fetchWithAuth<StudyRoom>(`/api/salas/${id}`)
  } catch {
    return null
  }
}

// Funcion auxiliar para calcular distancia entre dos puntos (Haversine)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radio de la Tierra en km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

// Obtener salas de estudio con distancia calculada desde la ubicacion del usuario
export async function getStudyRoomsWithDistance(
  userLat?: number,
  userLng?: number,
  params?: { tipo?: string; disponible?: boolean; maxDistancia?: number }
): Promise<(StudyRoom & { distancia?: number })[]> {
  const queryParams: Parameters<typeof getStudyRooms>[0] = {
    ...params,
  }

  if (params?.maxDistancia !== undefined && userLat !== undefined && userLng !== undefined) {
    queryParams.lat = userLat
    queryParams.lng = userLng
  }

  const rooms = await getStudyRooms(queryParams)
  
  if (userLat && userLng) {
    return rooms.map(room => ({
      ...room,
      distancia: room.coordenadas 
        ? calculateDistance(userLat, userLng, room.coordenadas.lat, room.coordenadas.lng)
        : undefined
    })).sort((a, b) => (a.distancia ?? Infinity) - (b.distancia ?? Infinity))
  }
  
  return rooms
}

export async function createReservation(data: {
  salaId: string
  fecha: string
  horaInicio: string
  horaFin: string
}): Promise<Reservation> {
  return fetchWithAuth<Reservation>("/api/reservas", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function getReservations(userId?: string): Promise<Reservation[]> {
  const query = userId ? `?userId=${userId}` : ""
  return fetchWithAuth<Reservation[]>(`/api/reservas${query}`)
}

export async function getAllReservations(): Promise<Reservation[]> {
  return fetchWithAuth<Reservation[]>("/api/admin/reservas")
}

export async function createStudyRoom(data: CreateStudyRoomPayload): Promise<StudyRoom> {
  const token = getToken()

  // Si viene un archivo en data.imagen, usar FormData y multipart/form-data
  const formData = new FormData()

  formData.append("nombre", data.nombre)
  formData.append("ubicacion", data.ubicacion)
  formData.append("capacidad", String(data.capacidad))
  formData.append("horario", data.horario)
  formData.append("tipo", data.tipo)
  formData.append("latitud", String(data.coordenadas.lat))
  formData.append("longitud", String(data.coordenadas.lng))
  // equipamiento como JSON
  formData.append("equipamiento", JSON.stringify(data.equipamiento || []))

  if (data.imagen && typeof data.imagen !== "string") {
    formData.append("imagen", data.imagen)
  }

  const response = await fetch(`${API_BASE_URL}/api/admin/salas`, {
    method: "POST",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Error al crear sala" }))
    throw new Error(error.message || `HTTP Error: ${response.status}`)
  }

  return response.json()
}

// ============================================
// FORO ENDPOINTS
// ============================================

export async function getForumPosts(params?: {
  categoria?: string
  search?: string
}): Promise<ForumPost[]> {
  const searchParams = new URLSearchParams()
  if (params?.categoria) searchParams.set("categoria", params.categoria)
  if (params?.search) searchParams.set("search", params.search)
  
  const query = searchParams.toString() ? `?${searchParams.toString()}` : ""
  return fetchWithAuth<ForumPost[]>(`/api/foro/posts${query}`)
}

export async function getForumPostById(id: string): Promise<ForumPost | null> {
  try {
    return await fetchWithAuth<ForumPost>(`/api/foro/posts/${id}`)
  } catch {
    return null
  }
}

export async function getForumReplies(postId: string): Promise<ForumReply[]> {
  return fetchWithAuth<ForumReply[]>(`/api/foro/posts/${postId}/respuestas`)
}

export async function createForumPost(data: {
  titulo: string
  contenido: string
  categoria: string
  tags: string[]
}): Promise<ForumPost> {
  return fetchWithAuth<ForumPost>("/api/foro/posts", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function createForumReply(postId: string, contenido: string): Promise<ForumReply> {
  return fetchWithAuth<ForumReply>(`/api/foro/posts/${postId}/respuestas`, {
    method: "POST",
    body: JSON.stringify({ contenido }),
  })
}

export async function likeForumPost(postId: string): Promise<void> {
  await fetchWithAuth<void>(`/api/foro/posts/${postId}/like`, {
    method: "POST",
  })
}

export async function unlikeForumPost(postId: string): Promise<void> {
  await fetchWithAuth<void>(`/api/foro/posts/${postId}/like`, {
    method: "DELETE",
  })
}

// ============================================
// NOTIFICACIONES ENDPOINTS
// ============================================

export async function getNotifications(): Promise<Notification[]> {
  return fetchWithAuth<Notification[]>("/api/notificaciones")
}

export async function markNotificationRead(id: string): Promise<void> {
  await fetchWithAuth<void>(`/api/notificaciones/${id}/leer`, {
    method: "PUT",
  })
}

export async function markAllNotificationsRead(): Promise<void> {
  await fetchWithAuth<void>("/api/notificaciones/leer-todas", {
    method: "PUT",
  })
}

// ============================================
// DASHBOARD ENDPOINTS (ADMIN ONLY)
// ============================================

export async function getAdminDashboardStats(): Promise<DashboardStats> {
  return fetchWithAuth<DashboardStats>("/api/admin/dashboard/stats")
}

// ============================================
// USUARIOS ENDPOINTS (ADMIN)
// ============================================

export async function getAllUsers(): Promise<User[]> {
  return fetchWithAuth<User[]>("/api/admin/usuarios")
}

export async function getUserProfile(id?: string): Promise<User> {
  const endpoint = id ? `/api/usuarios/${id}/perfil` : "/api/usuarios/perfil"
  return fetchWithAuth<User>(endpoint)
}

export async function updateUserProfile(data: UpdateUserPayload): Promise<User> {
  return fetchWithAuth<User>("/api/usuarios/perfil", {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export async function updateUserAvatar(file: File): Promise<User> {
  const formData = new FormData()
  formData.append("avatar", file)
  
  const token = getToken()
  const response = await fetch(`${API_BASE_URL}/api/usuarios/perfil/avatar`, {
    method: "PUT",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Error al subir imagen" }))
    throw new Error(error.message)
  }
  
  return response.json()
}

// ============================================
// LIBROS CRUD (ADMIN)
// ============================================

export async function createBook(data: CreateBookPayload): Promise<Book> {
  return fetchWithAuth<Book>("/api/admin/libros", {
    method: "POST",
    body: JSON.stringify(data),
  })
}

export async function updateBook(id: string, data: UpdateBookPayload): Promise<Book> {
  return fetchWithAuth<Book>(`/api/admin/libros/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export async function deleteBook(id: string): Promise<void> {
  await fetchWithAuth<void>(`/api/admin/libros/${id}`, {
    method: "DELETE",
  })
}

// ============================================
// USUARIOS CRUD (ADMIN)
// ============================================

export async function updateUser(id: string, data: UpdateUserPayload): Promise<User> {
  return fetchWithAuth<User>(`/api/admin/usuarios/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  })
}

export async function deactivateUser(id: string): Promise<void> {
  await fetchWithAuth<void>(`/api/admin/usuarios/${id}/desactivar`, {
    method: "PUT",
  })
}

// ============================================
// PRESTAMOS CRUD (ADMIN)
// ============================================

export async function markLoanReturned(loanId: string): Promise<Loan> {
  return fetchWithAuth<Loan>(`/api/admin/prestamos/${loanId}/devolver`, {
    method: "PUT",
  })
}

// ============================================
// RESENAS ENDPOINTS
// ============================================

export async function getBookReviews(bookId: string): Promise<BookReview[]> {
  return fetchWithAuth<BookReview[]>(`/api/libros/${bookId}/resenas`)
}

export async function createReview(data: CreateReviewPayload): Promise<BookReview> {
  return fetchWithAuth<BookReview>(`/api/libros/${data.libroId}/resenas`, {
    method: "POST",
    body: JSON.stringify({
      titulo: data.titulo,
      calificacion: data.calificacion,
      comentario: data.comentario,
    }),
  })
}

export async function deleteReview(reviewId: string): Promise<void> {
  await fetchWithAuth<void>(`/api/resenas/${reviewId}`, {
    method: "DELETE",
  })
}

// ============================================
// FAVORITOS ENDPOINTS
// ============================================

export async function getFavorites(userId?: string): Promise<Favorite[]> {
  const query = userId ? `?userId=${userId}` : ""
  return fetchWithAuth<Favorite[]>(`/api/favoritos${query}`)
}

export async function addFavorite(bookId: string): Promise<Favorite> {
  return fetchWithAuth<Favorite>("/api/favoritos", {
    method: "POST",
    body: JSON.stringify({ libroId: bookId }),
  })
}

export async function removeFavorite(favoriteId: string): Promise<void> {
  await fetchWithAuth<void>(`/api/favoritos/${favoriteId}`, {
    method: "DELETE",
  })
}

export async function isBookFavorited(bookId: string): Promise<boolean> {
  try {
    const result = await fetchWithAuth<{ favorited: boolean }>(`/api/favoritos/check/${bookId}`)
    return result.favorited
  } catch {
    return false
  }
}

// ============================================
// SUBIDA DE LIBROS ENDPOINTS
// ============================================

export async function getBookUploads(): Promise<BookUpload[]> {
  return fetchWithAuth<BookUpload[]>("/api/admin/uploads/pendientes")
}

export async function getMyUploads(userId?: string): Promise<BookUpload[]> {
  const query = userId ? `?userId=${userId}` : ""
  return fetchWithAuth<BookUpload[]>(`/api/libros/uploads/mis-subidas${query}`)
}

export async function deleteMyUpload(uploadId: string): Promise<void> {
  await fetchWithAuth<void>(`/api/libros/${uploadId}/uploads`, {
    method: "DELETE",
  })
}

export async function deleteMyBook(bookId: string): Promise<void> {
  await fetchWithAuth<void>(`/api/libros/${bookId}/mio`, {
    method: "DELETE",
  })
}

export async function uploadBook(data: CreateBookUploadPayload): Promise<BookUpload> {
  const token = getToken()
  const formData = new FormData()
  
  // Agregar todos los campos de texto
  formData.append("titulo", data.titulo)
  formData.append("autor", data.autor)
  formData.append("isbn", data.isbn)
  formData.append("categoria", data.categoria)
  formData.append("descripcion", data.descripcion)
  formData.append("formato", data.formato)
  formData.append("idioma", data.idioma)
  formData.append("paginas", String(data.paginas))
  formData.append("editorial", data.editorial)
  formData.append("anioPublicacion", String(data.anioPublicacion))
  formData.append("tags", JSON.stringify(data.tags))
  
  // Agregar imagen si existe
  if (data.imagen) {
    console.log("[v0] Agregando imagen al FormData:", data.imagen.name, data.imagen.size, data.imagen.type)
    formData.append("imagen", data.imagen)
  } else {
    console.log("[v0] NO hay imagen en el payload")
  }
  
  console.log("[v0] FormData entries:", Array.from(formData.entries()).map(([k, v]) => [k, v instanceof File ? `File(${v.name})` : v]))
  
  const response = await fetch(`${API_BASE_URL}/api/libros/uploads`, {
    method: "POST",
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: formData,
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: "Error al subir libro" }))
    throw new Error(error.message)
  }
  
  return response.json()
}

export async function approveUpload(uploadId: string): Promise<BookUpload> {
  return fetchWithAuth<BookUpload>(`/api/admin/uploads/${uploadId}/aprobar`, {
    method: "PUT",
  })
}

export async function rejectUpload(uploadId: string, motivo?: string): Promise<BookUpload> {
  return fetchWithAuth<BookUpload>(`/api/admin/uploads/${uploadId}/rechazar`, {
    method: "PUT",
    body: JSON.stringify({ motivo }),
  })
}

// ============================================
// QR CHECK-IN / CHECK-OUT ENDPOINTS
// ============================================

export async function generateQRCode(reservaId: string): Promise<string> {
  const result = await fetchWithAuth<{ codigoQR: string }>(`/api/reservas-sala/${reservaId}/qr`, {
    method: "POST",
  })
  return result.codigoQR
}

export async function validateQRCheckIn(reservaId: string, codigoQR: string): Promise<QRCheckEvent> {
  return fetchWithAuth<QRCheckEvent>(`/api/reservas-sala/${reservaId}/check-in`, {
    method: "POST",
    body: JSON.stringify({ codigoQR }),
  })
}

export async function validateQRCheckOut(reservaId: string, codigoQR: string): Promise<QRCheckEvent> {
  return fetchWithAuth<QRCheckEvent>(`/api/reservas-sala/${reservaId}/check-out`, {
    method: "POST",
    body: JSON.stringify({ codigoQR }),
  })
}

export async function parseScannedQR(qrData: string): Promise<QRScanResult> {
  return fetchWithAuth<QRScanResult>("/api/admin/qr/parse", {
    method: "POST",
    body: JSON.stringify({ qrData }),
  })
}

export async function validateQRCheckInByScanning(
  qrData: string,
  validadorId: string
): Promise<{ success: boolean; event?: QRCheckEvent; error?: string }> {
  return fetchWithAuth<{ success: boolean; event?: QRCheckEvent; error?: string }>("/api/admin/qr/check-in", {
    method: "POST",
    body: JSON.stringify({ qrData, validadorId }),
  })
}

export async function validateQRCheckOutByScanning(
  qrData: string,
  validadorId: string
): Promise<{ success: boolean; event?: QRCheckEvent; error?: string }> {
  return fetchWithAuth<{ success: boolean; event?: QRCheckEvent; error?: string }>("/api/admin/qr/check-out", {
    method: "POST",
    body: JSON.stringify({ qrData, validadorId }),
  })
}

export async function getQRCheckEvents(reservaId: string): Promise<QRCheckEvent[]> {
  return fetchWithAuth<QRCheckEvent[]>(`/api/reservas-sala/${reservaId}/qr-events`)
}

// ============================================
// RESERVATIONS MANAGEMENT (ADMIN)
// ============================================

export async function confirmReservation(reservaId: string): Promise<Reservation> {
  return fetchWithAuth<Reservation>(`/api/admin/reservas/${reservaId}/confirmar`, {
    method: "PUT",
  })
}

export async function cancelReservation(reservaId: string): Promise<Reservation> {
  return fetchWithAuth<Reservation>(`/api/reservas/${reservaId}/cancelar`, {
    method: "PUT",
  })
}
