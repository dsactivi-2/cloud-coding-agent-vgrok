'use client'

import { ReactNode } from 'react'

interface FuturisticCardProps {
  title: string
  children: ReactNode
  glowColor?: 'cyan' | 'pink' | 'green' | 'orange' | 'purple'
  className?: string
  testId?: string
}

/**
 * Futuristic card component with glow effects
 * Tesla/SpaceX inspired design
 */
export function FuturisticCard({
  title,
  children,
  glowColor = 'cyan',
  className = '',
  testId,
}: FuturisticCardProps) {
  const glowColors = {
    cyan: 'shadow-neon-cyan/20 hover:shadow-neon-cyan/40 border-neon-cyan/30',
    pink: 'shadow-neon-pink/20 hover:shadow-neon-pink/40 border-neon-pink/30',
    green: 'shadow-neon-green/20 hover:shadow-neon-green/40 border-neon-green/30',
    orange: 'shadow-neon-orange/20 hover:shadow-neon-orange/40 border-neon-orange/30',
    purple: 'shadow-neon-purple/20 hover:shadow-neon-purple/40 border-neon-purple/30',
  }

  const titleColors = {
    cyan: 'text-neon-cyan',
    pink: 'text-neon-pink',
    green: 'text-neon-green',
    orange: 'text-neon-orange',
    purple: 'text-neon-purple',
  }

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl
        bg-gradient-to-br from-spacex-dark/90 to-spacex-steel/50
        backdrop-blur-sm border
        shadow-lg transition-all duration-300
        ${glowColors[glowColor]}
        ${className}
      `}
      data-testid={testId}
    >
      {/* Grid background effect */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

      {/* Title bar */}
      <div className="relative px-4 py-3 border-b border-white/10">
        <h3 className={`text-sm font-semibold uppercase tracking-wider ${titleColors[glowColor]}`}>
          {title}
        </h3>
        {/* Decorative line */}
        <div className={`absolute bottom-0 left-0 h-0.5 w-16 bg-gradient-to-r from-current to-transparent ${titleColors[glowColor]}`} />
      </div>

      {/* Content */}
      <div className="relative p-4">
        {children}
      </div>
    </div>
  )
}
