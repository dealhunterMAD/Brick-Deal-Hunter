// ============================================
// DEAL CARD COMPONENT
// ============================================
// The main card that shows a LEGO deal.
// Displays set image, name, prices, discount badge,
// and retailer info. Tapping opens the set detail.

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
} from 'react-native';
import { ExternalLink } from 'lucide-react-native';
import { Deal } from '../types';
import { COLORS } from '../constants/colors';
import { SPACING, SHADOWS, BORDER_RADIUS } from '../constants/theme';
import {
  formatCurrency,
  formatSetNumber,
  formatPieceCount,
  formatRelativeTime,
} from '../utils/formatters';
import { SetImage } from './SetImage';
import { DiscountBadge } from './DiscountBadge';
import { RetailerChip } from './RetailerChip';

/**
 * Props for the DealCard component
 */
interface DealCardProps {
  /** The deal data to display */
  deal: Deal;
  /** Callback when card is pressed (navigate to detail) */
  onPress?: () => void;
  /** Whether to show the "Buy Now" button */
  showBuyButton?: boolean;
}

/**
 * DealCard - Main card component for displaying a LEGO deal
 *
 * Usage:
 * <DealCard
 *   deal={dealData}
 *   onPress={() => navigation.navigate('SetDetail', { setNumber: deal.set.setNumber })}
 * />
 */
export function DealCard({
  deal,
  onPress,
  showBuyButton = true,
}: DealCardProps) {
  const { set, price, percentOff, savings } = deal;

  // Open the retailer's product page
  const handleBuyPress = async () => {
    if (price.url) {
      try {
        await Linking.openURL(price.url);
      } catch (error) {
        console.error('Failed to open URL:', error);
      }
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.pressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${set.name}, ${percentOff}% off at ${price.retailer}`}
    >
      {/* Discount badge in corner */}
      <View style={styles.badgeContainer}>
        <DiscountBadge percentOff={percentOff} size="medium" />
      </View>

      {/* Main content row */}
      <View style={styles.content}>
        {/* Set image */}
        <SetImage
          imageUrl={set.imageUrl}
          alt={set.name}
          size="medium"
        />

        {/* Info section */}
        <View style={styles.info}>
          {/* Set name */}
          <Text style={styles.name} numberOfLines={2}>
            {set.name}
          </Text>

          {/* Set number and piece count */}
          <Text style={styles.meta}>
            #{formatSetNumber(set.setNumber)} • {formatPieceCount(set.numParts)}
          </Text>

          {/* Price section */}
          <View style={styles.priceRow}>
            {/* Current price (large, prominent) */}
            <Text style={styles.currentPrice}>
              {formatCurrency(price.currentPrice)}
            </Text>

            {/* Original/MSRP price (crossed out) */}
            {set.msrp && set.msrp > price.currentPrice && (
              <Text style={styles.originalPrice}>
                {formatCurrency(set.msrp)}
              </Text>
            )}
          </View>

          {/* Savings amount */}
          {savings > 0 && (
            <Text style={styles.savings}>
              Save {formatCurrency(savings)}
            </Text>
          )}

          {/* Bottom row: retailer + buy button */}
          <View style={styles.bottomRow}>
            <RetailerChip retailerId={price.retailer} size="small" />

            {showBuyButton && price.url && (
              <Pressable
                style={({ pressed }) => [
                  styles.buyButton,
                  pressed && styles.buyButtonPressed,
                ]}
                onPress={handleBuyPress}
                accessibilityRole="link"
                accessibilityLabel={`Buy at ${price.retailer}`}
              >
                <Text style={styles.buyButtonText}>Buy</Text>
                <ExternalLink size={12} color="#FFFFFF" />
              </Pressable>
            )}
          </View>

          {/* Last updated timestamp */}
          <Text style={styles.timestamp}>
            Updated {formatRelativeTime(price.lastUpdated)}
          </Text>
        </View>
      </View>

      {/* Stock status indicator */}
      {!price.inStock && (
        <View style={styles.outOfStock}>
          <Text style={styles.outOfStockText}>Out of Stock</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  pressed: {
    opacity: 0.95,
    transform: [{ scale: 0.99 }],
  },
  badgeContainer: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    zIndex: 1,
  },
  content: {
    flexDirection: 'row',
  },
  info: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
    paddingRight: 60, // Make room for badge
  },
  meta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginBottom: 4,
  },
  currentPrice: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.legoRed,
  },
  originalPrice: {
    fontSize: 14,
    color: COLORS.textTertiary,
    textDecorationLine: 'line-through',
  },
  savings: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.dealGood,
    marginBottom: 8,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.legoRed,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  buyButtonPressed: {
    opacity: 0.8,
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 10,
    color: COLORS.textTertiary,
    marginTop: 8,
  },
  outOfStock: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outOfStockText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textSecondary,
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
});

export default DealCard;
