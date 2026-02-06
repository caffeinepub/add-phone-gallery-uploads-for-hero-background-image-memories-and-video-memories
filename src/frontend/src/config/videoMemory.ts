// Video memory configuration
// Videos can be updated in two ways:
// 1. In-app: Use the "Media" button to upload from your phone gallery
// 2. File replacement: Place video files in frontend/public/ with matching filenames (e.g., video1.mp4)
// The app will use uploaded media when available, otherwise fall back to placeholder files.

export interface VideoMemoryItem {
  id: number;
  videoSrc: string;
}

export const videoMemoryData: VideoMemoryItem[] = [
  { id: 1, videoSrc: '/video1.mp4' }, // Fallback placeholder path
  { id: 2, videoSrc: '/video2.mp4' },
  { id: 3, videoSrc: '/video3.mp4' },
  { id: 4, videoSrc: '/video4.mp4' },
  { id: 5, videoSrc: '/video5.mp4' },
  { id: 6, videoSrc: '/video6.mp4' },
];
