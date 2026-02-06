MEDIA PLACEHOLDER INSTRUCTIONS
================================

This romantic birthday website supports TWO ways to update media:

METHOD 1: IN-APP MEDIA MANAGER (Recommended for Mobile)
--------------------------------------------------------
1. Click the "Media" button in the top-right corner of the hero section
2. Upload images and videos directly from your phone gallery
3. Your media is stored locally in your browser and persists across refreshes
4. No file management needed!

Upload options:
- Hero Background: Upload 1 image (.jpg, .jpeg, .png, .webp)
- Image Memories: Upload up to 43 images (mapped to slots 1-43 in order)
- Video Memories: Upload up to 6 videos (mapped to slots 1-6 in order)

Note: Uploaded media is stored in your browser's IndexedDB. If you clear browser data, 
you'll need to re-upload. The app will fall back to placeholder files if no uploaded 
media is present.


METHOD 2: FILE REPLACEMENT (Traditional)
-----------------------------------------
Replace placeholder files in frontend/public/ with your own media files.

REQUIRED FILES:

1. HERO BACKGROUND IMAGE:
   - File: hero-bg.jpg
   - Location: frontend/public/hero-bg.jpg
   - Description: Main background image for the hero section
   - Recommended size: 1080x1920px (mobile portrait)

2. BACKGROUND MUSIC:
   - File: song.mp3
   - Location: frontend/public/song.mp3
   - Description: Looping background music
   - Format: MP3 audio file

3. IMAGE MEMORY GALLERY (43 images):
   - Files: image1.jpg, image2.jpg, ... image43.jpg
   - Location: frontend/public/
   - Description: Photo gallery with flip animation
   - Recommended size: 800x1200px each
   - To add more images: 
     * Add imageN.jpg to frontend/public/
     * Edit frontend/src/config/imageMemory.ts and add a new entry

4. VIDEO MEMORY GALLERY (6 videos):
   - Files: video1.mp4, video2.mp4, ... video6.mp4
   - Location: frontend/public/
   - Description: Video gallery
   - Recommended format: MP4, 9:16 aspect ratio (portrait)


HOW FALLBACK WORKS:
-------------------
- The app first checks for uploaded media (from the in-app Media Manager)
- If no uploaded media exists for a slot, it falls back to the placeholder file
- This means you can mix and match: upload some media in-app and use placeholder 
  files for others


TO ADD UNLIMITED IMAGES:
------------------------
1. Add your new image file to frontend/public/ (e.g., image44.jpg)
2. Open frontend/src/config/imageMemory.ts
3. Add a new entry to the array following the existing pattern
4. The flip animation will work automatically!


NOTES:
------
- All animations and interactions are already implemented
- Replacing files or uploading media does not break any functionality
- Keep filenames exactly as specified for automatic loading
- For best results, use high-quality images optimized for mobile
- In-app uploads are stored locally and persist across page refreshes
