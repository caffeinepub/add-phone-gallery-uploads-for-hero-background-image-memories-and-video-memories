# Specification

## Summary
**Goal:** Make published/preview mode reliably load and display the hero background, image slots, video slots, and background song from the backend after Media Manager Submit.

**Planned changes:**
- Implement real backend persistence for published media in the Motoko single-actor canister, with getPublishedMedia() returning published hero background, images (up to 43), videos (up to 6), and song, including proper nulls for cleared slots.
- Add explicit backend APIs to publish/replace and clear hero background, per image slot, per video slot, and background song; update the frontend submit/publish flow to use these APIs (instead of the current no-op placeholder) and surface English errors on publish failure.
- Fix frontend publishedMediaClient.fetchPublishedMedia() mapping/URL construction so it correctly interprets the backend PublishedMedia shape and produces stable renderable URLs for hero/images/videos/song in published/preview mode.
- Ensure MediaStoreContext rehydration in published/preview mode falls back to backend-published media when local IndexedDB media is absent, while keeping local media precedence when present.
- Update the Media Manager Submit flow so the UI reflects submitted/published media immediately (including image order and transforms) without requiring a refresh, in both draft and published preview workflows.
- Add lightweight production-focused diagnostics: exactly one structured English console log on app start and exactly one structured English console log per Submit summarizing uploads/clears and whether order/transforms changed.

**User-visible outcome:** After uploading and submitting media, the published/preview experience shows the correct hero background, images, videos, and song reliably (even on a fresh browser session), and failures show an English error instead of silently succeeding.
