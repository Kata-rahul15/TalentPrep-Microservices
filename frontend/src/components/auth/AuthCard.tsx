import React from 'react'

interface AuthCardProps {
  children: React.ReactNode
}

export default function AuthCard({ children }: AuthCardProps) {
  return (
    <div className="glass-card bg-card/70 backdrop-blur-xl border border-border shadow-sm py-4 px-4 sm:py-5 sm:px-6 rounded-xl">
      {children}
    </div>
  )
}
