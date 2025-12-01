// src/components/RateAnalysisEditor.tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';
import type { RateAnalysisDoc } from '../types/tender';
import { rateAnalysisService } from '../services/rateAnalysisService';

interface Props {
  tenderId: string;
  ra: RateAnalysisDoc | null;
  onCreate?: (id: string) => void;
}

const NumberField = ({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) => {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={String(value ?? 0)}
        onChangeText={(t) => onChange(Number(t || 0))}
        accessibilityLabel={`${label} amount`}
      />
    </View>
  );
};

const RateAnalysisEditor: React.FC<Props> = ({ tenderId, ra, onCreate }) => {
  const [local, setLocal] = useState<RateAnalysisDoc | null>(ra);

  useEffect(() => setLocal(ra), [ra?.id]);

  const canEdit = !local?.isLocked || (local?.isLocked && false); // Lock UI placeholder; refined with user ID later

  const totalBreakdown = useMemo(() => {
    const rb = local?.rateBreakdown || ({} as any);
    return (
      (rb.materials || 0) +
      (rb.labour || 0) +
      (rb.plant || 0) +
      (rb.transport || 0) +
      (rb.overheads || 0) +
      (rb.profit || 0) +
      (rb.other || 0)
    );
  }, [local]);

  const save = async () => {
    if (!local) {
      // create default
      const id = await rateAnalysisService.create(tenderId, {
        description: 'New Rate Analysis',
        unit: 'Nos',
        quantity: 1,
        rateBreakdown: { materials: 0, labour: 0, plant: 0, transport: 0, overheads: 0, profit: 0, other: 0 },
      } as any);
      onCreate && onCreate(id);
      return;
    }
    await rateAnalysisService.update(tenderId, local.id, {
      description: local.description,
      unit: local.unit,
      quantity: local.quantity,
      rateBreakdown: local.rateBreakdown,
      status: local.status,
    } as any);
  };

  if (!local) {
    return (
      <View>
        <Text style={styles.empty}>No Rate Analysis selected.</Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={save} accessibilityRole="button" accessibilityLabel="Create new rate analysis">
          <Text style={styles.primaryBtnText}>Create Rate Analysis</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.row}>
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={styles.input}
          value={local.description}
          onChangeText={(t) => setLocal({ ...local, description: t })}
        />
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Unit</Text>
        <TextInput
          style={styles.input}
          value={local.unit}
          onChangeText={(t) => setLocal({ ...local, unit: t })}
        />
      </View>
      <NumberField
        label="Quantity"
        value={local.quantity}
        onChange={(n) => setLocal({ ...local, quantity: n })}
      />

      <Text style={styles.section}>Rate Breakdown</Text>
      <NumberField
        label="Materials"
        value={local.rateBreakdown.materials}
        onChange={(n) => setLocal({ ...local, rateBreakdown: { ...local.rateBreakdown, materials: n } })}
      />
      <NumberField
        label="Labour"
        value={local.rateBreakdown.labour}
        onChange={(n) => setLocal({ ...local, rateBreakdown: { ...local.rateBreakdown, labour: n } })}
      />
      <NumberField
        label="Plant"
        value={local.rateBreakdown.plant}
        onChange={(n) => setLocal({ ...local, rateBreakdown: { ...local.rateBreakdown, plant: n } })}
      />
      <NumberField
        label="Transport"
        value={local.rateBreakdown.transport}
        onChange={(n) => setLocal({ ...local, rateBreakdown: { ...local.rateBreakdown, transport: n } })}
      />
      <NumberField
        label="Overheads"
        value={local.rateBreakdown.overheads}
        onChange={(n) => setLocal({ ...local, rateBreakdown: { ...local.rateBreakdown, overheads: n } })}
      />
      <NumberField
        label="Profit"
        value={local.rateBreakdown.profit}
        onChange={(n) => setLocal({ ...local, rateBreakdown: { ...local.rateBreakdown, profit: n } })}
      />
      <NumberField
        label="Other"
        value={local.rateBreakdown.other || 0}
        onChange={(n) => setLocal({ ...local, rateBreakdown: { ...local.rateBreakdown, other: n } })}
      />

      <View style={styles.summaryRow}>
        <Text style={styles.summaryText}>Computed Rate</Text>
        <Text style={styles.summaryVal}>{totalBreakdown.toFixed(2)}</Text>
      </View>
      <View style={styles.summaryRow}>
        <Text style={styles.summaryText}>Total Amount</Text>
        <Text style={styles.summaryVal}>{(totalBreakdown * (local.quantity || 0)).toFixed(2)}</Text>
      </View>

      <TouchableOpacity style={styles.primaryBtn} onPress={save} accessibilityRole="button" accessibilityLabel="Save rate analysis">
        <Text style={styles.primaryBtnText}>Save</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    width: 120,
    fontSize: 14,
    color: colors.TEXT_PRIMARY,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: '#fff',
    minHeight: 40,
  },
  section: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    fontWeight: '700',
    fontSize: 16,
    color: colors.TEXT_PRIMARY,
  },
  summaryRow: {
    marginTop: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryText: { color: colors.TEXT_SECONDARY },
  summaryVal: { fontWeight: '700', color: colors.TEXT_PRIMARY },
  primaryBtn: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    backgroundColor: colors.ACTION_BLUE,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 6,
    minHeight: 44,
    justifyContent: 'center',
  },
  primaryBtnText: { color: '#fff', fontWeight: '600' },
  empty: { color: colors.TEXT_SECONDARY, marginBottom: spacing.sm },
});

export default RateAnalysisEditor;
