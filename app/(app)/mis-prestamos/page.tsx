"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { getLoans, returnLoan } from "@/lib/api"
import { useAuth } from "@/lib/auth-context"
import type { Loan } from "@/lib/types"
import { BookOpen, Clock, RotateCcw, CheckCircle2, AlertCircle, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function MisPrestamosPage() {
  const { user } = useAuth()
  const [loans, setLoans] = useState<Loan[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [returning, setReturning] = useState<string | null>(null)

  useEffect(() => {
    getLoans(user?.id)
      .then(setLoans)
      .finally(() => setIsLoading(false))
  }, [user?.id])

  const handleReturn = async (loanId: string) => {
    setReturning(loanId)
    try {
      const updated = await returnLoan(loanId)
      setLoans((prev) => prev.map((l) => (l.id === loanId ? updated : l)))
    } finally {
      setReturning(null)
    }
  }

  const active = loans.filter((l) => l.estado === "activo")
  const returned = loans.filter((l) => l.estado === "devuelto")
  const overdue = loans.filter((l) => l.estado === "vencido")

  const statusConfig = {
    activo: { icon: Clock, color: "bg-primary/10 text-primary", label: "Activo" },
    devuelto: { icon: CheckCircle2, color: "bg-accent/60 text-accent-foreground", label: "Devuelto" },
    vencido: { icon: AlertCircle, color: "bg-destructive/10 text-destructive", label: "Vencido" },
  }

  function LoanCard({ loan }: { loan: Loan }) {
    const config = statusConfig[loan.estado]
    const StatusIcon = config.icon
    return (
      <Card className="border-border">
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
          <Link href={`/catalogo/${loan.libroId}`} className="flex items-center gap-3 flex-1 overflow-hidden">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-primary/5">
              <BookOpen className="h-7 w-7 text-primary/40" />
            </div>
            <div className="overflow-hidden">
              <p className="truncate font-semibold text-foreground hover:text-primary transition-colors">
                {loan.libro.titulo}
              </p>
              <p className="text-sm text-muted-foreground">{loan.libro.autor}</p>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span>Prestamo: {loan.fechaPrestamo}</span>
                <span>Devolucion: {loan.fechaDevolucion}</span>
              </div>
            </div>
          </Link>
          <div className="flex items-center gap-3 sm:shrink-0">
            <Badge variant="secondary" className={`capitalize ${config.color}`}>
              <StatusIcon className="mr-1 h-3 w-3" />
              {config.label}
            </Badge>
            <Badge variant="outline" className="capitalize border-border text-muted-foreground">
              {loan.tipo}
            </Badge>
            {loan.estado === "activo" && (
              <Button
                size="sm"
                variant="outline"
                className="gap-1 text-foreground"
                disabled={returning === loan.id}
                onClick={() => handleReturn(loan.id)}
              >
                {returning === loan.id ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <RotateCcw className="h-3 w-3" />
                )}
                Devolver
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground md:text-3xl">Mis Prestamos</h1>
        <p className="mt-1 text-muted-foreground">Gestiona tus prestamos activos y revisa tu historial</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-border">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{active.length}</p>
              <p className="text-xs text-muted-foreground">Activos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/60">
              <CheckCircle2 className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{returned.length}</p>
              <p className="text-xs text-muted-foreground">Devueltos</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border">
          <CardContent className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{overdue.length}</p>
              <p className="text-xs text-muted-foreground">Vencidos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="activos">
        <TabsList>
          <TabsTrigger value="activos">Activos ({active.length})</TabsTrigger>
          <TabsTrigger value="devueltos">Devueltos ({returned.length})</TabsTrigger>
          <TabsTrigger value="todos">Todos ({loans.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="activos" className="mt-4 space-y-3">
          {active.length === 0 ? (
            <Card className="border-border">
              <CardContent className="py-8 text-center">
                <BookOpen className="mx-auto h-10 w-10 text-muted-foreground/50" />
                <p className="mt-3 text-sm text-muted-foreground">No tienes prestamos activos</p>
                <Link href="/catalogo">
                  <Button variant="ghost" size="sm" className="mt-2 text-primary">
                    Explorar catalogo
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            active.map((loan) => <LoanCard key={loan.id} loan={loan} />)
          )}
        </TabsContent>

        <TabsContent value="devueltos" className="mt-4 space-y-3">
          {returned.length === 0 ? (
            <Card className="border-border">
              <CardContent className="py-8 text-center">
                <p className="text-sm text-muted-foreground">No tienes prestamos devueltos</p>
              </CardContent>
            </Card>
          ) : (
            returned.map((loan) => <LoanCard key={loan.id} loan={loan} />)
          )}
        </TabsContent>

        <TabsContent value="todos" className="mt-4 space-y-3">
          {loans.map((loan) => (
            <LoanCard key={loan.id} loan={loan} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  )
}
