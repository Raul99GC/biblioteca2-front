"use client"

import { useEffect, useRef } from "react"

interface QRCodeDisplayProps {
  value: string
  size?: number
  className?: string
}

/**
 * Renders a simulated QR code using canvas.
 * In production, replace with a real QR library like `qrcode` or scan via camera.
 */
export function QRCodeDisplay({ value, size = 200, className }: QRCodeDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const cellSize = Math.floor(size / 25)
    const totalSize = cellSize * 25
    canvas.width = totalSize
    canvas.height = totalSize

    // White background
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, totalSize, totalSize)

    // Seeded random from value
    let seed = 0
    for (let i = 0; i < value.length; i++) {
      seed = ((seed << 5) - seed + value.charCodeAt(i)) | 0
    }
    const seededRandom = () => {
      seed = (seed * 16807) % 2147483647
      return (seed & 0x7fffffff) / 0x7fffffff
    }

    ctx.fillStyle = "#1a1a2e"

    // Draw finder patterns (3 corners)
    const drawFinder = (x: number, y: number) => {
      // Outer
      ctx.fillRect(x * cellSize, y * cellSize, 7 * cellSize, 7 * cellSize)
      ctx.fillStyle = "#ffffff"
      ctx.fillRect((x + 1) * cellSize, (y + 1) * cellSize, 5 * cellSize, 5 * cellSize)
      ctx.fillStyle = "#1a1a2e"
      ctx.fillRect((x + 2) * cellSize, (y + 2) * cellSize, 3 * cellSize, 3 * cellSize)
    }

    drawFinder(1, 1)
    drawFinder(17, 1)
    drawFinder(1, 17)

    // Random data cells
    for (let row = 0; row < 25; row++) {
      for (let col = 0; col < 25; col++) {
        const inFinder1 = row >= 1 && row < 8 && col >= 1 && col < 8
        const inFinder2 = row >= 1 && row < 8 && col >= 17 && col < 24
        const inFinder3 = row >= 17 && row < 24 && col >= 1 && col < 8
        if (inFinder1 || inFinder2 || inFinder3) continue

        if (seededRandom() > 0.55) {
          ctx.fillStyle = "#1a1a2e"
          ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize)
        }
      }
    }
  }, [value, size])

  return (
    <div className={className}>
      <canvas
        ref={canvasRef}
        style={{ width: size, height: size }}
        className="rounded-lg"
      />
    </div>
  )
}
