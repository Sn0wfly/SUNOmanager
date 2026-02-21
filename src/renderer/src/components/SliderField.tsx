import React from 'react'

interface SliderFieldProps {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  unit?: string
}

export default function SliderField({ label, value, onChange, min = 0, max = 100, unit = '%' }: SliderFieldProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium" style={{ color: 'var(--suno-muted)' }}>
          {label}
        </label>
        <span className="text-xs font-mono font-bold" style={{ color: 'var(--suno-accent)' }}>
          {value}{unit}
        </span>
      </div>
      <div className="relative">
        <div
          className="absolute top-1/2 left-0 h-1 rounded-full pointer-events-none"
          style={{
            width: `${((value - min) / (max - min)) * 100}%`,
            backgroundColor: 'var(--suno-accent)',
            transform: 'translateY(-50%)'
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="w-full"
          style={{ position: 'relative', zIndex: 1 }}
        />
      </div>
    </div>
  )
}
