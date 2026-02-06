import { useState, useCallback } from 'react';
import { useActor } from './useActor';
import { useMediaStore } from './useMediaStore';
import type { PrePublishConfig } from '../backend';
import { normalizeToDiagnostic, type DiagnosticPayload } from '../lib/deployDiagnostics';
import { publishMediaToBackend } from '../lib/publishedMediaClient';
import { logSubmitDiagnostic, type SubmitDiagnostic } from '../lib/mediaDiagnostics';
import type { ImageTransform } from './useMediaDraft';

export type PublishStatus = 'idle' | 'running' | 'succeeded' | 'failed';

export interface PublishResult {
  success: boolean;
  diagnostic?: DiagnosticPayload;
}

export interface PublishChanges {
  hero?: File | 'clear';
  images: Map<number, File | 'clear'>;
  videos: Map<number, File | 'clear'>;
  song?: File | 'clear';
  imageOrder: number[];
  imageTransforms: Map<number, ImageTransform>;
}

export interface UsePublishWithPrecheckReturn {
  status: PublishStatus;
  error: DiagnosticPayload | null;
  runPrecheck: (config: PrePublishConfig) => Promise<PublishResult>;
  publish: (changes: PublishChanges) => Promise<PublishResult>;
  reset: () => void;
}

/**
 * Translate backend errors into user-friendly English messages
 */
function translateBackendError(error: unknown): { title: string; message: string; details?: string } {
  const errorStr = String(error);
  const errorMessage = error instanceof Error ? error.message : errorStr;

  // Check for authorization errors
  if (errorMessage.includes('Unauthorized') || errorMessage.includes('Only admins')) {
    return {
      title: 'Permission Denied',
      message: 'You do not have permission to perform this action. Administrator access is required.',
      details: errorMessage,
    };
  }

  // Check for invalid index errors
  if (errorMessage.includes('Invalid image index')) {
    return {
      title: 'Invalid Image Slot',
      message: 'An image was assigned to an invalid slot number. Please try again or contact support.',
      details: errorMessage,
    };
  }

  if (errorMessage.includes('Invalid video index')) {
    return {
      title: 'Invalid Video Slot',
      message: 'A video was assigned to an invalid slot number. Please try again or contact support.',
      details: errorMessage,
    };
  }

  // Check for network/connection errors
  if (errorMessage.includes('fetch') || errorMessage.includes('network') || errorMessage.includes('NetworkError')) {
    return {
      title: 'Network Error',
      message: 'Unable to connect to the backend. Please check your internet connection and try again.',
      details: errorMessage,
    };
  }

  // Check for actor initialization errors
  if (errorMessage.includes('actor') || errorMessage.includes('Actor not')) {
    return {
      title: 'Backend Connection Error',
      message: 'The backend service is not ready. Please refresh the page and try again.',
      details: errorMessage,
    };
  }

  // Generic backend error
  return {
    title: 'Publish Failed',
    message: 'An error occurred while publishing your media. Please try again.',
    details: errorMessage,
  };
}

