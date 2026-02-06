import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { getAllMediaOfType, saveMedia, clearAllMediaOfType, clearMedia } from '../lib/localMediaStore';
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
  const [heroBackgroundUrl, setHeroBackgroundUrl] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<Map<number, string>>(new Map());
  const [videoUrls, setVideoUrls] = useState<Map<number, string>>(new Map());
  const [songUrl, setSongUrl] = useState<string | null>(null);
  const [imageOrder, setImageOrder] = useState<number[]>(Array.from({ length: 43 }, (_, i) => i + 1));
  const [imageTransforms, setImageTransforms] = useState<Map<number, ImageTransform>>(new Map());
  const [isLoading, setIsLoading] = useState(true);

  // Use refs to track current URLs for cleanup on unmount only
  const heroUrlRef = useRef<string | null>(null);
  const imageUrlsRef = useRef<Map<number, string>>(new Map());
  const videoUrlsRef = useRef<Map<number, string>>(new Map());
  const songUrlRef = useRef<string | null>(null);

  // Update refs whenever state changes
  useEffect(() => {
    heroUrlRef.current = heroBackgroundUrl;
  }, [heroBackgroundUrl]);

  useEffect(() => {
    imageUrlsRef.current = imageUrls;
  }, [imageUrls]);

  useEffect(() => {
    videoUrlsRef.current = videoUrls;
  }, [videoUrls]);

  useEffect(() => {
    songUrlRef.current = songUrl;
  }, [songUrl]);

  // Load persisted media on mount
  useEffect(() => {
    loadAllMedia();
  }, []);

  // Cleanup object URLs ONLY on unmount
  useEffect(() => {
    return () => {
      if (heroUrlRef.current) URL.revokeObjectURL(heroUrlRef.current);
      imageUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      videoUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      if (songUrlRef.current) URL.revokeObjectURL(songUrlRef.current);
    };
  }, []);

  async function loadAllMedia() {
    setIsLoading(true);
    try {
      // Load hero background
      const heroBlob = await getAllMediaOfType('hero');
      if (heroBlob.has(0)) {
        const url = URL.createObjectURL(heroBlob.get(0)!);
        setHeroBackgroundUrl(url);
      }

      // Load images
      const imageBlobs = await getAllMediaOfType('image');
      const imageUrlMap = new Map<number, string>();
      imageBlobs.forEach((blob, index) => {
        imageUrlMap.set(index, URL.createObjectURL(blob));
      });
      setImageUrls(imageUrlMap);

      // Load videos
      const videoBlobs = await getAllMediaOfType('video');
      const videoUrlMap = new Map<number, string>();
      videoBlobs.forEach((blob, index) => {
        videoUrlMap.set(index, URL.createObjectURL(blob));
      });
      setVideoUrls(videoUrlMap);

      // Load song
      const songBlob = await getAllMediaOfType('song');
      if (songBlob.has(0)) {
        const url = URL.createObjectURL(songBlob.get(0)!);
        setSongUrl(url);
      }

      // Load image order and transforms from localStorage
      const savedOrder = localStorage.getItem('imageOrder');
      if (savedOrder) {
        setImageOrder(JSON.parse(savedOrder));
      }

      const savedTransforms = localStorage.getItem('imageTransforms');
      if (savedTransforms) {
        const transformsArray = JSON.parse(savedTransforms) as [number, ImageTransform][];
        setImageTransforms(new Map(transformsArray));
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
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
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
          
          if (newImageUrls.has(slotIndex)) {
            URL.revokeObjectURL(newImageUrls.get(slotIndex)!);
          }
          
          newImageUrls.set(slotIndex, URL.createObjectURL(files[i]));
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
          
          if (newVideoUrls.has(slotIndex)) {
            URL.revokeObjectURL(newVideoUrls.get(slotIndex)!);
          }
          
          newVideoUrls.set(slotIndex, URL.createObjectURL(files[i]));
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
        
        if (newImageUrls.has(slotIndex)) {
          URL.revokeObjectURL(newImageUrls.get(slotIndex)!);
        }
        
        newImageUrls.set(slotIndex, URL.createObjectURL(file));
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
        
        if (newVideoUrls.has(slotIndex)) {
          URL.revokeObjectURL(newVideoUrls.get(slotIndex)!);
        }
        
        newVideoUrls.set(slotIndex, URL.createObjectURL(file));
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
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
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
        if (prev) URL.revokeObjectURL(prev);
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
        prevUrls.forEach((url) => URL.revokeObjectURL(url));
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
        prevUrls.forEach((url) => URL.revokeObjectURL(url));
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
        if (newImageUrls.has(slotIndex)) {
          URL.revokeObjectURL(newImageUrls.get(slotIndex)!);
          newImageUrls.delete(slotIndex);
        }
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
        if (newVideoUrls.has(slotIndex)) {
          URL.revokeObjectURL(newVideoUrls.get(slotIndex)!);
          newVideoUrls.delete(slotIndex);
        }
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
        if (prev) URL.revokeObjectURL(prev);
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

      // Step 2: Update all live state atomically using functional updates
      
      // Update hero
      if (changes.hero === 'clear') {
        setHeroBackgroundUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
      } else if (changes.hero instanceof File) {
        setHeroBackgroundUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(changes.hero as File);
        });
      }

      // Update images
      setImageUrls((prevUrls) => {
        const newImageUrls = new Map(prevUrls);
        
        for (const [slotIndex, fileOrClear] of changes.images.entries()) {
          if (newImageUrls.has(slotIndex)) {
            URL.revokeObjectURL(newImageUrls.get(slotIndex)!);
          }
          
          if (fileOrClear === 'clear') {
            newImageUrls.delete(slotIndex);
          } else if (fileOrClear instanceof File) {
            newImageUrls.set(slotIndex, URL.createObjectURL(fileOrClear));
          }
        }
        
        return newImageUrls;
      });

      // Update videos
      setVideoUrls((prevUrls) => {
        const newVideoUrls = new Map(prevUrls);
        
        for (const [slotIndex, fileOrClear] of changes.videos.entries()) {
          if (newVideoUrls.has(slotIndex)) {
            URL.revokeObjectURL(newVideoUrls.get(slotIndex)!);
          }
          
          if (fileOrClear === 'clear') {
            newVideoUrls.delete(slotIndex);
          } else if (fileOrClear instanceof File) {
            newVideoUrls.set(slotIndex, URL.createObjectURL(fileOrClear));
          }
        }
        
        return newVideoUrls;
      });

      // Update song
      if (changes.song === 'clear') {
        setSongUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return null;
        });
      } else if (changes.song instanceof File) {
        setSongUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return URL.createObjectURL(changes.song as File);
        });
      }

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
