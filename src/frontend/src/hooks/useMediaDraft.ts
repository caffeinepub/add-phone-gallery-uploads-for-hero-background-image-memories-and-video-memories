import { useState } from 'react';

export interface ImageTransform {
  zoom: number;
  x: number;
  y: number;
}

export interface MediaDraft {
  hero: File | null | 'clear';
  images: Map<number, File | 'clear'>;
  videos: Map<number, File | 'clear'>;
  song: File | null | 'clear';
  imageOrder: number[];
  imageTransforms: Map<number, ImageTransform>;
}

interface UseMediaDraftOptions {
  initialOrder?: number[];
  initialTransforms?: Map<number, ImageTransform>;
}

export function useMediaDraft(options?: UseMediaDraftOptions) {
  const [draft, setDraft] = useState<MediaDraft>({
    hero: null,
    images: new Map(),
    videos: new Map(),
    song: null,
    imageOrder: options?.initialOrder || Array.from({ length: 43 }, (_, i) => i + 1),
    imageTransforms: new Map(options?.initialTransforms || new Map()),
  });

  const [dragState, setDragState] = useState<{
    draggedSlot: number | null;
    dropTarget: number | null;
  }>({
    draggedSlot: null,
    dropTarget: null,
  });

  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);

  function setHero(file: File | null | 'clear') {
    setDraft((prev) => ({ ...prev, hero: file }));
  }

  function setImage(slotIndex: number, file: File | 'clear') {
    setDraft((prev) => {
      const newImages = new Map(prev.images);
      newImages.set(slotIndex, file);
      return { ...prev, images: newImages };
    });
  }

  function setVideo(slotIndex: number, file: File | 'clear') {
    setDraft((prev) => {
      const newVideos = new Map(prev.videos);
      newVideos.set(slotIndex, file);
      return { ...prev, videos: newVideos };
    });
  }

  function setSong(file: File | null | 'clear') {
    setDraft((prev) => ({ ...prev, song: file }));
  }

  function swapImageSlots(fromIndex: number, toIndex: number) {
    setDraft((prev) => {
      const newOrder = [...prev.imageOrder];
      const fromPos = newOrder.indexOf(fromIndex);
      const toPos = newOrder.indexOf(toIndex);
      
      if (fromPos !== -1 && toPos !== -1) {
        [newOrder[fromPos], newOrder[toPos]] = [newOrder[toPos], newOrder[fromPos]];
      }
      
      return { ...prev, imageOrder: newOrder };
    });
  }

  function moveImageSlot(slotIndex: number, direction: 'left' | 'right' | 'up' | 'down') {
    setDraft((prev) => {
      const newOrder = [...prev.imageOrder];
      const currentPos = newOrder.indexOf(slotIndex);
      
      if (currentPos === -1) return prev;
      
      let targetPos = currentPos;
      
      // Calculate target position based on direction
      // Assuming 5 columns on desktop, 3 on mobile (we'll use 5 as base)
      const cols = 5;
      
      switch (direction) {
        case 'left':
          targetPos = currentPos > 0 ? currentPos - 1 : currentPos;
          break;
        case 'right':
          targetPos = currentPos < newOrder.length - 1 ? currentPos + 1 : currentPos;
          break;
        case 'up':
          targetPos = currentPos >= cols ? currentPos - cols : currentPos;
          break;
        case 'down':
          targetPos = currentPos + cols < newOrder.length ? currentPos + cols : currentPos;
          break;
      }
      
      if (targetPos !== currentPos) {
        [newOrder[currentPos], newOrder[targetPos]] = [newOrder[targetPos], newOrder[currentPos]];
      }
      
      return { ...prev, imageOrder: newOrder };
    });
  }

  function setImageTransform(slotIndex: number, transform: ImageTransform) {
    setDraft((prev) => {
      const newTransforms = new Map(prev.imageTransforms);
      newTransforms.set(slotIndex, transform);
      return { ...prev, imageTransforms: newTransforms };
    });
  }

  function startDrag(slotIndex: number) {
    setDragState({ draggedSlot: slotIndex, dropTarget: null });
  }

  function setDropTarget(slotIndex: number | null) {
    setDragState((prev) => ({ ...prev, dropTarget: slotIndex }));
  }

  function endDrag() {
    if (dragState.draggedSlot !== null && dragState.dropTarget !== null) {
      swapImageSlots(dragState.draggedSlot, dragState.dropTarget);
    }
    setDragState({ draggedSlot: null, dropTarget: null });
  }

  function resetDraft(newOrder?: number[], newTransforms?: Map<number, ImageTransform>) {
    setDraft({
      hero: null,
      images: new Map(),
      videos: new Map(),
      song: null,
      imageOrder: newOrder || Array.from({ length: 43 }, (_, i) => i + 1),
      imageTransforms: new Map(newTransforms || new Map()),
    });
    setDragState({ draggedSlot: null, dropTarget: null });
    setSelectedSlot(null);
  }

  return {
    draft,
    dragState,
    selectedSlot,
    setHero,
    setImage,
    setVideo,
    setSong,
    swapImageSlots,
    moveImageSlot,
    setImageTransform,
    startDrag,
    setDropTarget,
    endDrag,
    setSelectedSlot,
    resetDraft,
  };
}
