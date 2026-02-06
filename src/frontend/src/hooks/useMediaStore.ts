import { useMediaStore as useMediaStoreContext } from '../context/MediaStoreContext';

export function useMediaStore() {
  return useMediaStoreContext();
}
