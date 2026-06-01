"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import {
  BookOpen,
  LayoutDashboard,
  Library,
  DoorOpen,
  Users,
  MessageSquare,
  User,
  Shield,
  Bell,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/lib/auth-context"
import { getNotifications } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"

const mainNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/catalogo", label: "Catalogo", icon: Library },
  { href: "/mis-prestamos", label: "Mis Prestamos", icon: BookOpen },
  { href: "/salas", label: "Salas de Estudio", icon: DoorOpen },
  { href: "/comunidad", label: "Comunidad", icon: MessageSquare },
]

const secondaryNav = [
  { href: "/perfil", label: "Mi Perfil", icon: User },
  { href: "/notificaciones", label: "Notificaciones", icon: Bell },
]

const adminNav = [{ href: "/admin", label: "Panel Admin", icon: Shield }]

export function AppSidebar() {
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (user) {
      getNotifications()
        .then((notifications) => {
          const unread = notifications.filter((n) => !n.leida).length
          setUnreadCount(unread)
        })
        .catch(() => setUnreadCount(0))
    }
  }, [user, pathname])

  const initials = user?.nombre
    ? user.nombre
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U"

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-border bg-card transition-all duration-300",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
          <BookOpen className="h-5 w-5 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="truncate text-base font-bold text-foreground">Biblioteca 2.0</h1>
            <p className="truncate text-xs text-muted-foreground">TecNM</p>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <p className={cn("mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground", collapsed && "sr-only")}>
          Menu principal
        </p>
        {mainNav.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          )
        })}

        <div className="my-4 border-t border-border" />

        <p className={cn("mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground", collapsed && "sr-only")}>
          Personal
        </p>
        {secondaryNav.map((item) => {
          const isActive = pathname === item.href
          const showBadge = item.href === "/notificaciones" && unreadCount > 0
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {!collapsed && (
                <span className="flex flex-1 items-center justify-between">
                  <span className="truncate">{item.label}</span>
                  {showBadge && (
                    <Badge variant="secondary" className="bg-primary/10 text-primary ml-auto text-xs">
                      {unreadCount}
                    </Badge>
                  )}
                </span>
              )}
            </Link>
          )
        })}

        {user?.rol === "admin" && (
          <>
            <div className="my-4 border-t border-border" />
            <p className={cn("mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground", collapsed && "sr-only")}>
              Administracion
            </p>
            {adminNav.map((item) => {
              const isActive = pathname.startsWith(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5 shrink-0" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      {/* Collapse Toggle */}
      <div className="border-t border-border px-3 py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="w-full justify-center text-muted-foreground"
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          {!collapsed && <span className="ml-2 text-xs">Colapsar</span>}
        </Button>
      </div>

      {/* User Section */}
      <div className="border-t border-border p-3">
        <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="bg-accent text-accent-foreground text-xs font-semibold">
              {initials}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-foreground">{user?.nombre}</p>
              <p className="truncate text-xs text-muted-foreground capitalize">{user?.rol}</p>
            </div>
          )}
          {!collapsed && (
            <Button variant="ghost" size="icon" onClick={logout} className="shrink-0 text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Cerrar sesion</span>
            </Button>
          )}
        </div>
      </div>
    </aside>
  )
}
