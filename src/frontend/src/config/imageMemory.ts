import { romanticMessages } from './romanticMessages';

// Image memory configuration
// Images can be updated in two ways:
// 1. In-app: Use the "Media" button to upload from your phone gallery
// 2. File replacement: Place image files in frontend/public/ with matching filenames (e.g., image1.jpg)
// The app will use uploaded media when available, otherwise fall back to placeholder files.

export interface ImageMemoryItem {
  id: number;
  imageSrc: string;
  message: string;
}

export const imageMemoryData: ImageMemoryItem[] = Array.from({ length: 43 }, (_, i) => ({
  id: i + 1,
  imageSrc: `/image${i + 1}.jpg`, // Fallback placeholder path
  message: romanticMessages[i % romanticMessages.length],
}));

// To add unlimited images, simply duplicate this pattern:
// {
//   id: 44,
//   imageSrc: '/image44.jpg',
//   message: romanticMessages[0], // or any message from the list
// },
