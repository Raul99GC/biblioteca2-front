import Link from "next/link"
import { BookOpen, Users, DoorOpen, Star, ArrowRight, Library, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

const features = [
  {
    icon: Library,
    title: "Catalogo de Libros",
    description: "Accede a mas de 2,400 libros fisicos. Busca, filtra y solicita prestamos al instante desde la plataforma.",
  },
  {
    icon: DoorOpen,
    title: "Salas de Estudio",
    description: "Reserva salas equipadas con tecnologia moderna. Espacios individuales, grupales y silenciosos.",
  },
  {
    icon: Users,
    title: "Intercambio P2P",
    description: "Comparte e intercambia libros con otros estudiantes. Un modelo colaborativo para toda la comunidad.",
  },
  {
    icon: MessageSquare,
    title: "Comunidad Activa",
    description: "Foro de discusion, grupos de estudio y recomendaciones entre companeros del TecNM.",
  },
  {
    icon: Star,
    title: "Reputacion",
    description: "Gana puntos de reputacion al participar, prestar libros y contribuir a la comunidad academica.",
  },
  {
    icon: BookOpen,
    title: "Check-in con QR",
    description: "Confirma tu asistencia a las salas de estudio mediante codigos QR. Registra entrada y salida facilmente.",
  },
]

const stats = [
  { value: "2,450+", label: "Libros disponibles" },
  { value: "1,800+", label: "Usuarios activos" },
  { value: "12", label: "Salas de estudio" },
  { value: "98%", label: "Satisfaccion" },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <BookOpen className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-lg font-bold text-foreground">Biblioteca 2.0</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" className="text-muted-foreground hover:text-foreground">
                Iniciar Sesion
              </Button>
            </Link>
            <Link href="/registro">
              <Button>Registrarse</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-4 py-16 text-center md:px-6 md:py-24">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
            <BookOpen className="h-4 w-4" />
            TecNM - Tecnologico Nacional de Mexico
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-foreground md:text-5xl lg:text-6xl text-balance">
            Tu biblioteca universitaria,{" "}
            <span className="text-primary">reinventada</span>
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Prestamos de libros fisicos, intercambio entre companeros y reserva de salas de estudio. Todo en una plataforma colaborativa para la comunidad academica.
          </p>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/registro">
              <Button size="lg" className="gap-2 text-base">
                Comienza gratis <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/login">
              <Button size="lg" variant="outline" className="text-base">
                Ya tengo cuenta
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-border bg-muted/50">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-12 md:grid-cols-4 md:px-6">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold text-primary md:text-4xl">{stat.value}</p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <div className="mb-12 text-center">
          <h2 className="mb-3 text-3xl font-bold text-foreground text-balance">
            Todo lo que necesitas para tu vida academica
          </h2>
          <p className="mx-auto max-w-2xl text-muted-foreground">
            Una plataforma completa que integra el catalogo de libros fisicos, espacios de estudio y una comunidad activa.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card key={feature.title} className="border-border transition-shadow hover:shadow-md">
              <CardContent className="p-6">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-primary/5">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center md:px-6">
          <h2 className="mb-3 text-3xl font-bold text-foreground text-balance">
            Listo para comenzar?
          </h2>
          <p className="mx-auto mb-8 max-w-xl text-muted-foreground">
            Unete a la comunidad de Biblioteca 2.0 y accede a todos los recursos que necesitas para tu formacion academica.
          </p>
          <Link href="/registro">
            <Button size="lg" className="gap-2">
              Crear cuenta gratuita <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-8 md:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">Biblioteca 2.0</span>
              <span className="text-sm text-muted-foreground">- TecNM</span>
            </div>
            <p className="text-sm text-muted-foreground">
              2026 Biblioteca 2.0. Proyecto academico del TecNM.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
