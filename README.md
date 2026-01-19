# Brick Deal Hunter

A mobile app for tracking LEGO set deals across major US retailers.

## For Complete Beginners: How to Run This App

### Step 1: Install Node.js (if not already done)

1. Open your web browser and go to: https://nodejs.org
2. Click the green "LTS" button to download
3. Run the installer and click "Next" through all screens
4. When done, **restart your computer** or close/reopen all terminal windows

### Step 2: Open Your Terminal

**On Windows:**
1. Press the **Windows key** on your keyboard
2. Type "PowerShell"
3. Click "Windows PowerShell"

**On Mac:**
1. Press **Cmd + Space**
2. Type "Terminal"
3. Press Enter

### Step 3: Go to the Project Folder

In your terminal, type this command and press Enter:

```bash
cd Desktop/Brick-Deal-Hunter
```

### Step 4: Install Dependencies

This downloads all the code libraries the app needs. Type:

```bash
npm install
```

**Wait for this to finish!** It may take 2-5 minutes. You'll see a lot of text scrolling by - that's normal.

### Step 5: Install Expo Go on Your Phone

1. On your **iPhone**: Open the App Store
2. Search for "Expo Go"
3. Download the free app

### Step 6: Start the App

In your terminal, type:

```bash
npx expo start
```

You'll see a QR code appear in your terminal.

### Step 7: Open the App on Your Phone

1. On your iPhone, open the **Camera** app
2. Point it at the QR code on your computer screen
3. Tap the notification that appears
4. The app will open in Expo Go!

---

## Setting Up API Keys (Required for Full Functionality)

### Rebrickable API Key (Free)

1. Go to: https://rebrickable.com/api/
2. Click "Register" to create a free account
3. Once logged in, go to: https://rebrickable.com/api/v3/docs/
4. Copy your API key
5. In the app, go to **Settings** and paste your key

---

## Troubleshooting

### "npm command not found"
Node.js isn't installed or your terminal needs to be restarted. Close all terminal windows and reopen them.

### "expo command not found"
Run `npm install -g expo-cli` first.

### The QR code doesn't work
Make sure your phone and computer are on the same WiFi network. If using a VPN, turn it off.

### The app shows errors
Try these commands:
```bash
npm install
npx expo start --clear
```

---

## Project Structure

```
Brick-Deal-Hunter/
├── assets/              # Images, icons, splash screen
├── src/
│   ├── components/      # Reusable UI pieces
│   ├── screens/         # Full app screens
│   ├── navigation/      # Screen routing
│   ├── store/           # App state (Zustand)
│   ├── services/        # API calls
│   ├── utils/           # Helper functions
│   ├── types/           # TypeScript definitions
│   └── constants/       # Colors, theme, etc.
├── App.tsx              # Main entry point
├── app.json             # Expo configuration
└── package.json         # Dependencies
```

---

## Features

- Real-time LEGO deal tracking
- Percentage off MSRP calculation
- Filter by theme, retailer, discount
- Watch sets for price alerts
- Price history charts (coming soon)
- Push notifications for deals

## Supported Retailers

- LEGO.com
- Amazon
- Walmart
- Target
- Barnes & Noble
- Sam's Club
- Costco
- Walgreens

---

## Building for App Store / Google Play

### Prerequisites

1. Create an Expo account at https://expo.dev
2. For iOS: Apple Developer account ($99/year)
3. For Android: Google Play Console ($25 one-time)

### Build Commands

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Configure builds
eas build:configure

# Build for iOS
eas build --platform ios

# Build for Android
eas build --platform android
```

---

## Need Help?

- Expo Docs: https://docs.expo.dev
- React Navigation: https://reactnavigation.org/docs
- Rebrickable API: https://rebrickable.com/api/v3/docs

---

Made with LEGO-colored code and enthusiasm!
