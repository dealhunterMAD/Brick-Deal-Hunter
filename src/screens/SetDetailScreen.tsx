// ============================================
// SET DETAIL SCREEN
// ============================================
// Shows detailed information about a LEGO set including:
// - Large image
// - Set info (name, pieces, theme, year)
// - All retailer prices
// - Price history chart
// - Watch/alert button

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  ExternalLink,
  Share2,
  Bell,
  BellOff,
  Package,
  Calendar,
  Puzzle,
} from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { COLORS } from '../constants/colors';
import { SPACING, SHADOWS, BORDER_RADIUS } from '../constants/theme';
import { RootStackParamList, Deal, PricePoint } from '../types';
import { RETAILERS } from '../constants/retailers';
import { useDealsStore } from '../store/useDealsStore';
import { useSettingsStore, useIsSetWatched } from '../store/useSettingsStore';
import {
  formatCurrency,
  formatSetNumber,
  formatPieceCount,
  formatPercent,
  formatRelativeTime,
} from '../utils/formatters';
import { calculatePercentOff } from '../utils/priceCalculations';

import { SetImage } from '../components/SetImage';
import { DiscountBadge } from '../components/DiscountBadge';
import { SetDetailSkeleton } from '../components/LoadingSkeleton';

type Props = NativeStackScreenProps<RootStackParamList, 'SetDetail'>;

/**
 * SetDetailScreen - Detailed view of a LEGO set
 */
