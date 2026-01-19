# Brick Deal Hunter - Project Rules

## Project Overview
A React Native + Expo mobile app for tracking LEGO set deals across major US retailers.

## Tech Stack
- **Framework:** React Native + Expo (TypeScript)
- **Navigation:** @react-navigation/native + native-stack
- **Styling:** NativeWind (Tailwind CSS for React Native)
- **Icons:** lucide-react-native
- **State Management:** Zustand
- **Backend:** Firebase (Firestore, Cloud Functions, FCM)
- **Images:** expo-image with caching
- **Charts:** victory-native

## Code Standards

### TypeScript
- Strict mode enabled
- No `any` types - always define proper interfaces
- Export types from `src/types/index.ts`

### File Organization
```
src/
├── components/    # Reusable UI components
├── screens/       # Full screen components
├── navigation/    # React Navigation setup
├── store/         # Zustand stores
├── services/      # API calls (Rebrickable, BrickLink, Firebase)
├── hooks/         # Custom React hooks
├── utils/         # Helper functions
├── types/         # TypeScript definitions
└── constants/     # Colors, retailers, theme
```

### Naming Conventions
- Components: PascalCase (`DealCard.tsx`)
- Hooks: camelCase with `use` prefix (`useDeals.ts`)
- Stores: camelCase with `use` prefix (`useDealsStore.ts`)
- Utils: camelCase (`priceCalculations.ts`)
- Constants: camelCase files, UPPER_SNAKE_CASE exports

### Styling
- Use NativeWind (Tailwind) classes exclusively
- Colors defined in `constants/colors.ts`
- LEGO brand colors: red (#D91F2A), yellow (#F7B500)

### Components
- Functional components only
- Props interface defined above component
- Include loading skeleton states
- Include error states with retry
- Include empty states

### State Management
- Zustand for global state
- Local state for component-specific data
- Persist settings with AsyncStorage

### API Calls
- All API calls in `services/` folder
- Handle errors gracefully with user feedback
- Cache responses where appropriate
- Rate limit external API calls

### Error Handling
- Try-catch all async operations
- User-friendly error messages
- Log errors for debugging
- Retry logic for network failures

### Testing
- Jest for unit tests
- React Native Testing Library for components
- Test files next to source files (`*.test.ts`)

### Git Commits
- Frequent, small commits
- Descriptive messages
- Format: `type: description` (feat, fix, refactor, docs, style)

## Data Flow
```
Rebrickable API → Current LEGO sets list
                      ↓
Firebase Cloud Functions → Hourly price checks
                      ↓
Firestore → Price data storage
                      ↓
App → Display deals, calculate % off
```

## Key Features
1. Real-time deal tracking
2. % off MSRP calculation
3. Filter by theme, retailer, discount
4. Price history charts
5. Push notifications for deal alerts
6. Set detail with all retailer prices

## Retailers
- LEGO.com
- Amazon
- Walmart
- Target
- Barnes & Noble
- Sam's Club
- Costco
- Walgreens
