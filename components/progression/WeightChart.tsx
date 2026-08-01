import { useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { Circle, Defs, LinearGradient, Line, Path, Stop, Svg } from 'react-native-svg';
import type { WeightLog } from '../../hooks/useWeightLogs';
import { colors, spacing } from '../../constants/theme';

type WeightChartProps = {
  logs: WeightLog[];
  target: number | null;
};

const CHART_HEIGHT = 180;
const DOMAIN_PADDING_RATIO = 0.15;

function formatAxisDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function WeightChart({ logs, target }: WeightChartProps) {
  const [width, setWidth] = useState(0);

  const handleLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  if (logs.length < 2) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>Ajoute au moins deux pesées pour voir ta courbe</Text>
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

  const firstLabel = formatAxisDate(logs[0].date);
  const lastLabel = formatAxisDate(logs[logs.length - 1].date);
  const midLabel = logs.length > 2 ? formatAxisDate(logs[Math.floor((logs.length - 1) / 2)].date) : null;

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
          <Text style={[styles.targetLabel, { top: Math.max(0, targetY - 16) }]}>Objectif</Text>
        )}
      </View>

      <View style={styles.axisRow}>
        <Text style={styles.axisLabel}>{firstLabel}</Text>
        {midLabel && <Text style={styles.axisLabel}>{midLabel}</Text>}
        <Text style={styles.axisLabel}>{lastLabel}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
