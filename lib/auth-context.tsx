"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import type { User } from "./types"
import { loginUser as apiLogin, registerUser as apiRegister, getUserProfile } from "./api"

interface AuthContextType {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: { nombre: string; email: string; password: string; rol: string }) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const TOKEN_KEY = "biblioteca2_token"
const USER_KEY = "biblioteca2_user"

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Recuperar token y usuario del sessionStorage al cargar
    if (typeof window !== "undefined") {
      const storedToken = sessionStorage.getItem(TOKEN_KEY)
      const storedUser = sessionStorage.getItem(USER_KEY)
      
      if (storedToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser) as User
          setUser(parsedUser)
          setToken(storedToken)
        } catch {
          // Si hay error al parsear, limpiar storage
          sessionStorage.removeItem(TOKEN_KEY)
          sessionStorage.removeItem(USER_KEY)
        }
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiLogin(email, password)
    setUser(result.user)
    setToken(result.token)
    sessionStorage.setItem(TOKEN_KEY, result.token)
    sessionStorage.setItem(USER_KEY, JSON.stringify(result.user))
  }, [])

  const register = useCallback(
    async (data: { nombre: string; email: string; password: string; rol: string }) => {
      const result = await apiRegister(data)
      setUser(result.user)
      setToken(result.token)
      sessionStorage.setItem(TOKEN_KEY, result.token)
      sessionStorage.setItem(USER_KEY, JSON.stringify(result.user))
    },
    []
  )

  const logout = useCallback(() => {
    setUser(null)
    setToken(null)
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(USER_KEY)
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const updatedUser = await getUserProfile()
      setUser(updatedUser)
      sessionStorage.setItem(USER_KEY, JSON.stringify(updatedUser))
    } catch (error) {
      console.error("Error al refrescar usuario:", error)
    }
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider")
  }
  return context
}
