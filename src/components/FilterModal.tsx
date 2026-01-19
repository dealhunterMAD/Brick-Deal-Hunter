// ============================================
// FILTER MODAL COMPONENT
// ============================================
// A bottom sheet modal for filtering deals.
// Allows users to filter by discount %, theme,
// retailer, price range, and stock status.

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  Switch,
} from 'react-native';
import { X, RotateCcw, Check } from 'lucide-react-native';
import Slider from '@react-native-community/slider';
import { COLORS } from '../constants/colors';
import { SPACING, BORDER_RADIUS, SHADOWS } from '../constants/theme';
import { POPULAR_THEMES } from '../constants/theme';
import { ALL_RETAILER_IDS, RETAILERS } from '../constants/retailers';
import { useFiltersStore } from '../store/useFiltersStore';
import { RetailerId } from '../types';

/**
 * Props for the FilterModal component
 */
interface FilterModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** Callback to close the modal */
  onClose: () => void;
}

/**
 * FilterModal - Bottom sheet for filtering deals
 *
 * Usage:
 * <FilterModal
 *   visible={isFilterOpen}
 *   onClose={() => setFilterOpen(false)}
 * />
 */
export function FilterModal({ visible, onClose }: FilterModalProps) {
  // Get filter state and actions from store
  const {
    minDiscount,
    maxDiscount,
    themes,
    retailers,
    minPrice,
    maxPrice,
    inStockOnly,
    setMinDiscount,
    toggleTheme,
    toggleRetailer,
    setMinPrice,
    setMaxPrice,
    toggleInStockOnly,
    resetFilters,
    hasActiveFilters,
  } = useFiltersStore();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Filter Deals</Text>

            <View style={styles.headerButtons}>
              {/* Reset button */}
              {hasActiveFilters() && (
                <Pressable
                  style={styles.resetButton}
                  onPress={resetFilters}
                  accessibilityLabel="Reset all filters"
                >
                  <RotateCcw size={18} color={COLORS.textSecondary} />
                  <Text style={styles.resetText}>Reset</Text>
                </Pressable>
              )}

              {/* Close button */}
              <Pressable
                style={styles.closeButton}
                onPress={onClose}
                accessibilityLabel="Close filters"
              >
                <X size={24} color={COLORS.textPrimary} />
              </Pressable>
            </View>
          </View>

          {/* Scrollable content */}
          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Minimum Discount Slider */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Minimum Discount</Text>
              <Text style={styles.sliderValue}>{minDiscount}% off or more</Text>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={90}
                step={5}
                value={minDiscount}
                onValueChange={setMinDiscount}
                minimumTrackTintColor={COLORS.legoRed}
                maximumTrackTintColor={COLORS.border}
                thumbTintColor={COLORS.legoRed}
              />
              <View style={styles.sliderLabels}>
                <Text style={styles.sliderLabel}>0%</Text>
                <Text style={styles.sliderLabel}>90%</Text>
              </View>
            </View>

            {/* Price Range */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Price Range</Text>
              <Text style={styles.sliderValue}>
                ${minPrice} - ${maxPrice === 1000 ? '1000+' : maxPrice}
              </Text>
              <View style={styles.priceSliders}>
                <View style={styles.priceSlider}>
                  <Text style={styles.priceLabel}>Min</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={500}
                    step={10}
                    value={minPrice}
                    onValueChange={setMinPrice}
                    minimumTrackTintColor={COLORS.legoRed}
                    maximumTrackTintColor={COLORS.border}
                    thumbTintColor={COLORS.legoRed}
                  />
                </View>
                <View style={styles.priceSlider}>
                  <Text style={styles.priceLabel}>Max</Text>
                  <Slider
                    style={styles.slider}
                    minimumValue={50}
                    maximumValue={1000}
                    step={50}
                    value={maxPrice}
                    onValueChange={setMaxPrice}
                    minimumTrackTintColor={COLORS.legoRed}
                    maximumTrackTintColor={COLORS.border}
                    thumbTintColor={COLORS.legoRed}
                  />
                </View>
              </View>
            </View>

            {/* Themes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Themes</Text>
              <Text style={styles.sectionHint}>
                {themes.length === 0
                  ? 'All themes'
                  : `${themes.length} selected`}
              </Text>
              <View style={styles.chipGrid}>
                {POPULAR_THEMES.map((theme) => (
                  <Pressable
                    key={theme.id}
                    style={[
                      styles.chip,
                      themes.includes(theme.id) && styles.chipSelected,
                    ]}
                    onPress={() => toggleTheme(theme.id)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: themes.includes(theme.id) }}
                  >
                    {themes.includes(theme.id) && (
                      <Check size={14} color="#FFFFFF" />
                    )}
                    <Text
                      style={[
                        styles.chipText,
                        themes.includes(theme.id) && styles.chipTextSelected,
                      ]}
                    >
                      {theme.name}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Retailers */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Retailers</Text>
              <Text style={styles.sectionHint}>
                {retailers.length === 0
                  ? 'All retailers'
                  : `${retailers.length} selected`}
              </Text>
              <View style={styles.chipGrid}>
                {ALL_RETAILER_IDS.map((id) => {
                  const retailer = RETAILERS[id];
                  const isSelected = retailers.includes(id);
                  return (
                    <Pressable
                      key={id}
                      style={[
                        styles.chip,
                        isSelected && { backgroundColor: retailer.color },
                      ]}
                      onPress={() => toggleRetailer(id)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isSelected }}
                    >
                      {isSelected && <Check size={14} color="#FFFFFF" />}
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextSelected,
                        ]}
                      >
                        {retailer.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* In Stock Only Toggle */}
            <View style={styles.section}>
              <View style={styles.toggleRow}>
                <View>
                  <Text style={styles.sectionTitle}>In Stock Only</Text>
                  <Text style={styles.sectionHint}>
                    Hide out-of-stock items
                  </Text>
                </View>
                <Switch
                  value={inStockOnly}
                  onValueChange={toggleInStockOnly}
                  trackColor={{
                    false: COLORS.border,
                    true: COLORS.legoRed,
                  }}
                  thumbColor="#FFFFFF"
                />
              </View>
            </View>

            {/* Bottom padding for scroll */}
            <View style={{ height: 40 }} />
          </ScrollView>

          {/* Apply button */}
          <View style={styles.footer}>
            <Pressable
              style={({ pressed }) => [
                styles.applyButton,
                pressed && styles.applyButtonPressed,
              ]}
              onPress={onClose}
            >
              <Text style={styles.applyButtonText}>Show Results</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.overlay,
  },
  container: {
    backgroundColor: COLORS.cardBackground,
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    maxHeight: '85%',
    ...SHADOWS.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    padding: SPACING.sm,
  },
  resetText: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  closeButton: {
    padding: SPACING.sm,
  },
  content: {
    paddingHorizontal: SPACING.lg,
  },
  section: {
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderValue: {
    fontSize: 14,
    color: COLORS.legoRed,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sliderLabel: {
    fontSize: 12,
    color: COLORS.textTertiary,
  },
  priceSliders: {
    gap: SPACING.md,
  },
  priceSlider: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceLabel: {
    width: 40,
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surfaceLight,
    borderRadius: 20,
    gap: 4,
  },
  chipSelected: {
    backgroundColor: COLORS.legoRed,
  },
  chipText: {
    fontSize: 13,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  applyButton: {
    backgroundColor: COLORS.legoRed,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  applyButtonPressed: {
    opacity: 0.9,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default FilterModal;
