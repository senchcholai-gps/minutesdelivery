"use client"

import { useState, useCallback } from "react"
import Cropper from "react-easy-crop"
import type { Area } from "react-easy-crop"
import { X, ZoomIn, ZoomOut, Crop } from "lucide-react"
import { Button } from "@/components/ui/button"

// ---------------------------------------------------------------------------
// Canvas helper — extracts the cropped area and resizes to OUTPUT_SIZE × OUTPUT_SIZE
// ---------------------------------------------------------------------------
const OUTPUT_SIZE = 800 // final square output in px

async function getCroppedBlob(
  imageSrc: string,
  pixelCrop: Area
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new window.Image()
    image.addEventListener("load", () => {
      const canvas = document.createElement("canvas")
      canvas.width = OUTPUT_SIZE
      canvas.height = OUTPUT_SIZE
      const ctx = canvas.getContext("2d")
      if (!ctx) { reject(new Error("Canvas not supported")); return }

      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        OUTPUT_SIZE,
        OUTPUT_SIZE
      )

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error("Failed to create blob"))
        },
        "image/jpeg",
        0.85
      )
    })
    image.addEventListener("error", reject)
    image.src = imageSrc
  })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
interface ImageCropModalProps {
  /** Object-URL of the raw file the user selected */
  imageSrc: string
  onCropComplete: (croppedBlob: Blob, previewUrl: string) => void
  onCancel: () => void
}

export function ImageCropModal({ imageSrc, onCropComplete, onCancel }: ImageCropModalProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleCropComplete = useCallback((_: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels)
  }, [])

  const handleConfirm = async () => {
    if (!croppedAreaPixels) return
    setIsProcessing(true)
    try {
      const blob = await getCroppedBlob(imageSrc, croppedAreaPixels)
      const previewUrl = URL.createObjectURL(blob)
      onCropComplete(blob, previewUrl)
    } catch (err) {
      console.error("Crop failed:", err)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    // Backdrop
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-lg font-black text-gray-900">Crop Image</h2>
            <p className="text-xs text-gray-400 mt-0.5">Drag to reposition · Scroll or use slider to zoom</p>
          </div>
          <button
            onClick={onCancel}
            className="h-8 w-8 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Crop area */}
        <div className="relative w-full bg-gray-900" style={{ height: 340 }}>
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="rect"
            showGrid={true}
            restrictPosition={false}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={handleCropComplete}
            style={{
              containerStyle: { borderRadius: 0 },
              cropAreaStyle: {
                border: "2px solid #22c55e",
                boxShadow: "0 0 0 9999px rgba(0,0,0,0.55)",
              },
            }}
          />
        </div>

        {/* Zoom slider */}
        <div className="px-6 py-4 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            <ZoomOut className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <input
              type="range"
              min={1}
              max={3}
              step={0.01}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-green-500 cursor-pointer"
            />
            <ZoomIn className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-xs font-bold text-gray-400 w-10 text-right">{zoom.toFixed(1)}×</span>
          </div>
          <p className="text-[10px] text-gray-400 mt-1 text-center">
            Output: {OUTPUT_SIZE}×{OUTPUT_SIZE}px · JPEG
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 py-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1 rounded-xl font-bold"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isProcessing}
            className="flex-1 rounded-xl font-black bg-green-500 hover:bg-green-600 text-white gap-2"
          >
            <Crop className="h-4 w-4" />
            {isProcessing ? "Processing…" : "Crop & Save"}
          </Button>
        </div>
      </div>
    </div>
  )
}
