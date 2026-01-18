'use client'

import { ReactNode, ButtonHTMLAttributes } from 'react'

interface TeslaButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  glowing?: boolean
  testId?: string
}

/**
 * Tesla-inspired button component with futuristic styling
 */
export function TeslaButton({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  glowing = false,
  testId,
  className = '',
  disabled,
  ...props
}: TeslaButtonProps) {
  const variants = {
    primary: 'bg-neon-cyan text-spacex-dark hover:bg-neon-cyan/80 border-neon-cyan',
    secondary: 'bg-transparent text-neon-cyan hover:bg-neon-cyan/10 border-neon-cyan',
    danger: 'bg-tesla-red text-white hover:bg-tesla-red/80 border-tesla-red',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base',
  }

  const glowEffect = glowing
    ? 'shadow-[0_0_15px_currentColor] animate-pulse-slow'
    : ''

  return (
    <button
      className={`
        relative font-semibold uppercase tracking-wider
        border rounded transition-all duration-300
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${glowEffect}
        ${className}
      `}
      disabled={disabled || loading}
      data-testid={testId}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Processing...</span>
        </span>
      ) : (
        children
      )}
    </button>
  )
}
