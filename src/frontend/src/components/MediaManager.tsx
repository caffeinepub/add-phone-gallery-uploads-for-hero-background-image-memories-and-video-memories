import { useState, useEffect } from 'react';
import { Upload, Image, Video, Trash2, X, Check, Save, Settings, Music, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, AlertCircle, CheckCircle2, Eye } from 'lucide-react';
import { useMediaStore } from '../hooks/useMediaStore';
import { useMediaDraft } from '../hooks/useMediaDraft';
import { usePublishWithPrecheck } from '../hooks/usePublishWithPrecheck';
import { formatDiagnosticForUser } from '../lib/deployDiagnostics';
import ImageAdjustModal from './ImageAdjustModal';
import type { PrePublishConfig } from '../backend';
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
  const [precheckResult, setPrecheckResult] = useState<'idle' | 'passed' | 'failed'>('idle');
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  // Preview URLs for draft changes
  const [previewUrls, setPreviewUrls] = useState<{
    hero: string | null;
    images: Map<number, string>;
    videos: Map<number, string>;
    song: string | null;
  }>({
    hero: null,
    images: new Map(),
    videos: new Map(),
    song: null,
  });

  // Initialize draft from live state when dialog opens
  useEffect(() => {
    if (open) {
      resetDraft(liveImageOrder, liveImageTransforms);
      setPreviewUrls({ hero: null, images: new Map(), videos: new Map(), song: null });
      setIsClosingAfterSubmit(false);
      resetPublish();
      setPrecheckResult('idle');
      setShowErrorDetails(false);
    }
  }, [open, liveImageOrder, liveImageTransforms, resetPublish]);

  // Cleanup preview URLs when dialog closes or on unmount
  useEffect(() => {
    return () => {
      if (previewUrls.hero) URL.revokeObjectURL(previewUrls.hero);
      previewUrls.images.forEach((url) => URL.revokeObjectURL(url));
      previewUrls.videos.forEach((url) => URL.revokeObjectURL(url));
      if (previewUrls.song) URL.revokeObjectURL(previewUrls.song);
    };
  }, []);

  // Close dialog on successful publish
  useEffect(() => {
    if (status === 'succeeded' && isClosingAfterSubmit) {
      onClose();
    }
  }, [status, isClosingAfterSubmit, onClose]);

  function handleHeroUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setHero(file);
    
    // Revoke previous preview URL if exists
    setPreviewUrls((prev) => {
      if (prev.hero) URL.revokeObjectURL(prev.hero);
      return { ...prev, hero: URL.createObjectURL(file) };
    });
    e.target.value = '';
  }

  function handleImageUpload(slotIndex: number, file: File) {
    setImage(slotIndex, file);
    
    // Revoke previous preview URL for this slot if exists
    setPreviewUrls((prev) => {
      const oldUrl = prev.images.get(slotIndex);
      if (oldUrl) URL.revokeObjectURL(oldUrl);
      
      const newImages = new Map(prev.images);
      newImages.set(slotIndex, URL.createObjectURL(file));
      return { ...prev, images: newImages };
    });
  }

  function handleVideoUpload(slotIndex: number, file: File) {
    setVideo(slotIndex, file);
    
    // Revoke previous preview URL for this slot if exists
    setPreviewUrls((prev) => {
      const oldUrl = prev.videos.get(slotIndex);
      if (oldUrl) URL.revokeObjectURL(oldUrl);
      
      const newVideos = new Map(prev.videos);
      newVideos.set(slotIndex, URL.createObjectURL(file));
      return { ...prev, videos: newVideos };
    });
  }

  function handleSongUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setSong(file);
    
    // Revoke previous preview URL if exists
    setPreviewUrls((prev) => {
      if (prev.song) URL.revokeObjectURL(prev.song);
      return { ...prev, song: URL.createObjectURL(file) };
    });
    e.target.value = '';
  }

  function handleClearHero() {
    if (!confirm('Clear hero background? This will remove the uploaded background.')) return;
    setHero('clear');
    setPreviewUrls((prev) => {
      if (prev.hero) URL.revokeObjectURL(prev.hero);
      return { ...prev, hero: null };
    });
  }

  function handleClearImage(slotIndex: number) {
    if (!confirm('Clear this image? This will remove the uploaded image.')) return;
    setImage(slotIndex, 'clear');
    const previewUrl = previewUrls.images.get(slotIndex);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrls((prev) => {
        const newImages = new Map(prev.images);
        newImages.delete(slotIndex);
        return { ...prev, images: newImages };
      });
    }
  }

  function handleClearVideo(slotIndex: number) {
    if (!confirm('Clear this video? This will remove the uploaded video.')) return;
    setVideo(slotIndex, 'clear');
    const previewUrl = previewUrls.videos.get(slotIndex);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrls((prev) => {
        const newVideos = new Map(prev.videos);
        newVideos.delete(slotIndex);
        return { ...prev, videos: newVideos };
      });
    }
  }

  function handleClearSong() {
    if (!confirm('Clear background song? This will remove the uploaded song.')) return;
    setSong('clear');
    setPreviewUrls((prev) => {
      if (prev.song) URL.revokeObjectURL(prev.song);
      return { ...prev, song: null };
    });
  }

  async function handleRunPrecheck() {
    setPrecheckResult('idle');
    const result = await runPrecheck(precheckConfig);
    setPrecheckResult(result.success ? 'passed' : 'failed');
  }

  async function handleSubmit() {
    setIsClosingAfterSubmit(true);

    const result = await publish({
      hero: draft.hero === null ? undefined : draft.hero,
      images: draft.images,
      videos: draft.videos,
      song: draft.song === null ? undefined : draft.song,
      imageOrder: draft.imageOrder,
      imageTransforms: draft.imageTransforms,
    });

    if (result.success) {
      // Clean up preview URLs
      if (previewUrls.hero) URL.revokeObjectURL(previewUrls.hero);
      previewUrls.images.forEach((url) => URL.revokeObjectURL(url));
      previewUrls.videos.forEach((url) => URL.revokeObjectURL(url));
      if (previewUrls.song) URL.revokeObjectURL(previewUrls.song);

      resetDraft(draft.imageOrder, draft.imageTransforms);
      setPreviewUrls({ hero: null, images: new Map(), videos: new Map(), song: null });
    } else {
      // Keep dialog open on failure so user can see error and retry
      setIsClosingAfterSubmit(false);
    }
  }

  function handleCancel() {
    if (isClosingAfterSubmit) {
      return;
    }

    if (hasPendingChanges) {
      if (!confirm('Discard all pending changes?')) return;
    }

    // Clean up preview URLs
    if (previewUrls.hero) URL.revokeObjectURL(previewUrls.hero);
    previewUrls.images.forEach((url) => URL.revokeObjectURL(url));
    previewUrls.videos.forEach((url) => URL.revokeObjectURL(url));
    if (previewUrls.song) URL.revokeObjectURL(previewUrls.song);

    resetDraft(liveImageOrder, liveImageTransforms);
    setPreviewUrls({ hero: null, images: new Map(), videos: new Map(), song: null });
    onClose();
  }

  function ImageSlot({ slotIndex }: { slotIndex: number }) {
    const draftFile = draft.images.get(slotIndex);
    const previewUrl = previewUrls.images.get(slotIndex);
    const isCleared = draftFile === 'clear';
    const hasImage = !isCleared && (imageUrls.has(slotIndex) || previewUrl);
    const imageUrl = previewUrl || imageUrls.get(slotIndex);
    const transform = draft.imageTransforms.get(slotIndex);

    const isDragging = dragState.draggedSlot === slotIndex;
    const isDropTarget = dragState.dropTarget === slotIndex;
    const isSelected = selectedSlot === slotIndex;

    return (
      <div
        className={`relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${
          isDragging
            ? 'border-rose-500 opacity-50 scale-95'
            : isDropTarget
            ? 'border-rose-500 bg-rose-100 scale-105'
            : isSelected
            ? 'border-rose-600 ring-2 ring-rose-400'
            : 'border-rose-200 bg-rose-50 hover:border-rose-400'
        }`}
        draggable
        onDragStart={() => startDrag(slotIndex)}
        onDragOver={(e) => {
          e.preventDefault();
          setDropTarget(slotIndex);
        }}
        onDragLeave={() => setDropTarget(null)}
        onDrop={(e) => {
          e.preventDefault();
          endDrag();
        }}
        onDragEnd={() => endDrag()}
        onClick={() => setSelectedSlot(isSelected ? null : slotIndex)}
      >
        {hasImage && imageUrl ? (
          <img
            src={imageUrl}
            alt={`Memory ${slotIndex}`}
            className="w-full h-full object-cover"
            loading="eager"
            style={
              transform
                ? {
                    transform: `scale(${transform.zoom}) translate(${transform.x / transform.zoom}px, ${transform.y / transform.zoom}px)`,
                    transformOrigin: 'center center',
                  }
                : undefined
            }
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-rose-300">
            <Image className="w-8 h-8" />
          </div>
        )}

        {/* Desktop hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity hidden md:flex items-center justify-center gap-2">
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(slotIndex, file);
              e.target.value = '';
            }}
            disabled={status === 'running'}
            className="hidden"
            id={`image-slot-${slotIndex}`}
          />
          <Label
            htmlFor={`image-slot-${slotIndex}`}
            className="cursor-pointer bg-white/90 hover:bg-white text-rose-900 px-2 py-1 rounded-md text-xs font-medium flex items-center gap-1"
          >
            <Upload className="w-3 h-3" />
            <span>{hasImage ? 'Replace' : 'Upload'}</span>
          </Label>

          {hasImage && (
            <>
              <Button
                size="sm"
                variant="secondary"
                className="h-auto px-2 py-1 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setAdjustingSlot(slotIndex);
                }}
              >
                <Settings className="w-3 h-3" />
                <span>Adjust</span>
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-auto px-2 py-1 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearImage(slotIndex);
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </>
          )}
        </div>

        {/* Mobile controls - always visible */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 flex md:hidden items-center justify-center gap-1">
          <input
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImageUpload(slotIndex, file);
              e.target.value = '';
            }}
            disabled={status === 'running'}
            className="hidden"
            id={`image-slot-mobile-${slotIndex}`}
          />
          <Label
            htmlFor={`image-slot-mobile-${slotIndex}`}
            className="cursor-pointer bg-white/90 text-rose-900 px-2 py-1 rounded text-xs font-medium flex items-center gap-1"
          >
            <Upload className="w-3 h-3" />
          </Label>

          {hasImage && (
            <>
              <Button
                size="sm"
                variant="secondary"
                className="h-auto px-2 py-1 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  setAdjustingSlot(slotIndex);
                }}
              >
                <Settings className="w-3 h-3" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-auto px-2 py-1 text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClearImage(slotIndex);
                }}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </>
          )}
        </div>

        <div className="absolute top-1 left-1 bg-rose-900/80 text-white text-xs px-2 py-0.5 rounded">
          #{slotIndex}
        </div>

        {hasImage && !isCleared && (
          <div className="absolute top-1 right-1 bg-green-500/90 text-white rounded-full p-1">
            <Check className="w-3 h-3" />
          </div>
        )}

        {draftFile && draftFile !== 'clear' && (
          <div className="absolute bottom-1 right-1 bg-amber-500/90 text-white text-xs px-2 py-0.5 rounded md:block hidden">
            Pending
          </div>
        )}

        {isCleared && (
          <div className="absolute bottom-1 right-1 bg-red-500/90 text-white text-xs px-2 py-0.5 rounded md:block hidden">
            Will Clear
          </div>
        )}
      </div>
    );
  }

  function VideoSlot({ slotIndex }: { slotIndex: number }) {
    const draftFile = draft.videos.get(slotIndex);
    const previewUrl = previewUrls.videos.get(slotIndex);
    const isCleared = draftFile === 'clear';
    const hasVideo = !isCleared && (videoUrls.has(slotIndex) || previewUrl);
    const videoUrl = previewUrl || videoUrls.get(slotIndex);

    return (
      <div className="relative aspect-[9/16] rounded-lg overflow-hidden border-2 border-rose-200 bg-rose-50 hover:border-rose-400 transition-colors">
        {hasVideo && videoUrl ? (
          <video src={videoUrl} className="w-full h-full object-cover" muted playsInline preload="auto" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-rose-300">
            <Video className="w-8 h-8" />
          </div>
        )}

        {/* Desktop hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity hidden md:flex items-center justify-center gap-2">
          <input
            type="file"
            accept=".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleVideoUpload(slotIndex, file);
              e.target.value = '';
            }}
            disabled={status === 'running'}
            className="hidden"
            id={`video-slot-${slotIndex}`}
          />
          <Label
            htmlFor={`video-slot-${slotIndex}`}
            className="cursor-pointer bg-white/90 hover:bg-white text-rose-900 px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1"
          >
            <Upload className="w-3 h-3" />
            <span>{hasVideo ? 'Replace' : 'Upload'}</span>
          </Label>

          {hasVideo && (
            <Button
              size="sm"
              variant="destructive"
              className="h-auto px-2 py-1 text-xs"
              onClick={() => handleClearVideo(slotIndex)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>

        {/* Mobile controls - always visible */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 flex md:hidden items-center justify-center gap-1">
          <input
            type="file"
            accept=".mp4,.mov,.webm,video/mp4,video/quicktime,video/webm"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleVideoUpload(slotIndex, file);
              e.target.value = '';
            }}
            disabled={status === 'running'}
            className="hidden"
            id={`video-slot-mobile-${slotIndex}`}
          />
          <Label
            htmlFor={`video-slot-mobile-${slotIndex}`}
            className="cursor-pointer bg-white/90 text-rose-900 px-2 py-1 rounded text-xs font-medium flex items-center gap-1"
          >
            <Upload className="w-3 h-3" />
          </Label>

          {hasVideo && (
            <Button
              size="sm"
              variant="destructive"
              className="h-auto px-2 py-1 text-xs"
              onClick={() => handleClearVideo(slotIndex)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          )}
        </div>

        <div className="absolute top-1 left-1 bg-rose-900/80 text-white text-xs px-2 py-0.5 rounded">
          #{slotIndex}
        </div>

        {hasVideo && !isCleared && (
          <div className="absolute top-1 right-1 bg-green-500/90 text-white rounded-full p-1">
            <Check className="w-3 h-3" />
          </div>
        )}

        {draftFile && draftFile !== 'clear' && (
          <div className="absolute bottom-1 right-1 bg-amber-500/90 text-white text-xs px-2 py-0.5 rounded md:block hidden">
            Pending
          </div>
        )}

        {isCleared && (
          <div className="absolute bottom-1 right-1 bg-red-500/90 text-white text-xs px-2 py-0.5 rounded md:block hidden">
            Will Clear
          </div>
        )}
      </div>
    );
  }

  // Compute current preview values (draft or live)
  const currentHeroUrl = draft.hero === 'clear' ? null : (previewUrls.hero || heroBackgroundUrl);
  const currentSongUrl = draft.song === 'clear' ? null : (previewUrls.song || songUrl);

  const hasUploadOrClearChanges = draft.hero || draft.images.size > 0 || draft.videos.size > 0 || draft.song;
  const hasOrderChanges = JSON.stringify(draft.imageOrder) !== JSON.stringify(liveImageOrder);
  const hasTransformChanges = (() => {
    if (draft.imageTransforms.size !== liveImageTransforms.size) return true;
    for (const [key, value] of draft.imageTransforms.entries()) {
      const liveValue = liveImageTransforms.get(key);
      if (!liveValue || 
          liveValue.zoom !== value.zoom || 
          liveValue.x !== value.x || 
          liveValue.y !== value.y) {
        return true;
      }
    }
    return false;
  })();

  const hasPendingChanges = hasUploadOrClearChanges || hasOrderChanges || hasTransformChanges;
  const isSubmitting = status === 'running';

  const formattedError = error ? formatDiagnosticForUser(error) : null;

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => !isOpen && handleCancel()}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-rose-900">Media Manager</DialogTitle>
            <DialogDescription>
              Manage your Hero background, Image Memories, Video Memories, and Background Song. Click Submit to save all changes.
            </DialogDescription>
          </DialogHeader>

          {/* Error Display */}
          {status === 'failed' && formattedError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{formattedError.title}</AlertTitle>
              <AlertDescription>
                <p className="mb-2">{formattedError.message}</p>
                {formattedError.details && (
                  <Collapsible open={showErrorDetails} onOpenChange={setShowErrorDetails}>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="sm" className="p-0 h-auto text-xs">
                        {showErrorDetails ? 'Hide details' : 'Show details'}
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="mt-2">
                      <pre className="text-xs bg-black/10 p-2 rounded overflow-x-auto">
                        {formattedError.details}
                      </pre>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Pre-publish Check Section */}
          <Collapsible open={showPrecheckConfig} onOpenChange={setShowPrecheckConfig}>
            <div className="border rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="p-0 h-auto">
                    <Settings className="w-4 h-4 mr-2" />
                    <span className="font-semibold">Pre-publish Check</span>
                  </Button>
                </CollapsibleTrigger>
                {precheckResult === 'passed' && (
                  <div className="flex items-center gap-1 text-green-600 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Passed</span>
                  </div>
                )}
                {precheckResult === 'failed' && (
                  <div className="flex items-center gap-1 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>Failed</span>
                  </div>
                )}
              </div>
              
              <CollapsibleContent className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="frontend-build-failed" className="text-sm">
                    Simulate frontend build failure
                  </Label>
                  <Switch
                    id="frontend-build-failed"
                    checked={precheckConfig.frontendBuildFailed}
                    onCheckedChange={(checked) =>
                      setPrecheckConfig((prev) => ({ ...prev, frontendBuildFailed: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="missing-artifacts" className="text-sm">
                    Simulate missing artifacts
                  </Label>
                  <Switch
                    id="missing-artifacts"
                    checked={precheckConfig.missingArtifacts}
                    onCheckedChange={(checked) =>
                      setPrecheckConfig((prev) => ({ ...prev, missingArtifacts: checked }))
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="misconfigured-canister" className="text-sm">
                    Simulate misconfigured canister
                  </Label>
                  <Switch
                    id="misconfigured-canister"
                    checked={precheckConfig.misconfiguredCanister}
                    onCheckedChange={(checked) =>
                      setPrecheckConfig((prev) => ({ ...prev, misconfiguredCanister: checked }))
                    }
                  />
                </div>
                <Button
                  onClick={handleRunPrecheck}
                  size="sm"
                  variant="outline"
                  className="w-full mt-2"
                  disabled={isSubmitting}
                >
                  Run Check
                </Button>
              </CollapsibleContent>
            </div>
          </Collapsible>

          <Tabs defaultValue="preview" className="flex-1 flex flex-col min-h-0">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="preview">
                <Eye className="w-4 h-4 mr-1" />
                Preview
              </TabsTrigger>
              <TabsTrigger value="hero">Hero</TabsTrigger>
              <TabsTrigger value="images">Images ({imageUrls.size + previewUrls.images.size}/43)</TabsTrigger>
              <TabsTrigger value="videos">Videos ({videoUrls.size + previewUrls.videos.size}/6)</TabsTrigger>
              <TabsTrigger value="song">Song</TabsTrigger>
            </TabsList>

            <TabsContent value="preview" className="flex-1 mt-4 min-h-0">
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-6">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-rose-900 mb-2">Draft Preview</h3>
                    <p className="text-sm text-rose-600">This is what will be published when you click Submit</p>
                  </div>

                  {/* Hero Preview */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-rose-900 flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      Hero Background
                    </h4>
                    <div className="relative aspect-video max-w-md mx-auto rounded-lg overflow-hidden border-2 border-rose-200 bg-rose-50">
                      {currentHeroUrl ? (
                        <img src={currentHeroUrl} alt="Hero preview" className="w-full h-full object-cover" loading="eager" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-rose-300">
                          <div className="text-center">
                            <Image className="w-12 h-12 mx-auto mb-2" />
                            <p className="text-sm">No hero background uploaded</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Images Preview */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-rose-900 flex items-center gap-2">
                      <Image className="w-4 h-4" />
                      Image Memories ({draft.imageOrder.filter(idx => {
                        const draftFile = draft.images.get(idx);
                        return draftFile !== 'clear' && (previewUrls.images.has(idx) || imageUrls.has(idx));
                      }).length}/43)
                    </h4>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                      {draft.imageOrder.slice(0, 12).map((slotIndex) => {
                        const draftFile = draft.images.get(slotIndex);
                        const previewUrl = previewUrls.images.get(slotIndex);
                        const isCleared = draftFile === 'clear';
                        const hasImage = !isCleared && (imageUrls.has(slotIndex) || previewUrl);
                        const imageUrl = previewUrl || imageUrls.get(slotIndex);
                        const transform = draft.imageTransforms.get(slotIndex);

                        return (
                          <div key={slotIndex} className="relative aspect-square rounded border border-rose-200 bg-rose-50 overflow-hidden">
                            {hasImage && imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={`Preview ${slotIndex}`}
                                className="w-full h-full object-cover"
                                loading="eager"
                                style={
                                  transform
                                    ? {
                                        transform: `scale(${transform.zoom}) translate(${transform.x / transform.zoom}px, ${transform.y / transform.zoom}px)`,
                                        transformOrigin: 'center center',
                                      }
                                    : undefined
                                }
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-rose-300">
                                <Image className="w-4 h-4" />
                              </div>
                            )}
                            <div className="absolute top-0.5 left-0.5 bg-rose-900/80 text-white text-[10px] px-1 rounded">
                              #{slotIndex}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground text-center">Showing first 12 images in draft order</p>
                  </div>

                  {/* Videos Preview */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-rose-900 flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      Video Memories ({Array.from({ length: 6 }, (_, i) => i + 1).filter(idx => {
                        const draftFile = draft.videos.get(idx);
                        return draftFile !== 'clear' && (previewUrls.videos.has(idx) || videoUrls.has(idx));
                      }).length}/6)
                    </h4>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {Array.from({ length: 6 }, (_, i) => i + 1).map((slotIndex) => {
                        const draftFile = draft.videos.get(slotIndex);
                        const previewUrl = previewUrls.videos.get(slotIndex);
                        const isCleared = draftFile === 'clear';
                        const hasVideo = !isCleared && (videoUrls.has(slotIndex) || previewUrl);
                        const videoUrl = previewUrl || videoUrls.get(slotIndex);

                        return (
                          <div key={slotIndex} className="relative aspect-[9/16] rounded border border-rose-200 bg-rose-50 overflow-hidden">
                            {hasVideo && videoUrl ? (
                              <video src={videoUrl} className="w-full h-full object-cover" muted playsInline preload="auto" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-rose-300">
                                <Video className="w-4 h-4" />
                              </div>
                            )}
                            <div className="absolute top-0.5 left-0.5 bg-rose-900/80 text-white text-[10px] px-1 rounded">
                              #{slotIndex}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Song Preview */}
                  <div className="space-y-2">
                    <h4 className="font-semibold text-rose-900 flex items-center gap-2">
                      <Music className="w-4 h-4" />
                      Background Song
                    </h4>
                    <div className="max-w-md mx-auto rounded-lg border-2 border-rose-200 bg-rose-50 p-4">
                      {currentSongUrl ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-center text-rose-600">
                            <Music className="w-12 h-12" />
                          </div>
                          <audio src={currentSongUrl} controls className="w-full" preload="auto" />
                          <p className="text-center text-sm text-rose-700 font-medium">Custom song</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center justify-center text-rose-300">
                            <Music className="w-12 h-12" />
                          </div>
                          <p className="text-center text-sm text-rose-600">No song uploaded</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="hero" className="flex-1 mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold text-rose-900 flex items-center gap-2">
                    <Image className="w-5 h-5" />
                    Hero Background
                  </Label>
                  {currentHeroUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearHero}
                      disabled={isSubmitting}
                      className="text-rose-600 hover:text-rose-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="relative aspect-video max-w-2xl mx-auto rounded-lg overflow-hidden border-2 border-rose-200 bg-rose-50">
                  {currentHeroUrl ? (
                    <img src={currentHeroUrl} alt="Hero background" className="w-full h-full object-cover" loading="eager" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-rose-300">
                      <Image className="w-16 h-16" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                      onChange={handleHeroUpload}
                      disabled={isSubmitting}
                      className="hidden"
                      id="hero-upload"
                    />
                    <Label
                      htmlFor="hero-upload"
                      className="cursor-pointer bg-white/90 hover:bg-white text-rose-900 px-6 py-3 rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{currentHeroUrl ? 'Replace Background' : 'Upload Background'}</span>
                    </Label>
                  </div>
                </div>

                {draft.hero && (
                  <p className="text-center text-sm text-amber-600 font-medium">⚠ Pending changes (click Submit to save)</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="images" className="flex-1 mt-4 min-h-0 flex flex-col">
              <ScrollArea className="h-[500px] pr-4">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {draft.imageOrder.map((slotIndex) => (
                    <ImageSlot key={slotIndex} slotIndex={slotIndex} />
                  ))}
                </div>
              </ScrollArea>
              
              {/* Mobile reorder controls */}
              {selectedSlot !== null && (
                <div className="mt-4 p-3 bg-rose-50 rounded-lg border border-rose-200 md:hidden">
                  <p className="text-sm font-medium text-rose-900 mb-2">Move Image #{selectedSlot}</p>
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveImageSlot(selectedSlot, 'left')}
                      disabled={isSubmitting}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveImageSlot(selectedSlot, 'up')}
                      disabled={isSubmitting}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveImageSlot(selectedSlot, 'down')}
                      disabled={isSubmitting}
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => moveImageSlot(selectedSlot, 'right')}
                      disabled={isSubmitting}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
              
              <p className="text-xs text-muted-foreground mt-4 text-center">
                <span className="hidden md:inline">Drag to reorder • Hover to upload/adjust</span>
                <span className="md:hidden">Tap to select • Use arrows to reorder</span>
                <span className="block mt-1">Accepts .jpg, .jpeg, .png, .webp</span>
              </p>
            </TabsContent>

            <TabsContent value="videos" className="flex-1 mt-4 min-h-0">
              <ScrollArea className="h-[500px] pr-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {Array.from({ length: 6 }, (_, i) => i + 1).map((slotIndex) => (
                    <VideoSlot key={slotIndex} slotIndex={slotIndex} />
                  ))}
                </div>
              </ScrollArea>
              <p className="text-xs text-muted-foreground mt-4 text-center">
                <span className="hidden md:inline">Hover over any slot to upload or replace.</span>
                <span className="md:hidden">Tap controls to upload or replace.</span>
                <span className="block mt-1">Accepts .mp4, .mov, .webm</span>
              </p>
            </TabsContent>

            <TabsContent value="song" className="flex-1 mt-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold text-rose-900 flex items-center gap-2">
                    <Music className="w-5 h-5" />
                    Background Song
                  </Label>
                  {currentSongUrl && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearSong}
                      disabled={isSubmitting}
                      className="text-rose-600 hover:text-rose-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                <div className="relative max-w-2xl mx-auto rounded-lg overflow-hidden border-2 border-rose-200 bg-rose-50 p-8">
                  {currentSongUrl ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center text-rose-600">
                        <Music className="w-16 h-16" />
                      </div>
                      <audio src={currentSongUrl} controls className="w-full" preload="auto" />
                      <p className="text-center text-sm text-rose-700 font-medium">Custom song uploaded</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-center text-rose-300">
                        <Music className="w-16 h-16" />
                      </div>
                      <p className="text-center text-sm text-rose-600">No custom song uploaded</p>
                    </div>
                  )}

                  <div className="mt-6 flex items-center justify-center">
                    <input
                      type="file"
                      accept=".mp3,.wav,audio/mpeg,audio/wav"
                      onChange={handleSongUpload}
                      disabled={isSubmitting}
                      className="hidden"
                      id="song-upload"
                    />
                    <Label
                      htmlFor="song-upload"
                      className="cursor-pointer bg-rose-600 hover:bg-rose-700 text-white px-6 py-3 rounded-lg text-sm font-medium flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      <span>{currentSongUrl ? 'Replace Song' : 'Upload Song'}</span>
                    </Label>
                  </div>
                </div>

                {draft.song && (
                  <p className="text-center text-sm text-amber-600 font-medium">⚠ Pending changes (click Submit to save)</p>
                )}

                <p className="text-xs text-muted-foreground text-center">
                  Accepts .mp3, .wav audio files
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="flex-row gap-2 sm:gap-2 border-t pt-4">
            <Button variant="outline" onClick={handleCancel} disabled={isSubmitting}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <div className="flex-1" />
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !hasPendingChanges}
              className="bg-rose-600 hover:bg-rose-700"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Submitting...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Submit
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {adjustingSlot !== null && (
        <ImageAdjustModal
          open={adjustingSlot !== null}
          onClose={() => setAdjustingSlot(null)}
          imageUrl={previewUrls.images.get(adjustingSlot) || imageUrls.get(adjustingSlot) || ''}
          slotIndex={adjustingSlot}
          initialTransform={draft.imageTransforms.get(adjustingSlot)}
          onSave={(transform) => setImageTransform(adjustingSlot, transform)}
        />
      )}
    </>
  );
}
