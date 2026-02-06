import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { getAllMediaOfType, saveMedia, clearAllMediaOfType, clearMedia } from '../lib/localMediaStore';
import { useActor } from '../hooks/useActor';
import { fetchPublishedMedia } from '../lib/publishedMediaClient';
import { logAppStartDiagnostic, type AppStartDiagnostic } from '../lib/mediaDiagnostics';
import type { ImageTransform } from '../hooks/useMediaDraft';

interface MediaStoreContextValue {
  heroBackgroundUrl: string | null;
  imageUrls: Map<number, string>; // index 1-43 -> URL
  videoUrls: Map<number, string>; // index 1-6 -> URL
  songUrl: string | null;
  imageOrder: number[];
  imageTransforms: Map<number, ImageTransform>;
  isLoading: boolean;
  uploadHeroBackground: (file: File) => Promise<void>;
  uploadImages: (files: File[]) => Promise<void>;
  uploadVideos: (files: File[]) => Promise<void>;
  uploadSingleImage: (slotIndex: number, file: File) => Promise<void>;
  uploadSingleVideo: (slotIndex: number, file: File) => Promise<void>;
  uploadSong: (file: File) => Promise<void>;
  clearHeroBackground: () => Promise<void>;
  clearAllImages: () => Promise<void>;
  clearAllVideos: () => Promise<void>;
  clearSingleImage: (slotIndex: number) => Promise<void>;
  clearSingleVideo: (slotIndex: number) => Promise<void>;
  clearSong: () => Promise<void>;
  updateImageOrder: (newOrder: number[]) => void;
  updateImageTransforms: (newTransforms: Map<number, ImageTransform>) => void;
  batchPublish: (changes: {
    hero?: File | 'clear';
    images: Map<number, File | 'clear'>;
    videos: Map<number, File | 'clear'>;
    song?: File | 'clear';
    imageOrder: number[];
    imageTransforms: Map<number, ImageTransform>;
  }) => Promise<void>;
  refreshFromBackend: () => Promise<void>;
}

const MediaStoreContext = createContext<MediaStoreContextValue | null>(null);

