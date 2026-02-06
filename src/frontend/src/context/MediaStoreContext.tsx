import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { getAllMediaOfType, saveMedia, clearAllMediaOfType, clearMedia } from '../lib/localMediaStore';
import { useActor } from '../hooks/useActor';
import { fetchPublishedMedia, getMediaAvailability } from '../lib/publishedMediaClient';
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

  // Track which URLs are blob: URLs (need cleanup) vs direct URLs (no cleanup)
  const blobUrlsRef = useRef<Set<string>>(new Set());
  const diagnosticLoggedRef = useRef(false);

  // Cleanup blob: URLs ONLY on unmount
  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach((url) => {
        if (url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
      blobUrlsRef.current.clear();
    };
  }, []);

  // Load persisted media on mount
  useEffect(() => {
    if (!actorFetching && actor) {
      loadAllMedia();
    }
  }, [actorFetching, actor]);

  async function loadAllMedia() {
    setIsLoading(true);
    try {
      // Step 1: Load from IndexedDB first (fast, for draft mode)
      const heroBlob = await getAllMediaOfType('hero');
      const imageBlobs = await getAllMediaOfType('image');
      const videoBlobs = await getAllMediaOfType('video');
      const songBlob = await getAllMediaOfType('song');

      const localHeroExists = heroBlob.has(0);
      const localImageCount = imageBlobs.size;
      const localVideoCount = videoBlobs.size;
      const localSongExists = songBlob.has(0);

      // Create object URLs from local blobs
      let newHeroUrl: string | null = null;
      const newImageUrls = new Map<number, string>();
      const newVideoUrls = new Map<number, string>();
      let newSongUrl: string | null = null;

      if (localHeroExists) {
        newHeroUrl = URL.createObjectURL(heroBlob.get(0)!);
        blobUrlsRef.current.add(newHeroUrl);
      }

      imageBlobs.forEach((blob, index) => {
        if (index >= 1 && index <= 43) {
          const url = URL.createObjectURL(blob);
          newImageUrls.set(index, url);
          blobUrlsRef.current.add(url);
        }
      });

      videoBlobs.forEach((blob, index) => {
        if (index >= 1 && index <= 6) {
          const url = URL.createObjectURL(blob);
          newVideoUrls.set(index, url);
          blobUrlsRef.current.add(url);
        }
      });

      if (localSongExists) {
        newSongUrl = URL.createObjectURL(songBlob.get(0)!);
        blobUrlsRef.current.add(newSongUrl);
      }

      // Step 2: Fetch backend published media as fallback
      let backendMedia = {
        heroUrl: null as string | null,
        imageUrls: new Map<number, string>(),
        videoUrls: new Map<number, string>(),
        songUrl: null as string | null,
      };

      if (actor) {
        try {
          backendMedia = await fetchPublishedMedia(actor);
        } catch (error) {
          console.error('Failed to fetch backend published media:', error);
        }
      }

      // Step 3: Merge local and backend (prefer local for draft, fallback to backend)
      if (!newHeroUrl && backendMedia.heroUrl) {
        newHeroUrl = backendMedia.heroUrl;
      }

      backendMedia.imageUrls.forEach((url, index) => {
        if (!newImageUrls.has(index)) {
          newImageUrls.set(index, url);
        }
      });

      backendMedia.videoUrls.forEach((url, index) => {
        if (!newVideoUrls.has(index)) {
          newVideoUrls.set(index, url);
        }
      });

      if (!newSongUrl && backendMedia.songUrl) {
        newSongUrl = backendMedia.songUrl;
      }

      // Update state
      setHeroBackgroundUrl(newHeroUrl);
      setImageUrls(newImageUrls);
      setVideoUrls(newVideoUrls);
      setSongUrl(newSongUrl);

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
        const availability = getMediaAvailability(
          localHeroExists,
          localImageCount,
          localVideoCount,
          localSongExists,
          !!backendMedia.heroUrl,
          backendMedia.imageUrls.size,
          backendMedia.videoUrls.size,
          !!backendMedia.songUrl
        );

        console.log('Media Store Initialized:', {
          local: availability.local,
          backend: availability.backend,
          merged: {
            hero: !!newHeroUrl,
            images: newImageUrls.size,
            videos: newVideoUrls.size,
            song: !!newSongUrl,
          },
        });

        diagnosticLoggedRef.current = true;
      }
    } catch (error) {
      console.error('Failed to load media:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function uploadHeroBackground(file: File) {
    try {
      await saveMedia('hero', 0, file);
      setHeroBackgroundUrl((prev) => {
        if (prev && blobUrlsRef.current.has(prev)) {
          URL.revokeObjectURL(prev);
          blobUrlsRef.current.delete(prev);
        }
        const newUrl = URL.createObjectURL(file);
        blobUrlsRef.current.add(newUrl);
        return newUrl;
      });
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
          
          const oldUrl = newImageUrls.get(slotIndex);
          if (oldUrl && blobUrlsRef.current.has(oldUrl)) {
            URL.revokeObjectURL(oldUrl);
            blobUrlsRef.current.delete(oldUrl);
          }
          
          const newUrl = URL.createObjectURL(files[i]);
          newImageUrls.set(slotIndex, newUrl);
          blobUrlsRef.current.add(newUrl);
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
          
          const oldUrl = newVideoUrls.get(slotIndex);
          if (oldUrl && blobUrlsRef.current.has(oldUrl)) {
            URL.revokeObjectURL(oldUrl);
            blobUrlsRef.current.delete(oldUrl);
          }
          
          const newUrl = URL.createObjectURL(files[i]);
          newVideoUrls.set(slotIndex, newUrl);
          blobUrlsRef.current.add(newUrl);
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

      setImageUrls((prevUrls) => {
        const newImageUrls = new Map(prevUrls);
        
        const oldUrl = newImageUrls.get(slotIndex);
        if (oldUrl && blobUrlsRef.current.has(oldUrl)) {
          URL.revokeObjectURL(oldUrl);
          blobUrlsRef.current.delete(oldUrl);
        }
        
        const newUrl = URL.createObjectURL(file);
        newImageUrls.set(slotIndex, newUrl);
        blobUrlsRef.current.add(newUrl);
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

      setVideoUrls((prevUrls) => {
        const newVideoUrls = new Map(prevUrls);
        
        const oldUrl = newVideoUrls.get(slotIndex);
        if (oldUrl && blobUrlsRef.current.has(oldUrl)) {
          URL.revokeObjectURL(oldUrl);
          blobUrlsRef.current.delete(oldUrl);
        }
        
        const newUrl = URL.createObjectURL(file);
        newVideoUrls.set(slotIndex, newUrl);
        blobUrlsRef.current.add(newUrl);
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
      setSongUrl((prev) => {
        if (prev && blobUrlsRef.current.has(prev)) {
          URL.revokeObjectURL(prev);
          blobUrlsRef.current.delete(prev);
        }
        const newUrl = URL.createObjectURL(file);
        blobUrlsRef.current.add(newUrl);
        return newUrl;
      });
    } catch (error) {
      console.error('Failed to upload song:', error);
      throw error;
    }
  }

  async function clearHeroBackground() {
    try {
      await clearAllMediaOfType('hero');
      setHeroBackgroundUrl((prev) => {
        if (prev && blobUrlsRef.current.has(prev)) {
          URL.revokeObjectURL(prev);
          blobUrlsRef.current.delete(prev);
        }
        return null;
      });
    } catch (error) {
      console.error('Failed to clear hero background:', error);
      throw error;
    }
  }

  async function clearAllImages() {
    try {
      await clearAllMediaOfType('image');
      setImageUrls((prevUrls) => {
        prevUrls.forEach((url) => {
          if (blobUrlsRef.current.has(url)) {
            URL.revokeObjectURL(url);
            blobUrlsRef.current.delete(url);
          }
        });
        return new Map();
      });
    } catch (error) {
      console.error('Failed to clear images:', error);
      throw error;
    }
  }

  async function clearAllVideos() {
    try {
      await clearAllMediaOfType('video');
      setVideoUrls((prevUrls) => {
        prevUrls.forEach((url) => {
          if (blobUrlsRef.current.has(url)) {
            URL.revokeObjectURL(url);
            blobUrlsRef.current.delete(url);
          }
        });
        return new Map();
      });
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
        const url = newImageUrls.get(slotIndex);
        if (url && blobUrlsRef.current.has(url)) {
          URL.revokeObjectURL(url);
          blobUrlsRef.current.delete(url);
        }
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
        const url = newVideoUrls.get(slotIndex);
        if (url && blobUrlsRef.current.has(url)) {
          URL.revokeObjectURL(url);
          blobUrlsRef.current.delete(url);
        }
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
      setSongUrl((prev) => {
        if (prev && blobUrlsRef.current.has(prev)) {
          URL.revokeObjectURL(prev);
          blobUrlsRef.current.delete(prev);
        }
        return null;
      });
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

      // Step 2: Re-read persisted blobs and update live state atomically
      
      // Clean up old blob URLs
      if (heroBackgroundUrl && blobUrlsRef.current.has(heroBackgroundUrl)) {
        URL.revokeObjectURL(heroBackgroundUrl);
        blobUrlsRef.current.delete(heroBackgroundUrl);
      }
      imageUrls.forEach((url) => {
        if (blobUrlsRef.current.has(url)) {
          URL.revokeObjectURL(url);
          blobUrlsRef.current.delete(url);
        }
      });
      videoUrls.forEach((url) => {
        if (blobUrlsRef.current.has(url)) {
          URL.revokeObjectURL(url);
          blobUrlsRef.current.delete(url);
        }
      });
      if (songUrl && blobUrlsRef.current.has(songUrl)) {
        URL.revokeObjectURL(songUrl);
        blobUrlsRef.current.delete(songUrl);
      }

      // Re-read hero from IndexedDB
      const heroBlob = await getAllMediaOfType('hero');
      const newHeroUrl = heroBlob.has(0) ? URL.createObjectURL(heroBlob.get(0)!) : null;
      if (newHeroUrl) blobUrlsRef.current.add(newHeroUrl);

      // Re-read images from IndexedDB
      const imageBlobs = await getAllMediaOfType('image');
      const newImageUrls = new Map<number, string>();
      imageBlobs.forEach((blob, index) => {
        if (index >= 1 && index <= 43) {
          const url = URL.createObjectURL(blob);
          newImageUrls.set(index, url);
          blobUrlsRef.current.add(url);
        }
      });

      // Re-read videos from IndexedDB
      const videoBlobs = await getAllMediaOfType('video');
      const newVideoUrls = new Map<number, string>();
      videoBlobs.forEach((blob, index) => {
        if (index >= 1 && index <= 6) {
          const url = URL.createObjectURL(blob);
          newVideoUrls.set(index, url);
          blobUrlsRef.current.add(url);
        }
      });

      // Re-read song from IndexedDB
      const songBlob = await getAllMediaOfType('song');
      const newSongUrl = songBlob.has(0) ? URL.createObjectURL(songBlob.get(0)!) : null;
      if (newSongUrl) blobUrlsRef.current.add(newSongUrl);

      // Update all state atomically
      setHeroBackgroundUrl(newHeroUrl);
      setImageUrls(newImageUrls);
      setVideoUrls(newVideoUrls);
      setSongUrl(newSongUrl);

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
