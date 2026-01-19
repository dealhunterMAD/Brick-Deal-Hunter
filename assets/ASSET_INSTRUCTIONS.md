# Asset Creation Guide

You need to create these image files for the app to work properly.

## Required Files

### 1. icon.png (1024x1024 pixels)
This is your app icon that appears on the home screen.

**How to create with Canva (Free):**
1. Go to https://canva.com and create a free account
2. Click "Create a design" > "Custom size"
3. Enter 1024 x 1024 pixels
4. In the left sidebar, click "Elements"
5. Search for "building block" or "brick"
6. Add a brick element to your canvas
7. Click on it and change the color to red (#D91F2A)
8. Search for "circle" and add a small green circle (#22C55E)
9. Add text "%" in white inside the circle
10. Position the circle in the top-right corner of the brick
11. Click "Share" > "Download" > "PNG" with transparent background
12. Save as `icon.png` in this assets folder

**AI Image Generator Prompt:**
```
Flat modern app icon design, 1024x1024 pixels, transparent background.
A stylized 3D red (#D91F2A) and yellow (#F7B500) LEGO 2x4 brick viewed at
a slight angle. In the corner, a circular green badge with white "%" symbol.
Clean minimal style, no text, suitable for iOS/Android app stores.
Glossy plastic look with subtle shadows.
```

---

### 2. splash-icon.png (512x512 pixels)
This appears on the red splash screen when the app opens.

**Canva Instructions:**
1. Create new design: 512 x 512 pixels
2. Add the same brick design as the icon (simpler version)
3. Download as PNG with transparent background
4. Save as `splash-icon.png`

---

### 3. adaptive-icon.png (1024x1024 pixels)
For Android devices. Same as icon.png but with extra padding.

**Instructions:**
1. Use your icon.png
2. Make sure the brick is centered with some margin around it
3. Save as `adaptive-icon.png`

---

### 4. favicon.png (48x48 pixels)
For web version. A tiny version of your icon.

**Instructions:**
1. Create new design: 48 x 48 pixels
2. Simplified brick icon (less detail)
3. Save as `favicon.png`

---

### 5. notification-icon.png (96x96 pixels)
For push notifications on Android.

**Instructions:**
1. Create new design: 96 x 96 pixels
2. Simple brick silhouette in white
3. Transparent background
4. Save as `notification-icon.png`

---

## Quick Start (Temporary)

If you want to test the app immediately without creating custom icons:

1. Find any square PNG image online
2. Resize it to 1024x1024
3. Save it as `icon.png`, `splash-icon.png`, and `adaptive-icon.png`
4. Create a 48x48 version as `favicon.png`

The app will work with any images, but custom LEGO-themed icons look much better!

---

## Free Resources

- Canva: https://canva.com (free tier is plenty)
- DALL-E: https://labs.openai.com (free credits)
- Bing Image Creator: https://www.bing.com/create (free)
- Remove.bg: https://remove.bg (free background removal)
