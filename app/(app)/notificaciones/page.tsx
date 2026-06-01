"use client"

import { useEffect, useState, useRef } from "react"
import { getNotifications, markNotificationRead, markAllNotificationsRead } from "@/lib/api"
import type { Notification } from "@/lib/types"
import {
  Bell,
  BookOpen,
  DoorOpen,
  MessageSquare,
  Settings,
  Check,
  CheckCheck,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const tipoIconos: Record<string, React.ElementType> = {
  prestamo: BookOpen,
  reserva: DoorOpen,
  comunidad: MessageSquare,
  sistema: Settings,
}

const tipoColors: Record<string, string> = {
  prestamo: "bg-primary/10 text-primary",
  reserva: "bg-accent/60 text-accent-foreground",
  comunidad: "bg-secondary text-secondary-foreground",
  sistema: "bg-muted text-muted-foreground",
}

export default function NotificacionesPage() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const hasMarkedAllRead = useRef(false)

  useEffect(() => {
    getNotifications()
      .then((data) => {
        setNotifications(data)
        // Marcar todas como leidas automaticamente al cargar la pagina
        const unreadIds = data.filter((n) => !n.leida).map((n) => n.id)
        if (unreadIds.length > 0 && !hasMarkedAllRead.current) {
          hasMarkedAllRead.current = true
          // Marcar todas en el backend
          markAllNotificationsRead().catch(console.error)
          // Actualizar estado local
          setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })))
        }
      })
      .finally(() => setIsLoading(false))
  }, [])

  const noLeidas = notifications.filter((n) => !n.leida)
  const leidas = notifications.filter((n) => n.leida)

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, leida: true } : n))
    )
  }

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead()
    setNotifications((prev) => prev.map((n) => ({ ...n, leida: true })))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Bell className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">Notificaciones</h1>
            <p className="text-muted-foreground">
              Mantente al dia con tus prestamos, reservas y actividad
            </p>
          </div>
        </div>
        {noLeidas.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllRead}
            className="gap-2"
          >
            <CheckCheck className="h-4 w-4" /> Marcar todas como leidas
          </Button>
        )}
      </div>

      <Tabs defaultValue="todas">
        <TabsList>
          <TabsTrigger value="todas">
            Todas ({notifications.length})
          </TabsTrigger>
          <TabsTrigger value="no-leidas">
            Sin leer ({noLeidas.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="todas" className="mt-4 space-y-2">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="border-border animate-pulse">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="h-10 w-10 rounded-lg bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 rounded bg-muted" />
                      <div className="h-3 w-1/4 rounded bg-muted" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <Card className="border-border">
              <CardContent className="flex flex-col items-center py-12 text-center">
                <Bell className="mb-3 h-10 w-10 text-muted-foreground/40" />
                <p className="text-muted-foreground">No tienes notificaciones</p>
              </CardContent>
            </Card>
          ) : (
            notifications.map((notif) => (
              <NotificationCard
                key={notif.id}
                notification={notif}
                onMarkRead={handleMarkRead}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="no-leidas" className="mt-4 space-y-2">
          {noLeidas.length === 0 ? (
            <Card className="border-border">
              <CardContent className="flex flex-col items-center py-12 text-center">
                <CheckCheck className="mb-3 h-10 w-10 text-accent-foreground/40" />
                <p className="text-muted-foreground">
                  Todas las notificaciones estan leidas
                </p>
              </CardContent>
            </Card>
          ) : (
            noLeidas.map((notif) => (
              <NotificationCard
                key={notif.id}
                notification={notif}
                onMarkRead={handleMarkRead}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

function NotificationCard({
  notification,
  onMarkRead,
}: {
  notification: Notification
  onMarkRead: (id: string) => void
}) {
  const Icon = tipoIconos[notification.tipo] || Bell
  const color = tipoColors[notification.tipo] || "bg-muted text-muted-foreground"

  return (
    <Card
      className={`border-border transition-colors ${
        !notification.leida ? "bg-primary/[0.03]" : ""
      }`}
    >
      <CardContent className="flex items-center gap-4 p-4">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${color}`}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1 overflow-hidden">
          <p
            className={`text-sm leading-relaxed ${
              !notification.leida
                ? "font-medium text-foreground"
                : "text-muted-foreground"
            }`}
          >
            {notification.mensaje}
          </p>
          <div className="mt-1 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{notification.fecha}</span>
            <Badge
              variant="outline"
              className="border-border text-[10px] capitalize text-muted-foreground"
            >
              {notification.tipo}
            </Badge>
          </div>
        </div>
        {!notification.leida && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onMarkRead(notification.id)}
            className="shrink-0 text-muted-foreground hover:text-primary"
          >
            <Check className="h-4 w-4" />
            <span className="sr-only">Marcar como leida</span>
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
