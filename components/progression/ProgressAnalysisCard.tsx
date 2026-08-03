import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { Colors } from '../../constants/theme';
import { radii, spacing } from '../../constants/theme';
import { useTheme } from '../../context/ThemeContext';
import type { ProgressAnalysis } from '../../lib/progressAnalysis';
import Button from '../ui/Button';
import ScoreRing from './ScoreRing';

type ProgressAnalysisCardProps = {
  analysis: ProgressAnalysis | null;
  loading: boolean;
  error: string | null;
  canAnalyze: boolean;
  onAnalyze: () => void;
};

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

export default function ProgressAnalysisCard({ analysis, loading, error, canAnalyze, onAnalyze }: ProgressAnalysisCardProps) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      {!analysis && (
        <>
          <Button label="Analyser ma progression" onPress={onAnalyze} loading={loading} disabled={!canAnalyze || loading} />
          {!canAnalyze && <Text style={styles.hint}>Ajoute au moins deux photos pour lancer l'analyse.</Text>}
        </>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      {analysis && (
        <View style={styles.resultCard}>
          <View style={styles.scoreRow}>
            <ScoreRing score={analysis.score} />
            <Text style={styles.resume}>{analysis.resume}</Text>
          </View>

          {analysis.points_positifs.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Points positifs</Text>
              <BulletList items={analysis.points_positifs} dotColor={colors.accent} styles={styles} />
            </View>
          )}

          {analysis.axes_travail.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Axes de travail</Text>
              <BulletList items={analysis.axes_travail} dotColor={colors.warning} styles={styles} />
            </View>
          )}

          <Button label="Réanalyser" variant="secondary" onPress={onAnalyze} loading={loading} disabled={loading} />
        </View>
      )}
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    container: {
      gap: spacing.sm,
    },
    hint: {
      fontSize: 12,
      color: colors.textTertiary,
      textAlign: 'center',
    },
    error: {
      fontSize: 13,
      color: colors.danger,
      textAlign: 'center',
    },
    resultCard: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radii.lg,
      padding: spacing.md,
      gap: spacing.md,
    },
    scoreRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    resume: {
      flex: 1,
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
  });
}
