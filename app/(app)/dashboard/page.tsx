"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getLoans, getReservations } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import type { Loan, Reservation } from "@/lib/types"
import { BookOpen, DoorOpen, Clock, ArrowRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function DashboardPage() {
  const { user } = useAuth()
  const [loans, setLoans] = useState<Loan[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])

  useEffect(() => {
    if (user?.id) {
      getLoans(user.id).then(setLoans)
      getReservations(user.id).then(setReservations)
    }
  }, [user?.id])

  const activeLoans = loans.filter((l) => l.estado === "activo")

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">
          Hola, {user?.nombre?.split(" ")[0]}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Aqui tienes un resumen de tu actividad en Biblioteca 2.0
        </p>
      </div>

      {/* Quick Actions */}
      <Card className="border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-foreground">Acciones Rapidas</CardTitle>
          <CardDescription>Lo que puedes hacer ahora</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Link href="/catalogo" className="block">
            <Button variant="outline" className="w-full justify-between text-foreground">
              Buscar libros
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Button>
          </Link>
          <Link href="/salas" className="block">
            <Button variant="outline" className="w-full justify-between text-foreground">
              Reservar sala
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Button>
          </Link>
          <Link href="/comunidad" className="block">
            <Button variant="outline" className="w-full justify-between text-foreground">
              Ir al foro
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Button>
          </Link>
          <Link href="/catalogo" className="block">
            <Button variant="outline" className="w-full justify-between text-foreground">
              Explorar novedades
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Button>
          </Link>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Active Loans */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground">Mis Prestamos Activos</CardTitle>
                <CardDescription>{activeLoans.length} prestamo(s) activo(s)</CardDescription>
              </div>
              <Link href="/mis-prestamos">
                <Button variant="ghost" size="sm" className="text-primary">
                  Ver todos
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeLoans.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No tienes prestamos activos</p>
            ) : (
              activeLoans.map((loan) => (
                <div key={loan.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-medium text-foreground">{loan.libro.titulo}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>Vence: {loan.fechaDevolucion}</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="shrink-0 capitalize bg-secondary text-secondary-foreground">
                    {loan.tipo}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Upcoming Reservations */}
        <Card className="border-border">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-foreground">Proximas Reservaciones</CardTitle>
                <CardDescription>{reservations.length} reservacion(es)</CardDescription>
              </div>
              <Link href="/salas">
                <Button variant="ghost" size="sm" className="text-primary">
                  Ver todas
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {reservations.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">No tienes reservaciones</p>
            ) : (
              reservations.map((res) => (
                <div key={res.id} className="flex items-center gap-3 rounded-lg border border-border p-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/60">
                    <DoorOpen className="h-5 w-5 text-accent-foreground" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <p className="truncate text-sm font-medium text-foreground">{res.sala.nombre}</p>
                    <p className="text-xs text-muted-foreground">
                      {res.fecha} - {res.horaInicio} a {res.horaFin}
                    </p>
                  </div>
                  <Badge
                    variant="secondary"
                    className={`shrink-0 capitalize ${
                      res.estado === "confirmada"
                        ? "bg-accent/60 text-accent-foreground"
                        : "bg-secondary text-secondary-foreground"
                    }`}
                  >
                    {res.estado}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  )
}
