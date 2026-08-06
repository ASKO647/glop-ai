import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useLocale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';
import type { EvolutionAnalysis } from '../../lib/skincare';
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

export default function EvolutionResultCard({ analysis }: { analysis: EvolutionAnalysis }) {
  const { colors } = useTheme();
  const { t } = useLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <Text style={styles.resume}>{analysis.resume}</Text>

      {analysis.ameliorations.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('skincare.result.improvements')}</Text>
          <BulletList items={analysis.ameliorations} dotColor={colors.accent} styles={styles} />
        </View>
      )}

      {analysis.points_attention.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('skincare.result.attentionPoints')}</Text>
          <BulletList items={analysis.points_attention} dotColor={colors.warning} styles={styles} />
        </View>
      )}

      {analysis.conseils.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('skincare.result.advice')}</Text>
          <BulletList items={analysis.conseils} dotColor={colors.textTertiary} styles={styles} />
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
    resume: {
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
