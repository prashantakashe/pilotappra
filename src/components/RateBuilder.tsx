import React, { useState, useCallback, useMemo, useEffect, memo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import type { StandardBOQRow } from '../services/boqParser';

export interface RateRevision {
  rate: number;
  amount: number;
  breakdown: {
    materials: Array<{ name: string; qty: number; unitRate: number; amount: number }>;
    labour: Array<{ name: string; qty: number; unitRate: number; amount: number }>;
    equipment: Array<{ name: string; qty: number; unitRate: number; amount: number }>;
  };
  meta: {
    ohPct: number;
    profitPct: number;
    gstPct: number;
    createdAt: string;
  };
}

interface RateBuilderProps {
  open: boolean;
  onClose: () => void;
  item: StandardBOQRow | null;
  onSaveRevision: (revision: RateRevision) => void;
}

interface BreakdownRow {
  id: string;
  name: string;
  qty: number;
  unitRate: number;
  section: 'materials' | 'labour' | 'equipment';
}

// Separate row component with local state to prevent focus loss
const RowInput: React.FC<{
  row: BreakdownRow;
  section: 'materials' | 'labour' | 'equipment';
  onUpdate: (id: string, field: string, value: string) => void;
  onCopy: (id: string, section: 'materials' | 'labour' | 'equipment') => void;
  onDelete: (id: string, section: 'materials' | 'labour' | 'equipment') => void;
}> = React.memo(({ row, section, onUpdate, onCopy, onDelete }) => {
  const [name, setName] = React.useState(row.name);
  const [qty, setQty] = React.useState(row.qty.toString());
  const [rate, setRate] = React.useState(row.unitRate.toString());

  // Only sync on initial mount or when row ID actually changes (not on parent re-render)
  const prevRowIdRef = React.useRef(row.id);
  React.useEffect(() => {
    if (prevRowIdRef.current !== row.id) {
      setName(row.name);
      setQty(row.qty.toString());
      setRate(row.unitRate.toString());
      prevRowIdRef.current = row.id;
    }
  }, [row.id, row.name, row.qty, row.unitRate]);

  const handleNameChange = (text: string) => {
    setName(text);
  };

  const handleNameBlur = () => {
    onUpdate(row.id, 'name', name);
  };

  const handleQtyChange = (text: string) => {
    setQty(text);
  };

  const handleQtyBlur = () => {
    onUpdate(row.id, 'qty', qty);
  };

  const handleRateChange = (text: string) => {
    setRate(text);
  };

  const handleRateBlur = () => {
    onUpdate(row.id, 'unitRate', rate);
  };

  const amount = (parseFloat(qty) || 0) * (parseFloat(rate) || 0);

  return (
    <View style={styles.tableRow}>
      <View style={styles.nameCell}>
        <TextInput
          style={styles.inputField}
          placeholder="Item name"
          value={name}
          onChangeText={handleNameChange}
          onBlur={handleNameBlur}
          placeholderTextColor="#999"
        />
      </View>
      <View style={styles.numberCell}>
        <TextInput
          style={[styles.inputField, styles.rightAlign]}
          placeholder="0"
          value={qty}
          onChangeText={handleQtyChange}
          onBlur={handleQtyBlur}
          keyboardType="decimal-pad"
          placeholderTextColor="#999"
        />
      </View>
      <View style={styles.numberCell}>
        <TextInput
          style={[styles.inputField, styles.rightAlign]}
          placeholder="0"
          value={rate}
          onChangeText={handleRateChange}
          onBlur={handleRateBlur}
          keyboardType="decimal-pad"
          placeholderTextColor="#999"
        />
      </View>
      <View style={styles.numberCell}>
        <View style={styles.amountCell}>
          <Text style={[styles.amountText, amount > 0 && styles.amountTextActive]}>
            {amount.toFixed(2)}
          </Text>
        </View>
      </View>
      <View style={styles.actionCell}>
        <TouchableOpacity
          style={styles.copyBtn}
          onPress={() => onCopy(row.id, section)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Copy ${row.name}`}
        >
          <Text style={styles.copyBtnText}>📋</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={() => onDelete(row.id, section)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Delete ${row.name}`}
        >
          <Text style={styles.deleteBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
});

// Memoized input component to prevent focus loss
export const RateBuilder: React.FC<RateBuilderProps> = ({
  open,
  onClose,
  item,
  onSaveRevision,
}) => {
  // State management - use a key to force re-render of row components when needed
  const [rowKey, setRowKey] = useState(0);
  
  const [materials, setMaterials] = useState<BreakdownRow[]>([
    { id: '1', name: 'Cement', qty: 2.5, unitRate: 400, section: 'materials' },
    { id: '2', name: 'Sand', qty: 1.5, unitRate: 350, section: 'materials' },
  ]);

  const [labour, setLabour] = useState<BreakdownRow[]>([
    { id: '3', name: 'Skilled Labour', qty: 2, unitRate: 500, section: 'labour' },
  ]);

  const [equipment, setEquipment] = useState<BreakdownRow[]>([
    { id: '4', name: 'Excavator', qty: 4, unitRate: 300, section: 'equipment' },
  ]);

  const [ohPct, setOhPct] = useState('10');
  const [profitPct, setProfitPct] = useState('8');
  const [gstPct, setGstPct] = useState('18');
  const [selectedRevision, setSelectedRevision] = useState<'R1' | 'R2' | 'R3' | null>(null);

  const [nextId, setNextId] = useState(5);

  // Reset when modal opens
  useEffect(() => {
    if (open && item) {
      const revisions = (item as any)?.revisions || {};
      const applyRevision = (rev: any) => {
        if (!rev) return;
        const rb = rev.breakdown || {};
        const perc = rev.percentages || {};
        if (Array.isArray(rb.materials)) {
          setMaterials(
            rb.materials.map((m: any, idx: number) => ({
              id: `m-${idx + 1}`,
              name: m.name ?? '',
              qty: Number(m.qty) || 0,
              unitRate: Number(m.unitRate) || 0,
              section: 'materials',
            }))
          );
        }
        if (Array.isArray(rb.labour)) {
          setLabour(
            rb.labour.map((l: any, idx: number) => ({
              id: `l-${idx + 1}`,
              name: l.name ?? '',
              qty: Number(l.qty) || 0,
              unitRate: Number(l.unitRate) || 0,
              section: 'labour',
            }))
          );
        }
        if (Array.isArray(rb.equipment)) {
          setEquipment(
            rb.equipment.map((e: any, idx: number) => ({
              id: `e-${idx + 1}`,
              name: e.name ?? '',
              qty: Number(e.qty) || 0,
              unitRate: Number(e.unitRate) || 0,
              section: 'equipment',
            }))
          );
        }
        if (typeof perc.overheadPct !== 'undefined') setOhPct(String(perc.overheadPct));
        if (typeof perc.profitPct !== 'undefined') setProfitPct(String(perc.profitPct));
        if (typeof perc.gstPct !== 'undefined') setGstPct(String(perc.gstPct));
      };

      // Prefer loading highest available revision: R3 -> R2 -> R1
      const pickedKey = revisions.R3 ? 'R3' : revisions.R2 ? 'R2' : revisions.R1 ? 'R1' : null;
      setSelectedRevision(pickedKey);
      if (pickedKey) {
        applyRevision(revisions[pickedKey]);
      }
    }
  }, [open, item]);

  // Calculate subtotals
  const materialsSubtotal = useMemo(() => 
    materials.reduce((sum, row) => sum + row.qty * row.unitRate, 0), [materials]);
  const labourSubtotal = useMemo(() => 
    labour.reduce((sum, row) => sum + row.qty * row.unitRate, 0), [labour]);
  const equipmentSubtotal = useMemo(() => 
    equipment.reduce((sum, row) => sum + row.qty * row.unitRate, 0), [equipment]);

  const totalSubtotal = materialsSubtotal + labourSubtotal + equipmentSubtotal;

  const oh = (totalSubtotal * parseFloat(ohPct || '0')) / 100;
  const profit = (totalSubtotal * parseFloat(profitPct || '0')) / 100;
  const subtotalWithOhProfit = totalSubtotal + oh + profit;

  const gst = (subtotalWithOhProfit * parseFloat(gstPct || '0')) / 100;
  const unitRate = subtotalWithOhProfit + gst;
  const amount = (item?.quantity || 0) * unitRate;

  // Handler for updating a row from the BreakdownRowInput component
  const handleRowUpdate = useCallback((id: string, field: string, value: string) => {
    const updateFn = (rows: BreakdownRow[]) => 
      rows.map(row => {
        if (row.id === id) {
          if (field === 'name') {
            return { ...row, name: value };
          } else if (field === 'qty') {
            return { ...row, qty: parseFloat(value) || 0 };
          } else if (field === 'unitRate') {
            return { ...row, unitRate: parseFloat(value) || 0 };
          }
        }
        return row;
      });
    
    // Find which section the row belongs to and update
    if (materials.find(r => r.id === id)) {
      setMaterials(updateFn);
    } else if (labour.find(r => r.id === id)) {
      setLabour(updateFn);
    } else if (equipment.find(r => r.id === id)) {
      setEquipment(updateFn);
    }
  }, [materials, labour, equipment]);

  // Handlers
  const addRow = useCallback((section: 'materials' | 'labour' | 'equipment') => {
    const id = nextId.toString();
    const newRow: BreakdownRow = {
      id,
      name: '',
      qty: 0,
      unitRate: 0,
      section,
    };
    setNextId(prev => prev + 1);

    if (section === 'materials') {
      setMaterials(prev => [...prev, newRow]);
    } else if (section === 'labour') {
      setLabour(prev => [...prev, newRow]);
    } else {
      setEquipment(prev => [...prev, newRow]);
    }
  }, [nextId]);

  const deleteRow = useCallback((id: string, section: 'materials' | 'labour' | 'equipment') => {
    if (section === 'materials') {
      setMaterials(prev => prev.filter((r) => r.id !== id));
    } else if (section === 'labour') {
      setLabour(prev => prev.filter((r) => r.id !== id));
    } else {
      setEquipment(prev => prev.filter((r) => r.id !== id));
    }
  }, []);

  const copyRow = useCallback((id: string, section: 'materials' | 'labour' | 'equipment') => {
    const newId = nextId.toString();
    setNextId(prev => prev + 1);

    if (section === 'materials') {
      const rowToCopy = materials.find(r => r.id === id);
      if (rowToCopy) {
        const newRow: BreakdownRow = {
          ...rowToCopy,
          id: newId,
          name: `${rowToCopy.name} (Copy)`,
        };
        setMaterials(prev => [...prev, newRow]);
      }
    } else if (section === 'labour') {
      const rowToCopy = labour.find(r => r.id === id);
      if (rowToCopy) {
        const newRow: BreakdownRow = {
          ...rowToCopy,
          id: newId,
          name: `${rowToCopy.name} (Copy)`,
        };
        setLabour(prev => [...prev, newRow]);
      }
    } else {
      const rowToCopy = equipment.find(r => r.id === id);
      if (rowToCopy) {
        const newRow: BreakdownRow = {
          ...rowToCopy,
          id: newId,
          name: `${rowToCopy.name} (Copy)`,
        };
        setEquipment(prev => [...prev, newRow]);
      }
    }
  }, [materials, labour, equipment, nextId]);

  const handleSave = useCallback(() => {
    if (!item) return;

    const getRowData = (rows: BreakdownRow[]) => rows.map((r) => ({
      name: r.name,
      qty: r.qty,
      unitRate: r.unitRate,
      amount: r.qty * r.unitRate,
    }));

    const revision: RateRevision = {
      rate: unitRate,
      amount: amount,
      breakdown: {
        materials: getRowData(materials),
        labour: getRowData(labour),
        equipment: getRowData(equipment),
      },
      meta: {
        ohPct: parseFloat(ohPct || '0'),
        profitPct: parseFloat(profitPct || '0'),
        gstPct: parseFloat(gstPct || '0'),
        createdAt: new Date().toISOString(),
      },
    };

    onSaveRevision(revision);
    onClose();
  }, [item, unitRate, amount, materials, labour, equipment, ohPct, profitPct, gstPct, onSaveRevision, onClose]);

  const getSectionColor = (section: 'materials' | 'labour' | 'equipment') => {
    switch(section) {
      case 'materials': return { bg: '#e8f5e9', border: '#4caf50', icon: '📦' };
      case 'labour': return { bg: '#e3f2fd', border: '#2196f3', icon: '👷' };
      case 'equipment': return { bg: '#fff3e0', border: '#ff9800', icon: '🏗️' };
    }
  };

  const SectionComponent = ({
    title,
    rows,
    section,
  }: {
    title: string;
    rows: BreakdownRow[];
    section: 'materials' | 'labour' | 'equipment';
  }) => {
    const colors = getSectionColor(section);
    return (
      <View>
        <View style={[styles.sectionHeader, { backgroundColor: colors.bg, borderLeftColor: colors.border }]}>
          <Text style={[styles.sectionTitle, styles.sectionIcon]}>{colors.icon}</Text>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        {rows.map((row) => (
          <RowInput
            key={row.id}
            row={row}
            section={section}
            onUpdate={handleRowUpdate}
            onCopy={copyRow}
            onDelete={deleteRow}
          />
        ))}
        <TouchableOpacity
          style={[styles.addRowBtn, { backgroundColor: colors.bg, borderTopColor: colors.border }]}
          onPress={() => addRow(section)}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={`Add ${section} row`}
        >
          <Text style={[styles.addRowBtnText, { color: colors.border }]}>+ Add {section.charAt(0).toUpperCase() + section.slice(1)}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <Modal visible={open} transparent={true} animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modal}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <View style={styles.headerContent}>
                <Text style={styles.modalTitle}>
                  Rate Builder - Item {item?.srNo}: {item?.description}
                </Text>
                <Text style={styles.modalSubtitle}>Unit: {item?.unit}</Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Text style={styles.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Main Content Area - Two Column Layout */}
            <View style={styles.contentArea}>
              {/* Left: Builder Table */}
              <View style={styles.tableWrapper}>
                {/* Sticky Table Header */}
                <View style={[styles.tableRow, styles.headerRow, styles.stickyHeader]}>
                  <View style={styles.nameCell}>
                    <Text style={styles.headerCell}>Item Name</Text>
                  </View>
                  <View style={styles.numberCell}>
                    <Text style={[styles.headerCell, styles.rightAlign]}>Qty</Text>
                  </View>
                  <View style={styles.numberCell}>
                    <Text style={[styles.headerCell, styles.rightAlign]}>Rate</Text>
                  </View>
                  <View style={styles.numberCell}>
                    <Text style={[styles.headerCell, styles.rightAlign]}>Amount</Text>
                  </View>
                  <View style={styles.actionCell}>
                    <Text style={[styles.headerCell, { fontSize: 10 }]}>Actions</Text>
                  </View>
                </View>
                
                {/* Scrollable Content */}
                <ScrollView style={styles.tableScrollView}>
                  <View style={styles.builderTable}>
                    {/* Materials Section */}
                    <SectionComponent title="MATERIALS" rows={materials} section="materials" />

                    {/* Labour Section */}
                    <SectionComponent title="LABOUR" rows={labour} section="labour" />

                    {/* Equipment Section */}
                    <SectionComponent title="EQUIPMENT" rows={equipment} section="equipment" />
                  </View>
                </ScrollView>
              </View>

            {/* Right: Summary Panel */}
            <View style={styles.summaryPanel}>
              <Text style={styles.summaryPanelTitle}>💰 Cost Summary</Text>
              
              <ScrollView style={styles.summaryScrollView} showsVerticalScrollIndicator={true}>
                <View style={styles.summarySection}>
                  <Text style={styles.summarySectionTitle}>Component Costs</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>📦 Materials</Text>
                    <Text style={styles.summaryValue}>₹ {materialsSubtotal.toFixed(2)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>👷 Labour</Text>
                    <Text style={styles.summaryValue}>₹ {labourSubtotal.toFixed(2)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>🏗️ Equipment</Text>
                    <Text style={styles.summaryValue}>₹ {equipmentSubtotal.toFixed(2)}</Text>
                  </View>
                  <View style={[styles.summaryRow, styles.summaryRowHighlight]}>
                    <Text style={styles.summaryLabelBold}>Subtotal (M+L+E)</Text>
                    <Text style={styles.summaryValueBold}>₹ {totalSubtotal.toFixed(2)}</Text>
                  </View>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summarySection}>
                  <Text style={styles.summarySectionTitle}>Additional Costs</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Overheads ({ohPct}%)</Text>
                    <Text style={styles.summaryValue}>₹ {oh.toFixed(2)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>Profit ({profitPct}%)</Text>
                    <Text style={styles.summaryValue}>₹ {profit.toFixed(2)}</Text>
                  </View>
                  <View style={[styles.summaryRow, styles.summaryRowHighlight]}>
                    <Text style={styles.summaryLabelBold}>Subtotal + OH + Profit</Text>
                    <Text style={styles.summaryValueBold}>₹ {subtotalWithOhProfit.toFixed(2)}</Text>
                  </View>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summarySection}>
                  <Text style={styles.summarySectionTitle}>Tax</Text>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>GST ({gstPct}%)</Text>
                    <Text style={styles.summaryValue}>₹ {gst.toFixed(2)}</Text>
                  </View>
                  <View style={[styles.summaryRow, styles.summaryRowHighlight]}>
                    <Text style={styles.summaryLabelBold}>Subtotal + OH + Profit + GST</Text>
                    <Text style={styles.summaryValueBold}>₹ {unitRate.toFixed(2)}</Text>
                  </View>
                </View>

                <View style={styles.summaryDivider} />

                <View style={styles.summaryFinal}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryFinalLabel}>Unit Rate (Final)</Text>
                    <Text style={styles.summaryFinalValue}>₹ {unitRate.toFixed(2)}</Text>
                  </View>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryFinalLabel}>Quantity</Text>
                    <Text style={styles.summaryFinalValue}>{item?.quantity}</Text>
                  </View>
                  <View style={[styles.summaryRow, styles.summaryTotalRow]}>
                    <Text style={styles.summaryTotalLabel}>Total Amount</Text>
                    <Text style={styles.summaryTotalValue}>₹ {amount.toFixed(2)}</Text>
                  </View>
                </View>
              </ScrollView>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.modalFooter}>
            {/* Left: Percentage Controls */}
            <View style={styles.footerControls}>
              <View style={styles.footerControlGroup}>
                <Text style={styles.footerControlLabel}>Overhead (%)</Text>
                <TextInput
                  style={styles.footerControlInput}
                  value={ohPct}
                  onChangeText={setOhPct}
                  keyboardType="decimal-pad"
                  placeholder="0"
                />
              </View>
              <View style={styles.footerControlGroup}>
                <Text style={styles.footerControlLabel}>Profit (%)</Text>
                <TextInput
                  style={styles.footerControlInput}
                  value={profitPct}
                  onChangeText={setProfitPct}
                  keyboardType="decimal-pad"
                  placeholder="0"
                />
              </View>
              <View style={styles.footerControlGroup}>
                <Text style={styles.footerControlLabel}>GST (%)</Text>
                <TextInput
                  style={styles.footerControlInput}
                  value={gstPct}
                  onChangeText={setGstPct}
                  keyboardType="decimal-pad"
                  placeholder="0"
                />
              </View>
            </View>

            {/* Right: Action Buttons */}
            <View style={styles.footerButtons}>
              <TouchableOpacity
                style={[styles.btn, styles.btnSecondary]}
                onPress={onClose}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Close"
              >
                <Text style={styles.btnText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btn, styles.btnPrimary]}
                onPress={handleSave}
                accessible={true}
                accessibilityRole="button"
                accessibilityLabel="Save Revision"
              >
                <Text style={styles.btnText}>Save Revision</Text>
              </TouchableOpacity>
            </View>
          </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },

  modal: {
    width: '90%',
    height: '90%',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    flexDirection: 'column',
  },

  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
  },

  headerContent: {
    flex: 1,
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },

  modalSubtitle: {
    fontSize: 12,
    color: '#666',
  },

  closeBtn: {
    fontSize: 24,
    color: '#666',
    marginLeft: 20,
  },

  controlsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
    gap: 15,
  },

  controlGroup: {
    flex: 0.6,
    minWidth: 80,
    maxWidth: 100,
  },

  controlLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#555',
    marginBottom: 6,
  },

  controlInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    textAlign: 'center',
  },

  contentArea: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 15,
    gap: 20,
    overflow: 'hidden',
  },

  tableWrapper: {
    flex: 2,
    maxHeight: '100%',
    backgroundColor: '#fff',
  },

  tableScrollView: {
    flex: 1,
  },

  stickyHeader: {
    position: Platform.OS === 'web' ? 'sticky' as any : 'relative',
    top: 0,
    zIndex: 10,
    backgroundColor: '#f8f9fa',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      },
      default: {
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }
    }),
  },

  summaryPanel: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#dee2e6',
    maxWidth: 350,
    display: 'flex',
    flexDirection: 'column',
  },

  summaryScrollView: {
    flex: 1,
  },

  summaryPanelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },

  summarySection: {
    marginBottom: 12,
  },

  summarySectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6c757d',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 0.5,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    paddingHorizontal: 8,
  },

  summaryRowHighlight: {
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginTop: 4,
  },

  summaryLabel: {
    fontSize: 13,
    color: '#495057',
  },

  summaryValue: {
    fontSize: 13,
    color: '#212529',
    fontWeight: '500',
  },

  summaryLabelBold: {
    fontSize: 13,
    color: '#212529',
    fontWeight: '600',
  },

  summaryValueBold: {
    fontSize: 13,
    color: '#212529',
    fontWeight: '700',
  },

  summaryDivider: {
    height: 1,
    backgroundColor: '#dee2e6',
    marginVertical: 12,
  },

  summaryFinal: {
    backgroundColor: '#e7f5ff',
    borderRadius: 6,
    padding: 12,
    borderWidth: 2,
    borderColor: '#339af0',
  },

  summaryFinalLabel: {
    fontSize: 13,
    color: '#1971c2',
    fontWeight: '600',
  },

  summaryFinalValue: {
    fontSize: 14,
    color: '#1971c2',
    fontWeight: '700',
  },

  summaryTotalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#339af0',
  },

  summaryTotalLabel: {
    fontSize: 15,
    color: '#1864ab',
    fontWeight: '700',
  },

  summaryTotalValue: {
    fontSize: 18,
    color: '#1864ab',
    fontWeight: '800',
  },

  builderTable: {
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 4,
    overflow: 'hidden',
  },

  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignItems: 'center',
    minHeight: 50,
  },

  headerRow: {
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 2,
  },

  headerCell: {
    fontWeight: '700',
    color: '#333',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  cell: {
    fontSize: 12,
    color: '#333',
  },

  nameCell: {
    flex: 2,
    marginRight: 8,
  },

  numberCell: {
    flex: 1,
    marginRight: 8,
  },

  actionCell: {
    width: 80,
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },

  rightAlign: {
    textAlign: 'right',
  },

  inputField: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 10,
    backgroundColor: '#fff',
    fontSize: 13,
    height: 42,
  },

  amountCell: {
    backgroundColor: '#f8f9fa',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 4,
    justifyContent: 'center',
    height: 42,
  },

  deleteBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8d7da',
    borderRadius: 4,
  },

  deleteBtnText: {
    color: '#dc3545',
    fontSize: 14,
    fontWeight: 'bold',
  },

  copyBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#d1ecf1',
    borderRadius: 4,
  },

  copyBtnText: {
    fontSize: 14,
  },

  amountText: {
    fontSize: 13,
    color: '#495057',
    fontWeight: '500',
  },

  amountTextActive: {
    color: '#007bff',
    fontWeight: '600',
  },

  sectionHeader: {
    backgroundColor: '#e8f4f8',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#dee2e6',
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1a1a1a',
  },

  sectionIcon: {
    fontSize: 20,
  },

  addRowBtn: {
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#d4edda',
    borderTopWidth: 2,
    borderTopColor: '#dee2e6',
    minHeight: 48,
    justifyContent: 'center',
  },

  addRowBtnText: {
    color: '#155724',
    fontSize: 13,
    fontWeight: '600',
  },



  modalFooter: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#dee2e6',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    position: 'relative',
    zIndex: 10,
  },

  footerControls: {
    flexDirection: 'row',
    gap: 15,
    alignItems: 'flex-end',
  },

  footerControlGroup: {
    minWidth: 90,
  },

  footerControlLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#555',
    marginBottom: 4,
  },

  footerControlInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    fontSize: 12,
    textAlign: 'center',
    backgroundColor: '#fff',
  },

  footerButtons: {
    flexDirection: 'row',
    gap: 10,
  },

  btn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },

  btnPrimary: {
    backgroundColor: '#007bff',
  },

  btnSecondary: {
    backgroundColor: '#6c757d',
  },

  btnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },

  revisionRow: {
    flexDirection: 'row',
    gap: 6,
  },
  revBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#adb5bd',
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  revBtnActive: {
    backgroundColor: '#e2eafc',
    borderColor: '#4c6ef5',
  },
  revBtnDisabled: {
    opacity: 0.45,
  },
  revBtnText: {
    color: '#343a40',
    fontSize: 12,
    fontWeight: '600',
  },
  revBtnTextActive: {
    color: '#1c3faa',
  },
});
