"use client"

import { Component, type ReactNode } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

interface ErrorBoundaryProps {
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, info)
  }

  handleRetry = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
          <div className="max-w-md text-center">
            <div className="mx-auto mb-6 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <span className="text-lg font-bold">500</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Une erreur est survenue</h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Oops ! Quelque chose d&apos;imprévu est arrivé. Notre site a rencontre une
              erreur intérieure.
            </p>
            <p className="mt-2 max-w-sm mx-auto text-xs text-muted-foreground">
              L&apos;erreur a été signalée. Veuillez réessayer, ou republicher si le problème
              persiste.
            </p>
            <div className="mt-6">
              <Button asChild>
                <Link href="/">Revenir à l&apos;accueil</Link>
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default function Error() {
  return <ErrorBoundary />
}
