# Specification

## Summary
**Goal:** Use the uploaded image as the default Hero background, enforce autoplaying looping background music behavior, and ensure the Image/Video Memory grids and Media Manager controls work as specified on mobile and desktop.

**Planned changes:**
- Bundle `1770099054248.png` as a static frontend asset and set it as the default Hero background when no Hero background has been uploaded via the Media Manager (uploaded Hero overrides default).
- Update the background music player so that when a song is available it attempts mobile-friendly autoplay (starts muted), loops continuously, shows only a small bottom-right play/pause popup, keeps a lightly visible `<audio>` element, and removes any “tap to start”/interaction prompts.
- Ensure the Image Memory section renders a responsive 43-slot grid driven by existing slot configuration; each populated card flips/rotates in smooth 3D on tap/click with a fade-in romantic message on the back; maintain rounded corners and soft shadow; keep existing empty-state message.
- In Media Manager (“working mode”), add clear per-slot mobile-friendly controls for Add/Replace, Adjust (drag/zoom), reorder where supported (or existing mobile alternatives), and ensure submitting/saving updates reflects in the Image Memory grid without refresh.
- Ensure the Video Memory section renders exactly 6 video slots with preserved aspect ratio; support add/replace via Media Manager; keep mobile-friendly playback behavior (playsInline, looping, default-muted).

**User-visible outcome:** On first visit the Hero shows the bundled background image, background music quietly starts and loops with a small bottom-right control, the Image Memory grid shows 43 flip-to-reveal cards, and both image/video slots can be managed via the Media Manager with changes appearing after submit.
