import { useMemo, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { Circle, Defs, LinearGradient, Line, Path, Stop, Svg } from 'react-native-svg';
import type { Colors } from '../../constants/theme';
import { spacing } from '../../constants/theme';
import { useLocale, type Locale } from '../../context/LocaleContext';
import { useTheme } from '../../context/ThemeContext';
import type { WeightLog } from '../../hooks/useWeightLogs';
import { formatShortDate } from '../../lib/format';

type WeightChartProps = {
  logs: WeightLog[];
  target: number | null;
  /** Selected period's span in days — denser periods (3j/7j) show more axis labels, sparser ones (90j) show fewer. */
  periodDays: number;
};

const CHART_HEIGHT = 180;
const DOMAIN_PADDING_RATIO = 0.15;

function formatAxisDate(iso: string, locale: Locale): string {
  const date = new Date(`${iso}T00:00:00`);
  return formatShortDate(date, locale);
}

/** How many axis labels to show for a given period — short periods have room for one per log, longer ones need to stay sparse. */
function pickAxisLabelCount(periodDays: number): number {
  if (periodDays <= 7) return 7;
  if (periodDays <= 30) return 3;
  return 5;
}

/** `count` indices spread evenly across `[0, total - 1]`, always including both ends. */
function evenIndices(total: number, count: number): number[] {
  if (total <= 0) return [];
  if (count >= total) return Array.from({ length: total }, (_, i) => i);
  if (count <= 1) return [0];
  const step = (total - 1) / (count - 1);
  return Array.from(new Set(Array.from({ length: count }, (_, i) => Math.round(i * step))));
}

export default function WeightChart({ logs, target, periodDays }: WeightChartProps) {
  const { colors } = useTheme();
  const { t, locale } = useLocale();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [width, setWidth] = useState(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  if (logs.length < 2) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>{t('progression.weightChart.empty')}</Text>
      </View>
    );
  }

  const values = logs.map((log) => log.poids);
  const domainValues = target != null ? [...values, target] : values;
  const rawMin = Math.min(...domainValues);
  const rawMax = Math.max(...domainValues);
  const range = rawMax - rawMin || 1;
  const domainMin = rawMin - range * DOMAIN_PADDING_RATIO;
  const domainMax = rawMax + range * DOMAIN_PADDING_RATIO;
  const domainRange = domainMax - domainMin || 1;

  const x = (index: number) => (logs.length === 1 ? width / 2 : (index / (logs.length - 1)) * width);
  const y = (value: number) => CHART_HEIGHT - ((value - domainMin) / domainRange) * CHART_HEIGHT;

  const linePath = logs.map((log, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(log.poids)}`).join(' ');
  const areaPath = `${linePath} L ${x(logs.length - 1)} ${CHART_HEIGHT} L ${x(0)} ${CHART_HEIGHT} Z`;

  const targetY = target != null && target >= domainMin && target <= domainMax ? y(target) : null;

  const labelIndices = evenIndices(logs.length, pickAxisLabelCount(periodDays));

  return (
    <View>
      <View style={styles.chartWrap} onLayout={handleLayout}>
        {width > 0 && (
          <Svg width={width} height={CHART_HEIGHT}>
            <Defs>
              <LinearGradient id="weightAreaGradient" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={colors.accent} stopOpacity={0.25} />
                <Stop offset="1" stopColor={colors.accent} stopOpacity={0} />
              </LinearGradient>
            </Defs>

            <Path d={areaPath} fill="url(#weightAreaGradient)" stroke="none" />

            {targetY != null && (
              <Line
                x1={0}
                y1={targetY}
                x2={width}
                y2={targetY}
                stroke={colors.textTertiary}
                strokeWidth={1}
                strokeDasharray="4,4"
              />
            )}

            <Path d={linePath} stroke={colors.accent} strokeWidth={2} fill="none" strokeLinejoin="round" strokeLinecap="round" />

            {logs.map((log, i) => (
              <Circle key={log.id} cx={x(i)} cy={y(log.poids)} r={3} fill={colors.accent} />
            ))}
          </Svg>
        )}

        {targetY != null && (
          <Text style={[styles.targetLabel, { top: Math.max(0, targetY - 16) }]}>
            {t('progression.weightChart.target')}
          </Text>
        )}
      </View>

      <View style={styles.axisRow}>
        {labelIndices.map((index) => (
          <Text key={logs[index].id} style={styles.axisLabel}>
            {formatAxisDate(logs[index].date, locale)}
          </Text>
        ))}
      </View>
    </View>
  );
}

function makeStyles(colors: Colors) {
  return StyleSheet.create({
    chartWrap: {
      height: CHART_HEIGHT,
      width: '100%',
    },
    targetLabel: {
      position: 'absolute',
      right: 0,
      fontSize: 10,
      fontWeight: '600',
      color: colors.textTertiary,
      backgroundColor: colors.background,
      paddingHorizontal: 4,
    },
    axisRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.xs,
    },
    axisLabel: {
      fontSize: 10,
      color: colors.textTertiary,
    },
    emptyState: {
      height: CHART_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
    },
    emptyText: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: 'center',
    },
  });
}
