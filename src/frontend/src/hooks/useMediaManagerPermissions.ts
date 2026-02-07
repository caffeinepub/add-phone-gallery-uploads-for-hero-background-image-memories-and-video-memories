import { useQuery } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useInternetIdentity } from './useInternetIdentity';

export interface MediaManagerPermissions {
  isAdmin: boolean;
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

  const isAdmin = isAdminQuery.data ?? false;
  const isLoading = actorFetching || isAdminQuery.isLoading;
  const isAuthenticated = !!identity;

  return {
    isAdmin,
    canEditHero: isAuthenticated, // All authenticated users can edit Hero
    canEditImages: isAuthenticated, // All authenticated users can edit Images
    canEditVideos: isAuthenticated, // All authenticated users can edit Videos
    canEditSong: isAuthenticated, // All authenticated users can edit Song
    isLoading,
  };
}
