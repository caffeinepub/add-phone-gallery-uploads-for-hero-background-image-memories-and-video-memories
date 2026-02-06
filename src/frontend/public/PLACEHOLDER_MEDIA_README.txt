MEDIA UPLOAD INSTRUCTIONS
==========================

This romantic birthday website uses an IN-APP MEDIA MANAGER for all media uploads.

UPLOADED-ONLY RENDERING
-----------------------
All media (hero background, images, videos, and background song) must be uploaded 
through the in-app Media Manager. There are NO placeholder or default media files.

Empty slots (slots without uploaded media) will display explicit English-only empty 
states such as:
- "No hero background uploaded"
- "No image uploaded for this slot"
- "No video uploaded for slot N"
- "No song uploaded"

HOW TO UPLOAD MEDIA
-------------------
1. Click the "Media" button in the top-right corner of the hero section
2. Navigate to the appropriate tab (Hero, Images, Videos, or Song)
3. Upload your media files directly from your device
4. Click "Submit" to publish your changes

MEDIA SPECIFICATIONS
--------------------
- Hero Background: 1 image (.jpg, .jpeg, .png, .webp)
- Image Memories: Up to 43 images (.jpg, .jpeg, .png, .webp)
- Video Memories: Up to 6 videos (.mp4, .mov, .webm)
- Background Song: 1 audio file (.mp3, .wav)

PERSISTENCE
-----------
Uploaded media is stored on the Internet Computer backend and persists across:
- Page refreshes
- Browser sessions
- Canister upgrades (unless state is intentionally wiped)

All modes (Draft, Preview, Published) render the exact same committed media set 
from the backend with no placeholders, no lazy loading, and no media hiding.

NOTES
-----
- All media loads immediately on page load (no lazy loading)
- Empty states use clear English-only text
- No placeholder assets are used for any media type
- Media is bound persistently and rendered identically across all modes
