import { ExternalBlob } from '../backend';
import type { PublishedMedia } from '../backend';
import type { backendInterface } from '../backend';

export interface PublishMediaParams {
  actor: backendInterface;
  hero?: File | 'clear';
  images: Map<number, File | 'clear'>;
  videos: Map<number, File | 'clear'>;
  song?: File | 'clear';
  onProgress?: (type: string, index: number, percentage: number) => void;
}

export interface MediaAvailability {
  local: {
    hero: boolean;
    images: number;
    videos: number;
    song: boolean;
  };
  backend: {
    hero: boolean;
    images: number;
    videos: number;
    song: boolean;
  };
}

/**
 * Upload media changes to backend published storage
 */
export async function publishMediaToBackend(params: PublishMediaParams): Promise<void> {
  const { actor, hero, images, videos, song, onProgress } = params;

  try {
    // Handle hero background
    if (hero === 'clear') {
      await actor.clearHeroBackground();
    } else if (hero instanceof File) {
      const bytes = new Uint8Array(await hero.arrayBuffer());
      let blob = ExternalBlob.fromBytes(bytes);
      
      if (onProgress) {
        blob = blob.withUploadProgress((percentage) => onProgress('hero', 0, percentage));
      }
      
      await actor.setHeroBackground(blob);
    }

    // Handle images
    for (const [slotIndex, fileOrClear] of images.entries()) {
      if (fileOrClear === 'clear') {
        await actor.clearImage(BigInt(slotIndex));
      } else if (fileOrClear instanceof File) {
        const bytes = new Uint8Array(await fileOrClear.arrayBuffer());
        let blob = ExternalBlob.fromBytes(bytes);
        
        if (onProgress) {
          blob = blob.withUploadProgress((percentage) => onProgress('image', slotIndex, percentage));
        }
        
        await actor.setImage(BigInt(slotIndex), fileOrClear.name, blob);
      }
    }

    // Handle videos
    for (const [slotIndex, fileOrClear] of videos.entries()) {
      if (fileOrClear === 'clear') {
        await actor.clearVideo(BigInt(slotIndex));
      } else if (fileOrClear instanceof File) {
        const bytes = new Uint8Array(await fileOrClear.arrayBuffer());
        let blob = ExternalBlob.fromBytes(bytes);
        
        if (onProgress) {
          blob = blob.withUploadProgress((percentage) => onProgress('video', slotIndex, percentage));
        }
        
        await actor.setVideo(BigInt(slotIndex), fileOrClear.name, blob);
      }
    }

    // Handle background song
    if (song === 'clear') {
      await actor.clearBackgroundSong();
    } else if (song instanceof File) {
      const bytes = new Uint8Array(await song.arrayBuffer());
      let blob = ExternalBlob.fromBytes(bytes);
      
      if (onProgress) {
        blob = blob.withUploadProgress((percentage) => onProgress('song', 0, percentage));
      }
      
      await actor.setBackgroundSong(blob);
    }
  } catch (error) {
    console.error('Backend publish failed:', error);
    throw new Error('Failed to publish media to backend: ' + (error instanceof Error ? error.message : String(error)));
  }
}

/**
 * Fetch published media from backend and convert to renderable URLs
 */
export async function fetchPublishedMedia(actor: backendInterface): Promise<{
  heroUrl: string | null;
  imageUrls: Map<number, string>;
  videoUrls: Map<number, string>;
  songUrl: string | null;
}> {
  try {
    const published = await actor.getPublishedMedia();
    
    // Map backend indices (0-based arrays) to UI indices (1-based)
    const imageUrls = new Map<number, string>();
    published.images.forEach((item, arrayIndex) => {
      if (item !== null) {
        const slotIndex = arrayIndex + 1; // Convert 0-based to 1-based
        imageUrls.set(slotIndex, item[1].getDirectURL());
      }
    });

    const videoUrls = new Map<number, string>();
    published.videos.forEach((item, arrayIndex) => {
      if (item !== null) {
        const slotIndex = arrayIndex + 1; // Convert 0-based to 1-based
        videoUrls.set(slotIndex, item[1].getDirectURL());
      }
    });
    
    return {
      heroUrl: published.heroBackground ? published.heroBackground.getDirectURL() : null,
      imageUrls,
      videoUrls,
      songUrl: published.backgroundSong ? published.backgroundSong.getDirectURL() : null,
    };
  } catch (error) {
    console.error('Failed to fetch published media:', error);
    return {
      heroUrl: null,
      imageUrls: new Map(),
      videoUrls: new Map(),
      songUrl: null,
    };
  }
}

/**
 * Get availability counts for diagnostics
 */
export function getMediaAvailability(
  localHero: boolean,
  localImages: number,
  localVideos: number,
  localSong: boolean,
  backendHero: boolean,
  backendImages: number,
  backendVideos: number,
  backendSong: boolean
): MediaAvailability {
  return {
    local: {
      hero: localHero,
      images: localImages,
      videos: localVideos,
      song: localSong,
    },
    backend: {
      hero: backendHero,
      images: backendImages,
      videos: backendVideos,
      song: backendSong,
    },
  };
}
