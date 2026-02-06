# Specification

## Summary
**Goal:** Fix media rendering and audio playback in preview and live modes, add a clear draft preview in the Media Manager, and clarify the Hero Media button label.

**Planned changes:**
- Ensure Hero background, Image Memory slots, Video Memory slots, and background song render correctly in both preview and live/production by using current MediaStore state with fallback to backend-published media when local browser media is absent.
- Add a Media Manager “Preview” section that shows staged draft Hero/Image/Video/Song selections immediately (including placeholder display for cleared draft slots) before publishing.
- Restore reliable background audio playback in preview and live modes, including uploaded songs, with a clear tap-to-play path when autoplay is blocked and without hardcoding MP3-only sources.
- Update the Hero section entry-point button label to “Media” (not “Edit”) across screen sizes, keeping the icon and an accessible English aria-label.
- Make “clear” actions reliably remove media references so placeholders appear immediately after Submit and remain cleared after reload (no reappearing stale local URLs).

**User-visible outcome:** Uploaded or published hero/images/videos/song consistently appear in preview and live modes; users can preview draft media before publishing, play the background song reliably (with a clear tap-to-start prompt if needed), see a clearly labeled “Media” button, and clear media so placeholders show immediately and persist after reload.
