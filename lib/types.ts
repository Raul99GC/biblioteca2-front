// ============================================
// TIPOS PRINCIPALES - Biblioteca 2.0
// ============================================

export interface User {
  id: string
  nombre: string
  email: string
  rol: "estudiante" | "docente" | "admin"
  avatar?: string
  reputacion: number
  prestamosActivos: number
  fechaRegistro: string
}

export interface Book {
  id: string
  titulo: string
  autor: string
  isbn: string
  categoria: string
  descripcion: string
  portada?: string
  formato: "fisico"
  disponible: boolean
  calificacion: number
  totalResenas: number
  idioma: string
  paginas: number
  editorial: string
  anioPublicacion: number
  tags: string[]
  activo: boolean
  subidoPor?: {
    id: string
    nombre: string
    email: string
  }
}

export interface Loan {
  id: string
  libroId: string
  libro: Book
  usuarioId: string
  fechaPrestamo: string
  fechaDevolucion: string
  estado: "activo" | "devuelto" | "vencido"
}

export interface StudyRoom {
  id: string
  nombre: string
  ubicacion: string
  capacidad: number
  equipamiento: string[]
  imagen?: string
  disponible: boolean
  horario: string
  tipo: "individual" | "grupal" | "silenciosa"
  coordenadas: { lat: number; lng: number }
  distancia?: number
}

export interface QRCheckEvent {
  id: string
  reservaId: string
  tipo: "check-in" | "check-out"
  codigoQR: string
  fecha: string
  hora: string
  validado: boolean
  /** ID del profesor/admin que valido */
  validadoPor?: string
}

export interface Reservation {
  id: string
  salaId: string
  sala: StudyRoom
  usuarioId: string
  fecha: string
  horaInicio: string
  horaFin: string
  estado: "pendiente" | "confirmada" | "cancelada" | "en-uso" | "completada"
  codigoQR?: string
  checkIn?: string
  checkOut?: string
}

export interface ForumPost {
  id: string
  titulo: string
  contenido: string
  autor: User
  fecha: string
  categoria: string
  respuestas: number
  likes: number
  tags: string[]
}

export interface ForumReply {
  id: string
  postId: string
  contenido: string
  autor: User
  fecha: string
  likes: number
}

export interface Notification {
  id: string
  mensaje: string
  tipo: "prestamo" | "reserva" | "comunidad" | "sistema"
  leida: boolean
  fecha: string
}

export interface DashboardStats {
  totalLibros: number
  prestamosActivos: number
  salasDisponibles: number
  usuariosActivos: number
  librosPopulares: Book[]
  actividadReciente: {
    fecha: string
    prestamos: number
    devoluciones: number
  }[]
}

// ============================================
// PAYLOADS PARA API
// ============================================

export interface CreateBookPayload {
  titulo: string
  autor: string
  isbn: string
  categoria: string
  descripcion: string
  formato: "fisico"
  idioma: string
  paginas: number
  editorial: string
  anioPublicacion: number
  tags: string[]
}

export interface UpdateBookPayload extends Partial<CreateBookPayload> {
  disponible?: boolean
}

export interface UpdateUserPayload {
  nombre?: string
  email?: string
  rol?: User["rol"]
}

export interface BookReview {
  id: string
  libroId: string
  usuarioId: string
  usuario: User
  titulo: string
  calificacion: number
  comentario: string
  fecha: string
}

export interface CreateReviewPayload {
  libroId: string
  titulo: string
  calificacion: number
  comentario: string
}

export interface Favorite {
  id: string
  libroId: string
  libro: Book
  usuarioId: string
  fechaAgregado: string
}

export interface ReadingList {
  id: string
  nombre: string
  descripcion: string
  usuarioId: string
  libros: Book[]
  fechaCreacion: string
}

export interface CreateReadingListPayload {
  nombre: string
  descripcion: string
}

export interface BookUpload {
  id: string
  titulo: string
  autor: string
  isbn: string
  categoria: string
  descripcion: string
  formato: "fisico"
  idioma: string
  paginas: number
  editorial: string
  anioPublicacion: number
  tags: string[]
  /** Imagen de portada opcional */
  archivoNombre: string
  archivoTamano: number
  archivoTipo: string
  subidoPor: User
  estado: "pendiente" | "aprobado" | "rechazado"
  fechaSubida: string
}

export interface CreateBookUploadPayload {
  titulo: string
  autor: string
  isbn: string
  categoria: string
  descripcion: string
  formato: "fisico"
  idioma: string
  paginas: number
  editorial: string
  anioPublicacion: number
  tags: string[]
  /** Imagen de portada opcional */
  imagen?: File
}

export interface CreateStudyRoomPayload {
  nombre: string
  ubicacion: string
  capacidad: number
  equipamiento: string[]
  /** Imagen de la sala (puede ser URL server-side o File al crear) */
  imagen?: File | string
  horario: string
  tipo: "individual" | "grupal" | "silenciosa"
  coordenadas: { lat: number; lng: number }
}

export interface QRScanResult {
  success: boolean
  reservaId?: string
  codigoQR?: string
  error?: string
  reservation?: Reservation
}