export function usePublishWithPrecheck(): UsePublishWithPrecheckReturn {
  const { actor } = useActor();
  const { batchPublish } = useMediaStore();
  const [status, setStatus] = useState<PublishStatus>('idle');
  const [error, setError] = useState<DiagnosticPayload | null>(null);

  const runPrecheck = useCallback(
    async (config: PrePublishConfig): Promise<PublishResult> => {
      const step = 'Pre-publish check';

      try {
        if (!actor) {
          const diagnostic = normalizeToDiagnostic(
            new Error('Backend actor not initialized'),
            step
          );
          return { success: false, diagnostic };
        }

        const result = await actor.prePublishCheck(config);

        if (result.__kind__ === 'failed') {
          const diagnostic: DiagnosticPayload = {
            message: result.failed.reason,
            details: result.failed.details,
            step,
          };
          return { success: false, diagnostic };
        }

        return { success: true };
      } catch (err) {
        const diagnostic = normalizeToDiagnostic(err, step);
        return { success: false, diagnostic };
      }
    },
    [actor]
  );

  const publish = useCallback(
    async (changes: PublishChanges): Promise<PublishResult> => {
      setStatus('running');
      setError(null);

      try {
        // Step 1: Run pre-publish check
        const precheckConfig: PrePublishConfig = {
          frontendBuildFailed: false,
          missingArtifacts: false,
          misconfiguredCanister: false,
        };

        const precheckResult = await runPrecheck(precheckConfig);
        if (!precheckResult.success) {
          setStatus('failed');
          setError(precheckResult.diagnostic!);
          return precheckResult;
        }

        // Step 2: Upload to backend
        const backendPublishStep = 'Backend media publish';
        try {
          if (!actor) {
            throw new Error('Backend actor not initialized');
          }

          await publishMediaToBackend({
            actor,
            hero: changes.hero,
            images: changes.images,
            videos: changes.videos,
            song: changes.song,
          });
        } catch (err) {
          // Translate backend error to user-friendly message
          const translated = translateBackendError(err);
          const diagnostic: DiagnosticPayload = {
            message: translated.title,
            details: translated.details,
            step: backendPublishStep,
          };
          setStatus('failed');
          setError(diagnostic);
          return { success: false, diagnostic };
        }

        // Step 3: Persist draft to IndexedDB and update live state
        const persistStep = 'Persist and apply changes';
        try {
          await batchPublish(changes);
        } catch (err) {
          const diagnostic = normalizeToDiagnostic(err, persistStep);
          setStatus('failed');
          setError(diagnostic);
          return { success: false, diagnostic };
        }

        // Step 4: Record deployment to backend
        const recordStep = 'Record deployment';
        try {
          if (!actor) {
            throw new Error('Backend actor not initialized');
          }

          const version = `v${Date.now()}`;
          await actor.recordDeployment(version, {
            __kind__: 'success',
            success: 'Draft published successfully',
          });
        } catch (err) {
          const diagnostic = normalizeToDiagnostic(err, recordStep);
          setStatus('failed');
          setError(diagnostic);
          return { success: false, diagnostic };
        }

        // Step 5: Log submit summary (single structured log)
        const heroUploaded = changes.hero instanceof File;
        const heroCleared = changes.hero === 'clear';
        const imageUploads = Array.from(changes.images.values()).filter((v) => v instanceof File).length;
        const imageClears = Array.from(changes.images.values()).filter((v) => v === 'clear').length;
        const videoUploads = Array.from(changes.videos.values()).filter((v) => v instanceof File).length;
        const videoClears = Array.from(changes.videos.values()).filter((v) => v === 'clear').length;
        const songUploaded = changes.song instanceof File;
        const songCleared = changes.song === 'clear';
        const orderChanged = changes.imageOrder.length > 0;
        const transformsChanged = changes.imageTransforms.size > 0;

        const diagnostic: SubmitDiagnostic = {
          uploaded: {
            hero: heroUploaded,
            images: imageUploads,
            videos: videoUploads,
            song: songUploaded,
          },
          cleared: {
            hero: heroCleared,
            images: imageClears,
            videos: videoClears,
            song: songCleared,
          },
          orderChanged,
          transformsChanged,
        };

        logSubmitDiagnostic(diagnostic);

        setStatus('succeeded');
        return { success: true };
      } catch (err) {
        const diagnostic = normalizeToDiagnostic(err, 'Publish operation');
        setStatus('failed');
        setError(diagnostic);
        return { success: false, diagnostic };
      }
    },
    [actor, batchPublish, runPrecheck]
  );

  const reset = useCallback(() => {
    setStatus('idle');
    setError(null);
  }, []);

  return {
    status,
    error,
    runPrecheck,
    publish,
    reset,
  };
}
