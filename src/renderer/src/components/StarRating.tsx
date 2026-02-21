import React, { useState } from 'react'

interface StarRatingProps {
  value: number
  onChange?: (rating: number) => void
  readonly?: boolean
  size?: number
}

export default function StarRating({ value, onChange, readonly = false, size = 18 }: StarRatingProps) {
  const [hovered, setHovered] = useState(0)

  const display = hovered > 0 ? hovered : value

  return (
    <div className="flex items-center gap-0.5" style={{ cursor: readonly ? 'default' : 'pointer' }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <svg
          key={star}
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill={star <= display ? '#f59e0b' : 'none'}
          stroke={star <= display ? '#f59e0b' : 'var(--suno-border)'}
          strokeWidth="2"
          onMouseEnter={() => !readonly && setHovered(star)}
          onMouseLeave={() => !readonly && setHovered(0)}
          onClick={() => !readonly && onChange?.(star === value ? 0 : star)}
          style={{ transition: 'fill 0.1s, stroke 0.1s' }}
        >
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
    </div>
  )
}
