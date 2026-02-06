# Specification

## Summary
**Goal:** Let any visitor upload, replace, reorder, and clear Image Memories using the device file picker (which may include phone gallery or Google Drive), while keeping Hero/Videos/Song admin-only.

**Planned changes:**
- Backend: remove the image-uploader allowlist restriction for publishing/clearing Image Memory slots (indices 0–42), while still rejecting out-of-range indices and keeping Hero background, Video Memories, and Background Song admin-only.
- Frontend: adjust Media Manager permissions so the Images tab is editable for everyone, but Hero/Videos/Song remain locked to non-admin users with English lock messaging.
- Frontend: update Media Manager copy near image upload controls to clearly explain users can pick from their phone gallery or Google Drive via the system/device picker (no in-app Google Drive login).

**User-visible outcome:** Any visitor can upload and manage Image Memories (slots 1–43) from their device picker (including Photos/Google Drive options when available), while only admins can modify Hero background, Videos, or the Background Song.
