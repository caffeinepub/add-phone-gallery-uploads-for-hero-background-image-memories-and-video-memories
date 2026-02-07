import { useState, useEffect } from 'react';
import { Upload, Image, Video, Trash2, X, Check, Save, Settings, Music, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, AlertCircle, CheckCircle2, Eye, Info } from 'lucide-react';
import { useMediaStore } from '../hooks/useMediaStore';
import { useMediaDraft } from '../hooks/useMediaDraft';
import { usePublishWithPrecheck } from '../hooks/usePublishWithPrecheck';
import { useMediaManagerPermissions } from '../hooks/useMediaManagerPermissions';
import ImageAdjustModal from './ImageAdjustModal';
import type { PrePublishConfig } from '../backend';
import type { PublishChanges } from '../hooks/usePublishWithPrecheck';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';
import { Switch } from './ui/switch';

interface MediaManagerProps {
  open: boolean;
  onClose: () => void;
}

export default function MediaManager({ open, onClose }: MediaManagerProps) {
  const {
    heroBackgroundUrl,
    imageUrls,
    videoUrls,
    songUrl,
    imageOrder: liveImageOrder,
    imageTransforms: liveImageTransforms,
  } = useMediaStore();

  const permissions = useMediaManagerPermissions();

  const {
    draft,
    dragState,
    selectedSlot,
    setHero,
    setImage,
    setVideo,
    setSong,
    setImageTransform,
    moveImageSlot,
    startDrag,
    setDropTarget,
    endDrag,
    setSelectedSlot,
    resetDraft,
  } = useMediaDraft({
    initialOrder: liveImageOrder,
    initialTransforms: liveImageTransforms,
  });

  const { status, error, runPrecheck, publish, reset: resetPublish } = usePublishWithPrecheck();

  const [adjustingSlot, setAdjustingSlot] = useState<number | null>(null);
  const [isClosingAfterSubmit, setIsClosingAfterSubmit] = useState(false);
  const [showPrecheckConfig, setShowPrecheckConfig] = useState(false);
  const [precheckConfig, setPrecheckConfig] = useState<PrePublishConfig>({
    frontendBuildFailed: false,
    missingArtifacts: false,
    misconfiguredCanister: false,
  });

  // Reset draft when dialog opens
  useEffect(() => {
    if (open) {
      resetDraft(liveImageOrder, liveImageTransforms);
      resetPublish();
      setIsClosingAfterSubmit(false);
    }
  }, [open, liveImageOrder, liveImageTransforms]);

  // Close dialog after successful publish
  useEffect(() => {
    if (status === 'succeeded' && isClosingAfterSubmit) {
      const timer = setTimeout(() => {
        onClose();
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [status, isClosingAfterSubmit, onClose]);

  const handleSubmit = async () => {
    setIsClosingAfterSubmit(true);
    
    // Convert draft to PublishChanges format (hero can be undefined instead of null)
    const changes: PublishChanges = {
      hero: draft.hero === null ? undefined : draft.hero,
      images: draft.images,
      videos: draft.videos,
      song: draft.song === null ? undefined : draft.song,
      imageOrder: draft.imageOrder,
      imageTransforms: draft.imageTransforms,
    };
    
    await publish(changes);
  };

  const handlePrecheckSubmit = async () => {
    await runPrecheck(precheckConfig);
    setShowPrecheckConfig(false);
  };

  const hasPendingChanges = 
    draft.hero !== null ||
    draft.images.size > 0 ||
    draft.videos.size > 0 ||
    draft.song !== null ||
    JSON.stringify(draft.imageOrder) !== JSON.stringify(liveImageOrder) ||
    JSON.stringify(Array.from(draft.imageTransforms.entries())) !== JSON.stringify(Array.from(liveImageTransforms.entries()));

  const isSubmitting = status === 'running';

  // Permission checks - permissions object returns values directly
  const canEditHero = permissions.canEditHero;
  const canEditImages = permissions.canEditImages;
  const canEditVideos = permissions.canEditVideos;
  const canEditSong = permissions.canEditSong;

  const isLoadingPermissions = permissions.isLoading;

  if (isLoadingPermissions) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-rose-600 mx-auto mb-4"></div>
              <p className="text-rose-700">Loading permissions...</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-rose-900">Media Manager</DialogTitle>
            <DialogDescription>
              Upload and manage your hero background, images, videos, and background song
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="hero" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="hero" disabled={!canEditHero}>Hero</TabsTrigger>
              <TabsTrigger value="images" disabled={!canEditImages}>Images</TabsTrigger>
              <TabsTrigger value="videos" disabled={!canEditVideos}>Videos</TabsTrigger>
              <TabsTrigger value="song" disabled={!canEditSong}>Song</TabsTrigger>
            </TabsList>

            {/* Hero Tab */}
            <TabsContent value="hero" className="space-y-4">
              <ScrollArea className="h-[50vh]">
                <div className="space-y-4 pr-4">
                  <div className="space-y-2">
                    <Label>Hero Background</Label>
                    <div className="grid gap-4">
                      {/* Current/Preview */}
                      <div className="relative aspect-video rounded-lg overflow-hidden bg-rose-100 border-2 border-rose-200">
                        {(draft.hero instanceof File ? URL.createObjectURL(draft.hero) : heroBackgroundUrl) ? (
                          <img
                            src={draft.hero instanceof File ? URL.createObjectURL(draft.hero) : heroBackgroundUrl || ''}
                            alt="Hero background"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full text-rose-300">
                            <div className="text-center">
                              <Image className="w-12 h-12 mx-auto mb-2" />
                              <p>No hero background</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Controls */}
                      <div className="flex gap-2">
                        <Button
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/png,image/jpg,image/jpeg';
                            input.onchange = (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) setHero(file);
                            };
                            input.click();
                          }}
                          variant="outline"
                          className="flex-1"
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          {heroBackgroundUrl || draft.hero instanceof File ? 'Replace' : 'Add'}
                        </Button>
                        {(heroBackgroundUrl || draft.hero instanceof File) && (
                          <Button
                            onClick={() => setHero('clear')}
                            variant="destructive"
                            size="icon"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Images Tab */}
            <TabsContent value="images" className="space-y-4">
              <ScrollArea className="h-[50vh]">
                <div className="space-y-4 pr-4">
                  <div className="flex items-center justify-between">
                    <Label>Image Memories (43 slots)</Label>
                    <p className="text-xs text-rose-600">Tap image to adjust, use arrows to reorder</p>
                  </div>
                  
                  <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {draft.imageOrder.map((slotId) => {
                      const currentUrl = imageUrls.get(slotId);
                      const pendingFile = draft.images.get(slotId);
                      const previewUrl = pendingFile instanceof File ? URL.createObjectURL(pendingFile) : currentUrl;
                      const transform = draft.imageTransforms.get(slotId);
                      const isSelected = selectedSlot === slotId;
                      const isDragging = dragState.draggedSlot === slotId;
                      const isDropTarget = dragState.dropTarget === slotId;

                      return (
                        <div
                          key={slotId}
                          className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                            isSelected ? 'border-rose-500 ring-2 ring-rose-300' : 
                            isDragging ? 'border-blue-500 opacity-50' :
                            isDropTarget ? 'border-green-500 ring-2 ring-green-300' :
                            'border-rose-200'
                          }`}
                          draggable
                          onDragStart={() => startDrag(slotId)}
                          onDragOver={(e) => {
                            e.preventDefault();
                            setDropTarget(slotId);
                          }}
                          onDragLeave={() => setDropTarget(null)}
                          onDrop={(e) => {
                            e.preventDefault();
                            endDrag();
                          }}
                        >
                          {previewUrl ? (
                            <>
                              <img
                                src={previewUrl}
                                alt={`Slot ${slotId}`}
                                className="w-full h-full object-cover cursor-pointer"
                                onClick={() => setAdjustingSlot(slotId)}
                                style={
                                  transform
                                    ? {
                                        transform: `scale(${transform.zoom}) translate(${transform.x / transform.zoom}px, ${transform.y / transform.zoom}px)`,
                                        transformOrigin: 'center center',
                                      }
                                    : undefined
                                }
                              />
                              <div className="absolute top-1 left-1 bg-rose-900/80 text-white text-xs px-1.5 py-0.5 rounded">
                                {slotId}
                              </div>
                              {/* Always visible controls */}
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 flex gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-white hover:bg-white/20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'image/*';
                                    input.onchange = (e) => {
                                      const file = (e.target as HTMLInputElement).files?.[0];
                                      if (file) setImage(slotId, file);
                                    };
                                    input.click();
                                  }}
                                >
                                  <Upload className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-white hover:bg-white/20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setAdjustingSlot(slotId);
                                  }}
                                >
                                  <Settings className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7 text-white hover:bg-white/20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setImage(slotId, 'clear');
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full bg-rose-50 text-rose-300">
                              <Image className="w-6 h-6 mb-1" />
                              <p className="text-xs">{slotId}</p>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="mt-1 h-6 text-xs"
                                onClick={() => {
                                  const input = document.createElement('input');
                                  input.type = 'file';
                                  input.accept = 'image/*';
                                  input.onchange = (e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0];
                                    if (file) setImage(slotId, file);
                                  };
                                  input.click();
                                }}
                              >
                                <Upload className="w-3 h-3 mr-1" />
                                Add
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Mobile-friendly reorder controls */}
                  {selectedSlot && (
                    <div className="sticky bottom-0 bg-white border-t-2 border-rose-200 p-3 rounded-lg shadow-lg">
                      <p className="text-sm font-medium text-rose-900 mb-2">Reorder Slot {selectedSlot}</p>
                      <div className="grid grid-cols-4 gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => moveImageSlot(selectedSlot, 'left')}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => moveImageSlot(selectedSlot, 'up')}
                        >
                          <ChevronUp className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => moveImageSlot(selectedSlot, 'down')}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => moveImageSlot(selectedSlot, 'right')}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-full mt-2"
                        onClick={() => setSelectedSlot(null)}
                      >
                        Done
                      </Button>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Videos Tab */}
            <TabsContent value="videos" className="space-y-4">
              <ScrollArea className="h-[50vh]">
                <div className="space-y-4 pr-4">
                  <Label>Video Memories (6 slots)</Label>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {Array.from({ length: 6 }, (_, i) => i + 1).map((slotId) => {
                      const currentUrl = videoUrls.get(slotId);
                      const pendingFile = draft.videos.get(slotId);
                      const previewUrl = pendingFile instanceof File ? URL.createObjectURL(pendingFile) : currentUrl;

                      return (
                        <div
                          key={slotId}
                          className="relative aspect-[9/16] rounded-lg overflow-hidden border-2 border-rose-200"
                        >
                          {previewUrl ? (
                            <>
                              <video
                                src={previewUrl}
                                className="w-full h-full object-cover"
                                playsInline
                                muted
                                loop
                              />
                              <div className="absolute top-2 left-2 bg-rose-900/80 text-white text-xs px-2 py-1 rounded">
                                {slotId}
                              </div>
                              {/* Always visible controls */}
                              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 flex gap-1">
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="flex-1 text-white hover:bg-white/20"
                                  onClick={() => {
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'video/*';
                                    input.onchange = (e) => {
                                      const file = (e.target as HTMLInputElement).files?.[0];
                                      if (file) setVideo(slotId, file);
                                    };
                                    input.click();
                                  }}
                                >
                                  <Upload className="w-4 h-4 mr-1" />
                                  Replace
                                </Button>
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="text-white hover:bg-white/20"
                                  onClick={() => setVideo(slotId, 'clear')}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full bg-rose-50 text-rose-300">
                              <Video className="w-8 h-8 mb-2" />
                              <p className="text-sm mb-2">Slot {slotId}</p>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  const input = document.createElement('input');
                                  input.type = 'file';
                                  input.accept = 'video/*';
                                  input.onchange = (e) => {
                                    const file = (e.target as HTMLInputElement).files?.[0];
                                    if (file) setVideo(slotId, file);
                                  };
                                  input.click();
                                }}
                              >
                                <Upload className="w-4 h-4 mr-2" />
                                Add Video
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Song Tab */}
            <TabsContent value="song" className="space-y-4">
              <ScrollArea className="h-[50vh]">
                <div className="space-y-4 pr-4">
                  <Label>Background Song</Label>
                  
                  <div className="space-y-4">
                    {/* Current/Preview */}
                    <div className="relative rounded-lg overflow-hidden bg-rose-100 border-2 border-rose-200 p-6">
                      {(draft.song instanceof File ? URL.createObjectURL(draft.song) : songUrl) ? (
                        <div className="flex items-center gap-4">
                          <Music className="w-12 h-12 text-rose-600" />
                          <div className="flex-1">
                            <p className="font-medium text-rose-900">
                              {draft.song instanceof File ? draft.song.name : 'Current Song'}
                            </p>
                            <audio
                              src={draft.song instanceof File ? URL.createObjectURL(draft.song) : songUrl || ''}
                              controls
                              className="w-full mt-2"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center text-rose-300 py-8">
                          <Music className="w-16 h-16 mb-3" />
                          <p>No background song</p>
                        </div>
                      )}
                    </div>

                    {/* Controls */}
                    <div className="flex gap-2">
                      <Button
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'audio/*';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) setSong(file);
                          };
                          input.click();
                        }}
                        variant="outline"
                        className="flex-1"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {songUrl || draft.song instanceof File ? 'Replace' : 'Add'} Song
                      </Button>
                      {(songUrl || draft.song instanceof File) && (
                        <Button
                          onClick={() => setSong('clear')}
                          variant="destructive"
                          size="icon"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {/* Status Messages */}
          {status === 'succeeded' && (
            <Alert className="bg-green-50 border-green-200">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-900">Success!</AlertTitle>
              <AlertDescription className="text-green-800">
                Media published successfully. Changes are now live.
              </AlertDescription>
            </Alert>
          )}

          {status === 'failed' && error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error.message}
                {error.details && (
                  <div className="mt-2 text-xs opacity-80">
                    {error.details}
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!hasPendingChanges || isSubmitting}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Publishing...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save & Publish
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Image Adjust Modal */}
      {adjustingSlot !== null && (
        <ImageAdjustModal
          open={adjustingSlot !== null}
          onClose={() => setAdjustingSlot(null)}
          slotIndex={adjustingSlot}
          imageUrl={
            draft.images.get(adjustingSlot) instanceof File
              ? URL.createObjectURL(draft.images.get(adjustingSlot) as File)
              : imageUrls.get(adjustingSlot) || ''
          }
          initialTransform={draft.imageTransforms.get(adjustingSlot)}
          onSave={(transform) => {
            setImageTransform(adjustingSlot, transform);
            setAdjustingSlot(null);
          }}
        />
      )}
    </>
  );
}
