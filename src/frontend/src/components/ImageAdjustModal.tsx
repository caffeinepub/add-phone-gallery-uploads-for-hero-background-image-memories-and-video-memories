import { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Slider } from './ui/slider';
import { Label } from './ui/label';
import type { ImageTransform } from '../hooks/useMediaDraft';

interface ImageAdjustModalProps {
  open: boolean;
  onClose: () => void;
  imageUrl: string;
  slotIndex: number;
  initialTransform?: ImageTransform;
  onSave: (transform: ImageTransform) => void;
}

export default function ImageAdjustModal({
  open,
  onClose,
  imageUrl,
  slotIndex,
  initialTransform = { zoom: 1, x: 0, y: 0 },
  onSave,
}: ImageAdjustModalProps) {
  const [transform, setTransform] = useState<ImageTransform>(initialTransform);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTransform(initialTransform);
  }, [initialTransform, open]);

  function handleZoomChange(value: number[]) {
    setTransform((prev) => ({ ...prev, zoom: value[0] }));
  }

  function handlePointerDown(e: React.PointerEvent) {
    setIsDragging(true);
    setDragStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
    e.currentTarget.setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setTransform((prev) => ({ ...prev, x: newX, y: newY }));
  }

  function handlePointerUp(e: React.PointerEvent) {
    setIsDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
  }

  function handleReset() {
    setTransform({ zoom: 1, x: 0, y: 0 });
  }

  function handleSave() {
    onSave(transform);
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-rose-900">
            Adjust Image #{slotIndex}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview Container */}
          <div
            ref={containerRef}
            className="relative w-full aspect-square bg-rose-50 rounded-lg overflow-hidden border-2 border-rose-200 cursor-move touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <img
              src={imageUrl}
              alt={`Adjust ${slotIndex}`}
              className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
              style={{
                transform: `scale(${transform.zoom}) translate(${transform.x / transform.zoom}px, ${transform.y / transform.zoom}px)`,
                transformOrigin: 'center center',
              }}
              draggable={false}
            />
            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
              Drag to pan
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-rose-900 flex items-center gap-2">
                <ZoomIn className="w-4 h-4" />
                Zoom
              </Label>
              <span className="text-sm text-rose-700">{transform.zoom.toFixed(1)}x</span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleZoomChange([Math.max(0.5, transform.zoom - 0.1)])}
                className="shrink-0"
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Slider
                value={[transform.zoom]}
                onValueChange={handleZoomChange}
                min={0.5}
                max={3}
                step={0.1}
                className="flex-1"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => handleZoomChange([Math.min(3, transform.zoom + 0.1)])}
                className="shrink-0"
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-row gap-2 sm:gap-2">
          <Button variant="outline" onClick={handleReset} className="flex items-center gap-2">
            <RotateCcw className="w-4 h-4" />
            Reset
          </Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} className="bg-rose-600 hover:bg-rose-700">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