export function MediaStoreProvider({ children }: { children: ReactNode }) {
  const { actor, isFetching: actorFetching } = useActor();
  const [heroBackgroundUrl, setHeroBackgroundUrl] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<Map<number, string>>(new Map());
  const [videoUrls, setVideoUrls] = useState<Map<number, string>>(new Map());
  const [songUrl, setSongUrl] = useState<string | null>(null);
  const [imageOrder, setImageOrder] = useState<number[]>(Array.from({ length: 43 }, (_, i) => i + 1));
  const [imageTransforms, setImageTransforms] = useState<Map<number, ImageTransform>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  const diagnosticLoggedRef = useRef(false);
  const [backendFetchError, setBackendFetchError] = useState<string | null>(null);

  // Load persisted media on mount - wait for actor to be ready
  useEffect(() => {
    if (!actorFetching && actor) {
      loadAllMedia();
    }
  }, [actorFetching, actor]);

  async function loadAllMedia() {
    setIsLoading(true);
    try {
      // Fetch backend published media as the sole rendering source
      let committedHeroUrl: string | null = null;
      let committedImageUrls = new Map<number, string>();
      let committedVideoUrls = new Map<number, string>();
      let committedSongUrl: string | null = null;

      if (actor) {
        try {
          const backendMedia = await fetchPublishedMedia(actor);
          committedHeroUrl = backendMedia.heroUrl;
          committedImageUrls = backendMedia.imageUrls;
          committedVideoUrls = backendMedia.videoUrls;
          committedSongUrl = backendMedia.songUrl;
          setBackendFetchError(null);
        } catch (error) {
          console.error('Failed to fetch backend published media:', error);
          setBackendFetchError(String(error));
        }
      }

      // Update state with committed media only
      setHeroBackgroundUrl(committedHeroUrl);
      setImageUrls(committedImageUrls);
      setVideoUrls(committedVideoUrls);
      setSongUrl(committedSongUrl);

      // Load image order and transforms from localStorage
      const savedOrder = localStorage.getItem('imageOrder');
      if (savedOrder) {
        try {
          const parsedOrder = JSON.parse(savedOrder);
          if (Array.isArray(parsedOrder) && parsedOrder.length === 43) {
            setImageOrder(parsedOrder);
          }
        } catch (e) {
          console.error('Failed to parse saved image order:', e);
        }
      }

      const savedTransforms = localStorage.getItem('imageTransforms');
      if (savedTransforms) {
        try {
          const transformsArray = JSON.parse(savedTransforms) as [number, ImageTransform][];
          const validTransforms = transformsArray.filter(([index]) => index >= 1 && index <= 43);
          setImageTransforms(new Map(validTransforms));
        } catch (e) {
          console.error('Failed to parse saved image transforms:', e);
        }
      }

      // Diagnostic logging (once per app start)
      if (!diagnosticLoggedRef.current) {
        const diagnostic: AppStartDiagnostic = {
          renderSource: 'Backend committed media',
          committed: {
            hero: !!committedHeroUrl,
            images: committedImageUrls.size,
            videos: committedVideoUrls.size,
            song: !!committedSongUrl,
          },
          imageOrder: {
            length: imageOrder.length,
            firstFive: imageOrder.slice(0, 5),
          },
          transforms: {
            count: imageTransforms.size,
            slots: Array.from(imageTransforms.keys()).slice(0, 10),
          },
        };

        logAppStartDiagnostic(diagnostic);
        diagnosticLoggedRef.current = true;
      }
    } catch (error) {
      console.error('Failed to load media:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshFromBackend() {
    if (!actor) {
      console.error('Cannot refresh from backend: actor not available');
      return;
    }
    
    try {
      const backendMedia = await fetchPublishedMedia(actor);
      
      // Replace entire committed set deterministically
      setHeroBackgroundUrl(backendMedia.heroUrl);
      setImageUrls(backendMedia.imageUrls);
      setVideoUrls(backendMedia.videoUrls);
      setSongUrl(backendMedia.songUrl);
      
      setBackendFetchError(null);
    } catch (error) {
      console.error('Failed to refresh from backend:', error);
      setBackendFetchError(String(error));
      // Keep current state unchanged on error
    }
  }

  async function uploadHeroBackground(file: File) {
    try {
      await saveMedia('hero', 0, file);
      const newUrl = URL.createObjectURL(file);
      setHeroBackgroundUrl(newUrl);
    } catch (error) {
      console.error('Failed to upload hero background:', error);
      throw error;
    }
  }

  async function uploadImages(files: File[]) {
    try {
      for (let i = 0; i < Math.min(files.length, 43); i++) {
        if (!files[i]) continue;
        const slotIndex = i + 1;
        await saveMedia('image', slotIndex, files[i]);
      }

      setImageUrls((prevUrls) => {
        const newImageUrls = new Map(prevUrls);
        for (let i = 0; i < Math.min(files.length, 43); i++) {
          if (!files[i]) continue;
          const slotIndex = i + 1;
          const newUrl = URL.createObjectURL(files[i]);
          newImageUrls.set(slotIndex, newUrl);
        }
        return newImageUrls;
      });
    } catch (error) {
      console.error('Failed to upload images:', error);
      throw error;
    }
  }

  async function uploadVideos(files: File[]) {
    try {
      for (let i = 0; i < Math.min(files.length, 6); i++) {
        if (!files[i]) continue;
        const slotIndex = i + 1;
        await saveMedia('video', slotIndex, files[i]);
      }

      setVideoUrls((prevUrls) => {
        const newVideoUrls = new Map(prevUrls);
        for (let i = 0; i < Math.min(files.length, 6); i++) {
          if (!files[i]) continue;
          const slotIndex = i + 1;
          const newUrl = URL.createObjectURL(files[i]);
          newVideoUrls.set(slotIndex, newUrl);
        }
        return newVideoUrls;
      });
    } catch (error) {
      console.error('Failed to upload videos:', error);
      throw error;
    }
  }

  async function uploadSingleImage(slotIndex: number, file: File) {
    try {
      await saveMedia('image', slotIndex, file);
      const newUrl = URL.createObjectURL(file);
      setImageUrls((prevUrls) => {
        const newImageUrls = new Map(prevUrls);
        newImageUrls.set(slotIndex, newUrl);
        return newImageUrls;
      });
    } catch (error) {
      console.error('Failed to upload image:', error);
      throw error;
    }
  }

  async function uploadSingleVideo(slotIndex: number, file: File) {
    try {
      await saveMedia('video', slotIndex, file);
      const newUrl = URL.createObjectURL(file);
      setVideoUrls((prevUrls) => {
        const newVideoUrls = new Map(prevUrls);
        newVideoUrls.set(slotIndex, newUrl);
        return newVideoUrls;
      });
    } catch (error) {
      console.error('Failed to upload video:', error);
      throw error;
    }
  }

  async function uploadSong(file: File) {
    try {
      await saveMedia('song', 0, file);
      const newUrl = URL.createObjectURL(file);
      setSongUrl(newUrl);
    } catch (error) {
      console.error('Failed to upload song:', error);
      throw error;
    }
  }

  async function clearHeroBackground() {
    try {
      await clearAllMediaOfType('hero');
      setHeroBackgroundUrl(null);
    } catch (error) {
      console.error('Failed to clear hero background:', error);
      throw error;
    }
  }

  async function clearAllImages() {
    try {
      await clearAllMediaOfType('image');
      setImageUrls(new Map());
    } catch (error) {
      console.error('Failed to clear images:', error);
      throw error;
    }
  }

  async function clearAllVideos() {
    try {
      await clearAllMediaOfType('video');
      setVideoUrls(new Map());
    } catch (error) {
      console.error('Failed to clear videos:', error);
      throw error;
    }
  }

  async function clearSingleImage(slotIndex: number) {
    try {
      await clearMedia('image', slotIndex);
      setImageUrls((prevUrls) => {
        const newImageUrls = new Map(prevUrls);
        newImageUrls.delete(slotIndex);
        return newImageUrls;
      });
    } catch (error) {
      console.error('Failed to clear image:', error);
      throw error;
    }
  }

  async function clearSingleVideo(slotIndex: number) {
    try {
      await clearMedia('video', slotIndex);
      setVideoUrls((prevUrls) => {
        const newVideoUrls = new Map(prevUrls);
        newVideoUrls.delete(slotIndex);
        return newVideoUrls;
      });
    } catch (error) {
      console.error('Failed to clear video:', error);
      throw error;
    }
  }

  async function clearSong() {
    try {
      await clearAllMediaOfType('song');
      setSongUrl(null);
    } catch (error) {
      console.error('Failed to clear song:', error);
      throw error;
    }
  }

  function updateImageOrder(newOrder: number[]) {
    setImageOrder(newOrder);
    localStorage.setItem('imageOrder', JSON.stringify(newOrder));
  }

  function updateImageTransforms(newTransforms: Map<number, ImageTransform>) {
    setImageTransforms(newTransforms);
    localStorage.setItem('imageTransforms', JSON.stringify(Array.from(newTransforms.entries())));
  }

  async function batchPublish(changes: {
    hero?: File | 'clear';
    images: Map<number, File | 'clear'>;
    videos: Map<number, File | 'clear'>;
    song?: File | 'clear';
    imageOrder: number[];
    imageTransforms: Map<number, ImageTransform>;
  }) {
    try {
      // Step 1: Persist all changes to IndexedDB
      
      // Handle hero
      if (changes.hero === 'clear') {
        await clearAllMediaOfType('hero');
      } else if (changes.hero instanceof File) {
        await saveMedia('hero', 0, changes.hero);
      }

      // Handle images
      for (const [slotIndex, fileOrClear] of changes.images.entries()) {
        if (fileOrClear === 'clear') {
          await clearMedia('image', slotIndex);
        } else if (fileOrClear instanceof File) {
          await saveMedia('image', slotIndex, fileOrClear);
        }
      }

      // Handle videos
      for (const [slotIndex, fileOrClear] of changes.videos.entries()) {
        if (fileOrClear === 'clear') {
          await clearMedia('video', slotIndex);
        } else if (fileOrClear instanceof File) {
          await saveMedia('video', slotIndex, fileOrClear);
        }
      }

      // Handle song
      if (changes.song === 'clear') {
        await clearAllMediaOfType('song');
      } else if (changes.song instanceof File) {
        await saveMedia('song', 0, changes.song);
      }

      // Step 2: Refresh from backend to get published URLs
      await refreshFromBackend();

      // Update order and transforms
      updateImageOrder(changes.imageOrder);
      updateImageTransforms(changes.imageTransforms);

    } catch (error) {
      console.error('Batch publish failed:', error);
      throw error;
    }
  }

  return (
    <MediaStoreContext.Provider
      value={{
        heroBackgroundUrl,
        imageUrls,
        videoUrls,
        songUrl,
        imageOrder,
        imageTransforms,
        isLoading,
        uploadHeroBackground,
        uploadImages,
        uploadVideos,
        uploadSingleImage,
        uploadSingleVideo,
        uploadSong,
        clearHeroBackground,
        clearAllImages,
        clearAllVideos,
        clearSingleImage,
        clearSingleVideo,
        clearSong,
        updateImageOrder,
        updateImageTransforms,
        batchPublish,
        refreshFromBackend,
      }}
    >
      {children}
    </MediaStoreContext.Provider>
  );
}

export function useMediaStore() {
  const context = useContext(MediaStoreContext);
  if (!context) {
    throw new Error('useMediaStore must be used within MediaStoreProvider');
  }
  return context;
}
