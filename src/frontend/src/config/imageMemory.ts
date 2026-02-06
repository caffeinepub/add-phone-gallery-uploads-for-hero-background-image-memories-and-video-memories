import { romanticMessages } from './romanticMessages';

// Image memory configuration
// Images are uploaded via the in-app Media Manager.
// Empty slots will show an explicit empty state with no placeholder fallback.

export interface ImageMemoryItem {
  id: number;
  message: string;
}

export const imageMemoryData: ImageMemoryItem[] = Array.from({ length: 43 }, (_, i) => ({
  id: i + 1,
  message: romanticMessages[i % romanticMessages.length],
}));
