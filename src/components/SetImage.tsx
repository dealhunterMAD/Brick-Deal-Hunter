// ============================================
// SET IMAGE COMPONENT
// ============================================
// Displays a LEGO set image with loading state
// and fallback placeholder if image fails.

import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { Package } from 'lucide-react-native';
import { COLORS } from '../constants/colors';

/**
 * Props for the SetImage component
 */
interface SetImageProps {
  /** URL of the set image */
  imageUrl: string | null;
  /** Alt text for accessibility */
  alt: string;
  /** Size of the image */
  size?: 'small' | 'medium' | 'large' | 'hero';
  /** Optional custom style */
  style?: object;
}

/**
 * Size configurations in pixels
 */
const SIZES = {
  small: 60,
  medium: 100,
  large: 150,
  hero: 250,
};

/**
 * SetImage - Displays LEGO set images with loading/error states
 *
 * Usage:
 * <SetImage
 *   imageUrl="https://images.brickset.com/sets/images/75192-1.jpg"
 *   alt="Millennium Falcon"
 *   size="medium"
 * />
 */
export function SetImage({
  imageUrl,
  alt,
  size = 'medium',
  style,
}: SetImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const dimension = SIZES[size];

  // Show placeholder if no URL or error loading
  if (!imageUrl || hasError) {
    return (
      <View
        style={[
          styles.placeholder,
          { width: dimension, height: dimension },
          style,
        ]}
        accessibilityLabel={alt}
      >
        <Package
          size={dimension * 0.4}
          color={COLORS.textTertiary}
          strokeWidth={1.5}
        />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        { width: dimension, height: dimension },
        style,
      ]}
    >
      {isLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={COLORS.legoRed} />
        </View>
      )}
      <Image
        source={{ uri: imageUrl }}
        style={[styles.image, { width: dimension, height: dimension }]}
        contentFit="contain"
        transition={200}
        accessibilityLabel={alt}
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onError={() => {
          setHasError(true);
          setIsLoading(false);
        }}
        // Cache aggressively
        cachePolicy="memory-disk"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    backgroundColor: 'transparent',
  },
  placeholder: {
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    zIndex: 1,
  },
});

export default SetImage;
