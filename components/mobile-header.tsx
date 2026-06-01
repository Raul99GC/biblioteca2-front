"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { BookOpen, Menu, X, Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { AppSidebar } from "./app-sidebar"
import { useState } from "react"

export function MobileHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const getTitle = () => {
    if (pathname === "/dashboard") return "Dashboard"
    if (pathname.startsWith("/catalogo")) return "Catalogo"
    if (pathname.startsWith("/mis-prestamos")) return "Mis Prestamos"
    if (pathname.startsWith("/salas")) return "Salas de Estudio"
    if (pathname.startsWith("/comunidad")) return "Comunidad"
    if (pathname.startsWith("/perfil")) return "Mi Perfil"
    if (pathname.startsWith("/admin")) return "Panel Admin"
    if (pathname.startsWith("/notificaciones")) return "Notificaciones"
    return "Biblioteca 2.0"
  }

  return (
    <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="text-foreground">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            <span className="sr-only">Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <AppSidebar />
        </SheetContent>
      </Sheet>

      <div className="flex items-center gap-2">
        <BookOpen className="h-5 w-5 text-primary" />
        <span className="text-sm font-semibold text-foreground">{getTitle()}</span>
      </div>

      <Link href="/notificaciones">
        <Button variant="ghost" size="icon" className="relative text-foreground">
          <Bell className="h-5 w-5" />
          <Badge className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-secondary text-secondary-foreground p-0 text-[10px] flex items-center justify-center">
            2
          </Badge>
          <span className="sr-only">Notificaciones</span>
        </Button>
      </Link>
    </header>
  )
}
