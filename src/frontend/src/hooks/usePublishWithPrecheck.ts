import { useState, useCallback } from 'react';
import { useActor } from './useActor';
import { useMediaStore } from './useMediaStore';
import type { PrePublishConfig } from '../backend';
import { normalizeToDiagnostic, formatDiagnosticForConsole, type DiagnosticPayload } from '../lib/deployDiagnostics';

export type PublishStatus = 'idle' | 'running' | 'succeeded' | 'failed';

export interface PublishResult {
  success: boolean;
  diagnostic?: DiagnosticPayload;
}

export interface UsePublishWithPrecheckReturn {
  status: PublishStatus;
  error: DiagnosticPayload | null;
  runPrecheck: (config: PrePublishConfig) => Promise<PublishResult>;
  publish: (changes: {
    hero?: File | 'clear';
    images: Map<number, File | 'clear'>;
    videos: Map<number, File | 'clear'>;
    song?: File | 'clear';
    imageOrder: number[];
    imageTransforms: Map<number, any>;
  }) => Promise<PublishResult>;
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
      console.log(`🔍 ${step}:`, config);

      try {
        if (!actor) {
          const diagnostic = normalizeToDiagnostic(
            new Error('Backend actor not initialized'),
            step
          );
          console.error(formatDiagnosticForConsole(diagnostic));
          return { success: false, diagnostic };
        }

        const result = await actor.prePublishCheck(config);

        if (result.__kind__ === 'failed') {
          const diagnostic: DiagnosticPayload = {
            message: result.failed.reason,
            details: result.failed.details,
            step,
          };
          console.error(`❌ ${formatDiagnosticForConsole(diagnostic)}`);
          return { success: false, diagnostic };
        }

        console.log(`✅ ${step} passed`);
        return { success: true };
      } catch (err) {
        const diagnostic = normalizeToDiagnostic(err, step);
        console.error(`❌ ${formatDiagnosticForConsole(diagnostic)}`);
        return { success: false, diagnostic };
      }
    },
    [actor]
  );

  const publish = useCallback(
    async (changes: {
      hero?: File | 'clear';
      images: Map<number, File | 'clear'>;
      videos: Map<number, File | 'clear'>;
      song?: File | 'clear';
      imageOrder: number[];
      imageTransforms: Map<number, any>;
    }): Promise<PublishResult> => {
      setStatus('running');
      setError(null);

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

      // Step 2: Persist draft to IndexedDB
      const persistStep = 'Persist draft';
      console.log(`💾 ${persistStep}...`);
      try {
        await batchPublish(changes);
        console.log(`✅ ${persistStep} completed`);
      } catch (err) {
        const diagnostic = normalizeToDiagnostic(err, persistStep);
        console.error(`❌ ${formatDiagnosticForConsole(diagnostic)}`);
        setStatus('failed');
        setError(diagnostic);
        return { success: false, diagnostic };
      }

      // Step 3: Record deployment to backend
      const recordStep = 'Record deployment';
      console.log(`📝 ${recordStep}...`);
      try {
        if (!actor) {
          throw new Error('Backend actor not initialized');
        }

        const version = `v${Date.now()}`;
        await actor.recordDeployment(version, {
          __kind__: 'success',
          success: 'Draft published successfully',
        });
        console.log(`✅ ${recordStep} completed`);
      } catch (err) {
        const diagnostic = normalizeToDiagnostic(err, recordStep);
        console.error(`❌ ${formatDiagnosticForConsole(diagnostic)}`);
        setStatus('failed');
        setError(diagnostic);
        return { success: false, diagnostic };
      }

      setStatus('succeeded');
      console.log('🎉 Publish completed successfully');
      return { success: true };
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
