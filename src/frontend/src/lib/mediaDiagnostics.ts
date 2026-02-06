/**
 * Media diagnostics utility for structured, English-only logging
 * Logs only counts/booleans/slot indices, never user media bytes or personal content
 */

export interface AppStartDiagnostic {
  renderSource: string;
  committed: {
    hero: boolean;
    images: number;
    videos: number;
    song: boolean;
  };
  imageOrder: {
    length: number;
    firstFive: number[];
  };
  transforms: {
    count: number;
    slots: number[];
  };
}

export interface SubmitDiagnostic {
  uploaded: {
    hero: boolean;
    images: number;
    videos: number;
    song: boolean;
  };
  cleared: {
    hero: boolean;
    images: number;
    videos: number;
    song: boolean;
  };
  orderChanged: boolean;
  transformsChanged: boolean;
}

/**
 * Log app start render state (called once per app start)
 */
export function logAppStartDiagnostic(diagnostic: AppStartDiagnostic): void {
  console.log('[Media Diagnostics] App Start:', {
    renderSource: diagnostic.renderSource,
    committed: diagnostic.committed,
    imageOrder: diagnostic.imageOrder,
    transforms: diagnostic.transforms,
  });
}

/**
 * Log submit success summary (called once per successful submit)
 */
export function logSubmitDiagnostic(diagnostic: SubmitDiagnostic): void {
  console.log('[Media Diagnostics] Submit Success:', {
    uploaded: diagnostic.uploaded,
    cleared: diagnostic.cleared,
    orderChanged: diagnostic.orderChanged,
    transformsChanged: diagnostic.transformsChanged,
  });
}
