import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';

export interface MediaManagerPermissions {
  isAdmin: boolean;
  isImageUploader: boolean;
  canEditHero: boolean;
  canEditImages: boolean;
  canEditVideos: boolean;
  canEditSong: boolean;
  isLoading: boolean;
}

export function useMediaManagerPermissions(): MediaManagerPermissions {
  const { actor, isFetching: actorFetching } = useActor();
  const { identity } = useInternetIdentity();

  const isAdminQuery = useQuery<boolean>({
    queryKey: ['isCallerAdmin', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
  });

  const hasImageUploaderAccessQuery = useQuery<boolean>({
    queryKey: ['hasImageUploaderAccess', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return false;
      return actor.hasImageUploaderAccess(identity.getPrincipal());
    },
    enabled: !!actor && !actorFetching && !!identity,
    retry: false,
  });

  const isAdmin = isAdminQuery.data ?? false;
  const isImageUploader = hasImageUploaderAccessQuery.data ?? false;
  const isLoading = actorFetching || isAdminQuery.isLoading || hasImageUploaderAccessQuery.isLoading;

  return {
    isAdmin,
    isImageUploader,
    canEditHero: isAdmin,
    canEditImages: true, // Images are now editable by everyone
    canEditVideos: isAdmin,
    canEditSong: isAdmin,
    isLoading,
  };
}
