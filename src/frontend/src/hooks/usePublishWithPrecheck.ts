import { useState, useCallback } from 'react';
import { useActor } from './useActor';
import { useMediaStore } from './useMediaStore';
import type { PrePublishConfig } from '../backend';
import { normalizeToDiagnostic, type DiagnosticPayload } from '../lib/deployDiagnostics';
import { publishMediaToBackend } from '../lib/publishedMediaClient';
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
          const diagnostic = normalizeToDiagnostic(err, backendPublishStep);
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

        // Log publish summary (single structured log)
        const heroAction = changes.hero === 'clear' ? 'clear' : changes.hero instanceof File ? 'upload' : 'none';
        const imageUploads = Array.from(changes.images.values()).filter((v) => v instanceof File).length;
        const imageClears = Array.from(changes.images.values()).filter((v) => v === 'clear').length;
        const videoUploads = Array.from(changes.videos.values()).filter((v) => v instanceof File).length;
        const videoClears = Array.from(changes.videos.values()).filter((v) => v === 'clear').length;
        const songAction = changes.song === 'clear' ? 'clear' : changes.song instanceof File ? 'upload' : 'none';
        const orderChanged = changes.imageOrder.length > 0;
        const transformsChanged = changes.imageTransforms.size > 0;

        console.log('Publish Summary:', {
          hero: heroAction,
          images: { uploads: imageUploads, clears: imageClears },
          videos: { uploads: videoUploads, clears: videoClears },
          song: songAction,
          orderChanged,
          transformsChanged,
        });

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
