# Specification

## Summary
**Goal:** Ensure Draft, Preview, and Published all render the exact same committed uploaded media set (hero background, 43 image slots, 6 video slots, background song) with no placeholders, resets, regeneration, lazy-loading, or hidden media.

**Planned changes:**
- Unify the media “source of truth” so that after a successful Media Manager Submit, all modes (Draft/Preview/Published) render only the committed media set for hero, images, videos, and song.
- Enforce an “uploaded-only” rendering rule across all modes: render committed uploaded media when present; otherwise show an explicit English-only empty state (no packaged placeholders/default assets).
- Remove/disable lazy-loading and any visibility/interaction gating that can prevent committed media from appearing; ensure committed media attaches eagerly and begins loading immediately.
- Make Preview/Published media retrieval and frontend decoding/mapping deterministic (consistent slot indexing and optionals/tuples handling) so committed items are not dropped or mis-mapped.
- Add exactly one structured English-only diagnostic console log on app start and exactly one on every successful Submit summarizing committed media counts and basic state (no media bytes).

**User-visible outcome:** After submitting media, switching between Draft, Preview, and Published shows the same uploaded hero background, image/video slots, and background song immediately and consistently (or clear empty states when nothing is uploaded), without placeholders or missing media.
