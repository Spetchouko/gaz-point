"use client"

import { Component, type ReactNode } from "react"
import Link from "next/link"

interface NotFoundBoundaryProps {
  children?: ReactNode
}

interface NotFoundBoundaryState {
  hasError: boolean
}

class NotFoundBoundary extends Component<NotFoundBoundaryProps, NotFoundBoundaryState> {
  constructor(props: NotFoundBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): NotFoundBoundaryState {
    return { hasError: true }
  }

  handleRetry = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-6 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="text-lg font-bold">404</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Page introuvable</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Cette page n’existe plus ou a été déplacée.
            </p>
            <div className="mt-6">
              <Link
                href="/"
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-primary hover:text-primary-foreground transition-colors shadow-sm"
              >
                Revenir à l’accueil
              </Link>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default function NotFound() {
  return <NotFoundBoundary />
}