export function SetDetailScreen({ navigation, route }: Props) {
  const { setNumber } = route.params;

  // Get deal from store
  const deals = useDealsStore((state) => state.deals);
  const deal = deals.find((d) => d.set.setNumber === setNumber);

  // Watch state
  const isWatched = useIsSetWatched(setNumber);
  const { addWatchedSet, removeWatchedSet } = useSettingsStore();

  // Loading state
  const [isLoading, setIsLoading] = useState(!deal);

  useEffect(() => {
    // Simulate loading if no deal found
    if (!deal) {
      const timer = setTimeout(() => setIsLoading(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [deal]);

  /**
   * Toggle watch status
   */
  const toggleWatch = () => {
    if (isWatched) {
      removeWatchedSet(setNumber);
    } else {
      addWatchedSet(setNumber);
    }
  };

  /**
   * Share set
   */
  const handleShare = async () => {
    if (!deal) return;

    try {
      await Share.share({
        title: deal.set.name,
        message: `Check out this LEGO deal: ${deal.set.name} - ${formatPercent(deal.percentOff)} off at ${RETAILERS[deal.price.retailer]?.name}! ${deal.price.url}`,
      });
    } catch (error) {
      console.error('Share failed:', error);
    }
  };

  /**
   * Open retailer URL
   */
  const openRetailerUrl = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Failed to open URL:', error);
    }
  };

  // Show loading skeleton
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <SetDetailSkeleton />
      </SafeAreaView>
    );
  }

  // Show not found
  if (!deal) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <ArrowLeft size={24} color={COLORS.textPrimary} />
          </Pressable>
        </View>
        <View style={styles.notFound}>
          <Package size={64} color={COLORS.textTertiary} />
          <Text style={styles.notFoundTitle}>Set Not Found</Text>
          <Text style={styles.notFoundText}>
            We couldn't find information for set #{formatSetNumber(setNumber)}.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const { set, price, percentOff, savings } = deal;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => navigation.goBack()} style={styles.backButton}>
          <ArrowLeft size={24} color={COLORS.textPrimary} />
        </Pressable>

        <View style={styles.headerActions}>
          <Pressable onPress={toggleWatch} style={styles.actionButton}>
            {isWatched ? (
              <Bell size={22} color={COLORS.legoRed} fill={COLORS.legoRed} />
            ) : (
              <BellOff size={22} color={COLORS.textSecondary} />
            )}
          </Pressable>
          <Pressable onPress={handleShare} style={styles.actionButton}>
            <Share2 size={22} color={COLORS.textSecondary} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Hero Image */}
        <View style={styles.imageContainer}>
          <SetImage imageUrl={set.imageUrl} alt={set.name} size="hero" />
          <View style={styles.badgeOverlay}>
            <DiscountBadge percentOff={percentOff} size="large" />
          </View>
        </View>

        {/* Set Info */}
        <View style={styles.infoSection}>
          <Text style={styles.setName}>{set.name}</Text>
          <Text style={styles.setNumber}>#{formatSetNumber(set.setNumber)}</Text>

          {/* Meta info row */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Puzzle size={16} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{formatPieceCount(set.numParts)}</Text>
            </View>
            <View style={styles.metaItem}>
              <Calendar size={16} color={COLORS.textSecondary} />
              <Text style={styles.metaText}>{set.year}</Text>
            </View>
            <View style={styles.metaChip}>
              <Text style={styles.metaChipText}>{set.theme}</Text>
            </View>
          </View>
        </View>

        {/* Price Card */}
        <View style={styles.priceCard}>
          <View style={styles.priceHeader}>
            <Text style={styles.priceLabel}>Best Price</Text>
            <View style={styles.retailerInfo}>
              <View
                style={[
                  styles.retailerDot,
                  { backgroundColor: RETAILERS[price.retailer]?.color },
                ]}
              />
              <Text style={styles.retailerName}>
                {RETAILERS[price.retailer]?.name}
              </Text>
            </View>
          </View>

          <View style={styles.priceRow}>
            <Text style={styles.currentPrice}>{formatCurrency(price.currentPrice)}</Text>
            {set.msrp && (
              <Text style={styles.msrp}>MSRP: {formatCurrency(set.msrp)}</Text>
            )}
          </View>

          {savings > 0 && (
            <Text style={styles.savings}>You save {formatCurrency(savings)}</Text>
          )}

          <Pressable
            style={({ pressed }) => [
              styles.buyButton,
              pressed && styles.buyButtonPressed,
            ]}
            onPress={() => openRetailerUrl(price.url)}
          >
            <Text style={styles.buyButtonText}>Buy Now</Text>
            <ExternalLink size={18} color="#FFFFFF" />
          </Pressable>

          <Text style={styles.updatedTime}>
            Price updated {formatRelativeTime(price.lastUpdated)}
          </Text>
        </View>

        {/* Stock Status */}
        {!price.inStock && (
          <View style={styles.outOfStockBanner}>
            <Text style={styles.outOfStockText}>
              Currently out of stock at this retailer
            </Text>
          </View>
        )}

        {/* Other Retailers Section (placeholder) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Other Retailers</Text>
          <View style={styles.otherRetailersPlaceholder}>
            <Text style={styles.placeholderText}>
              Price comparison from other retailers will appear here
            </Text>
          </View>
        </View>

        {/* Price History Section (placeholder) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price History</Text>
          <View style={styles.chartPlaceholder}>
            <Text style={styles.placeholderText}>
              Price history chart will appear here
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.cardBackground,
    ...SHADOWS.sm,
  },
  backButton: {
    padding: SPACING.sm,
  },
  headerActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    padding: SPACING.sm,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: SPACING.xxxl,
  },
  imageContainer: {
    backgroundColor: COLORS.cardBackground,
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    position: 'relative',
  },
  badgeOverlay: {
    position: 'absolute',
    top: SPACING.lg,
    right: SPACING.lg,
  },
  infoSection: {
    padding: SPACING.lg,
    backgroundColor: COLORS.cardBackground,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  setName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  setNumber: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.lg,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  metaChip: {
    backgroundColor: COLORS.legoYellow,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
    borderRadius: 12,
  },
  metaChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  priceCard: {
    margin: SPACING.lg,
    padding: SPACING.lg,
    backgroundColor: COLORS.cardBackground,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.md,
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  priceLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  retailerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  retailerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  retailerName: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textPrimary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.md,
    marginBottom: 4,
  },
  currentPrice: {
    fontSize: 36,
    fontWeight: '700',
    color: COLORS.legoRed,
  },
  msrp: {
    fontSize: 16,
    color: COLORS.textTertiary,
    textDecorationLine: 'line-through',
  },
  savings: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dealGood,
    marginBottom: SPACING.lg,
  },
  buyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.legoRed,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  buyButtonPressed: {
    opacity: 0.9,
  },
  buyButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  updatedTime: {
    fontSize: 12,
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginTop: SPACING.md,
  },
  outOfStockBanner: {
    marginHorizontal: SPACING.lg,
    padding: SPACING.md,
    backgroundColor: COLORS.warning + '20',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.warning,
  },
  outOfStockText: {
    fontSize: 14,
    color: COLORS.warning,
    textAlign: 'center',
    fontWeight: '500',
  },
  section: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: SPACING.md,
  },
  otherRetailersPlaceholder: {
    padding: SPACING.xl,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  chartPlaceholder: {
    height: 200,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: COLORS.textTertiary,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xxxl,
  },
  notFoundTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginTop: SPACING.lg,
  },
  notFoundText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
});

export default SetDetailScreen;
