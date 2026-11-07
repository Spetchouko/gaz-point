"use client"

import React, { createContext, useContext, useState } from "react"
import { authClient } from "@/lib/auth-client"

export type AuthMode = "register" | "login" | "forgot-password"

interface AuthContextType {
  openAuthModal: (initialMode?: AuthMode) => void
  closeAuthModal: () => void
  isOpen: boolean
  mode: AuthMode
  setMode: (mode: AuthMode) => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = authClient.useSession()
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<AuthMode>("register")

  const openAuthModal = (initialMode: AuthMode = "register") => {
    setMode(initialMode)
    setIsOpen(true)
  }

  const closeAuthModal = () => {
    setIsOpen(false)
  }

  return (
    <AuthContext.Provider
      value={{
        openAuthModal,
        closeAuthModal,
        isOpen,
        mode,
        setMode,
        isAuthenticated: !!session?.user,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuthModal() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuthModal must be used within an AuthProvider")
  }
  return context
}
