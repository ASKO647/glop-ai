import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';
import type { ProblemAnalysis } from '../../lib/skincare';
import ProductSuggestionCard from './ProductSuggestionCard';

function BulletList({ items, dotColor, styles }: { items: string[]; dotColor: string; styles: ReturnType<typeof makeStyles> }) {
  return (
    <View style={styles.list}>
      {items.map((item, index) => (
        <View key={index} style={styles.listRow}>
          <View style={[styles.dot, { backgroundColor: dotColor }]} />
          <Text style={styles.listText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export default function ProblemResultCard({ analysis }: { analysis: ProblemAnalysis }) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <View style={styles.zoneRow}>
        <Text style={styles.zone}>{analysis.zone}</Text>
        <View style={styles.delayPill}>
          <Text style={styles.delayText}>{analysis.delai_amelioration}</Text>
        </View>
      </View>
      <Text style={styles.observation}>{analysis.observation}</Text>

      {analysis.causes_probables.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('skincare.result.probableCauses')}</Text>
          <BulletList items={analysis.causes_probables} dotColor={colors.warning} styles={styles} />
        </View>
      )}

      {analysis.actions.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('skincare.result.recommendedActions')}</Text>
          <BulletList items={analysis.actions} dotColor={colors.accent} styles={styles} />
        </View>
      )}

      {analysis.produits_suggeres.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('skincare.result.suggestedProducts')}</Text>
          <View style={styles.products}>
            {analysis.produits_suggeres.map((product, index) => (
              <ProductSuggestionCard key={index} product={product} />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      padding: spacing.md,
      gap: spacing.md,
    },
    zoneRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    zone: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.textPrimary,
      flex: 1,
    },
    delayPill: {
      backgroundColor: colors.background,
      borderRadius: radii.full,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    },
    delayText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.accent,
    },
    observation: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 19,
    },
    section: {
      gap: spacing.xs,
    },
    sectionTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.textPrimary,
    },
    list: {
      gap: 6,
    },
    listRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.xs,
    },
    dot: {
      width: 6,
      height: 6,
      borderRadius: radii.full,
      marginTop: 6,
    },
    listText: {
      flex: 1,
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    products: {
      gap: spacing.xs,
    },
  });
}
