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
 * Safely unwrap optional values that may be represented as undefined, null, or [] | [T]
 */
function unwrapOptional<T>(value: T | undefined | null | [] | [T]): T | null {
  if (value === undefined || value === null) {
    return null;
  }
  if (Array.isArray(value)) {
    return value.length > 0 ? (value[0] ?? null) : null;
  }
  return value;
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

    // Handle images - convert UI slot (1-based) to backend index (0-based)
    for (const [slotIndex, fileOrClear] of images.entries()) {
      // Validate slot range
      if (slotIndex < 1 || slotIndex > 43) {
        throw new Error(`Invalid image slot ${slotIndex}. Must be between 1 and 43.`);
      }
      
      const backendIndex = slotIndex - 1; // Convert to 0-based
      
      if (fileOrClear === 'clear') {
        await actor.clearImage(BigInt(backendIndex));
      } else if (fileOrClear instanceof File) {
        const bytes = new Uint8Array(await fileOrClear.arrayBuffer());
        let blob = ExternalBlob.fromBytes(bytes);
        
        if (onProgress) {
          blob = blob.withUploadProgress((percentage) => onProgress('image', slotIndex, percentage));
        }
        
        await actor.setImage(BigInt(backendIndex), fileOrClear.name, blob);
      }
    }

    // Handle videos - convert UI slot (1-based) to backend index (0-based)
    for (const [slotIndex, fileOrClear] of videos.entries()) {
      // Validate slot range
      if (slotIndex < 1 || slotIndex > 6) {
        throw new Error(`Invalid video slot ${slotIndex}. Must be between 1 and 6.`);
      }
      
      const backendIndex = slotIndex - 1; // Convert to 0-based
      
      if (fileOrClear === 'clear') {
        await actor.clearVideo(BigInt(backendIndex));
      } else if (fileOrClear instanceof File) {
        const bytes = new Uint8Array(await fileOrClear.arrayBuffer());
        let blob = ExternalBlob.fromBytes(bytes);
        
        if (onProgress) {
          blob = blob.withUploadProgress((percentage) => onProgress('video', slotIndex, percentage));
        }
        
        await actor.setVideo(BigInt(backendIndex), fileOrClear.name, blob);
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
    throw error;
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
    
    // Safely unwrap optional hero background
    const heroBlob = unwrapOptional(published.heroBackground);
    const heroUrl = heroBlob && heroBlob instanceof ExternalBlob ? heroBlob.getDirectURL() : null;
    
    // Map backend indices (0-based arrays) to UI slots (1-based)
    const imageUrls = new Map<number, string>();
    if (Array.isArray(published.images)) {
      published.images.forEach((item, arrayIndex) => {
        // Handle both null and undefined, and unwrap if it's an array-style optional
        const unwrapped = unwrapOptional(item);
        if (unwrapped !== null && Array.isArray(unwrapped) && unwrapped.length === 2) {
          const [_name, blob] = unwrapped;
          if (blob && blob instanceof ExternalBlob) {
            const slotIndex = arrayIndex + 1; // Convert 0-based to 1-based
            imageUrls.set(slotIndex, blob.getDirectURL());
          }
        }
      });
    }

    const videoUrls = new Map<number, string>();
    if (Array.isArray(published.videos)) {
      published.videos.forEach((item, arrayIndex) => {
        // Handle both null and undefined, and unwrap if it's an array-style optional
        const unwrapped = unwrapOptional(item);
        if (unwrapped !== null && Array.isArray(unwrapped) && unwrapped.length === 2) {
          const [_name, blob] = unwrapped;
          if (blob && blob instanceof ExternalBlob) {
            const slotIndex = arrayIndex + 1; // Convert 0-based to 1-based
            videoUrls.set(slotIndex, blob.getDirectURL());
          }
        }
      });
    }
    
    // Safely unwrap optional background song
    const songBlob = unwrapOptional(published.backgroundSong);
    const songUrl = songBlob && songBlob instanceof ExternalBlob ? songBlob.getDirectURL() : null;
    
    return {
      heroUrl,
      imageUrls,
      videoUrls,
      songUrl,
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
