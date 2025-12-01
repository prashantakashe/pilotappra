// src/components/escalation/MasterSetupTab.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import type { EscalationMaster, EscalationFormula } from '../../types/escalation';
import { saveMasterData, updateMasterData } from '../../services/escalationService';
import { colors } from '../../theme/colors';
import { spacing } from '../../theme/spacing';
import DatePickerField from './DatePickerField';

interface MasterSetupTabProps {
  masters: EscalationMaster[];
  selectedMaster: EscalationMaster | null;
  onMasterSelect: (master: EscalationMaster) => void;
  onMasterCreated: (master: EscalationMaster) => void;
  onMasterUpdated: (master: EscalationMaster) => void;
}

const FORMULA_OPTIONS: { label: string; value: EscalationFormula }[] = [
  { label: 'CPWD 75:25 Formula', value: 'CPWD_75_25' },
  { label: 'NHAI 85:15 Formula', value: 'NHAI_85_15' },
  { label: 'IEEMA Formula', value: 'IEEMA' },
  { label: 'PWD Maharashtra (3-month avg)', value: 'PWD_MAHARASHTRA' },
  { label: 'Custom Formula', value: 'CUSTOM' },
];

// Simple Dropdown Component
const Dropdown = ({ 
  value, 
  options, 
  onSelect, 
  disabled = false,
  placeholder = 'Select...' 
}: { 
  value: string; 
  options: { label: string; value: string }[]; 
  onSelect: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) => {
  const [visible, setVisible] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);

  return (
    <>
      <TouchableOpacity
        style={[styles.dropdownButton, disabled && styles.disabledInput]}
        onPress={() => !disabled && setVisible(true)}
        disabled={disabled}
      >
        <Text style={[styles.dropdownText, !selectedOption && styles.placeholderText]}>
          {selectedOption?.label || placeholder}
        </Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={styles.dropdownModal}>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.dropdownItem,
                    item.value === value && styles.dropdownItemSelected
                  ]}
                  onPress={() => {
                    onSelect(item.value);
                    setVisible(false);
                  }}
                >
                  <Text style={[
                    styles.dropdownItemText,
                    item.value === value && styles.dropdownItemTextSelected
                  ]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const MasterSetupTab: React.FC<MasterSetupTabProps> = ({
  masters,
  selectedMaster,
  onMasterSelect,
  onMasterCreated,
  onMasterUpdated,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<{field: string; visible: boolean}>({ field: '', visible: false });
  
  // Form state - initialize from selectedMaster
  const [contractName, setContractName] = useState('');
  const [agreementNo, setAgreementNo] = useState('');
  const [workOrderNo, setWorkOrderNo] = useState('');
  const [workOrderDate, setWorkOrderDate] = useState('');
  const [baseDate, setBaseDate] = useState('');
  const [tenderFloated, setTenderFloated] = useState('');
  const [tenderSubmitted, setTenderSubmitted] = useState('');
  const [agencyName, setAgencyName] = useState('');
  const [workName, setWorkName] = useState('');
  const [receiptDate, setReceiptDate] = useState('');
  const [contractAmount, setContractAmount] = useState('');
  const [fixedPortion, setFixedPortion] = useState(
    selectedMaster?.fixedPortion?.toString() || ''
  );
  const [starCement, setStarCement] = useState(
    selectedMaster?.starCement?.toString() || ''
  );
  const [starSteel, setStarSteel] = useState(
    selectedMaster?.starSteel?.toString() || ''
  );
  const [formula, setFormula] = useState<EscalationFormula>(
    selectedMaster?.formula || 'CPWD_75_25'
  );
  const [labourWeightage, setLabourWeightage] = useState(
    selectedMaster?.weightages?.labour?.toString() || '0.22'
  );
  const [polWeightage, setPolWeightage] = useState(
    selectedMaster?.weightages?.pol?.toString() || '0.02'
  );
  const [othersWeightage, setOthersWeightage] = useState(
    selectedMaster?.weightages?.others?.toString() || '0.76'
  );
  const [cementWeightage, setCementWeightage] = useState(
    selectedMaster?.weightages?.cement?.toString() || '0'
  );
  const [steelWeightage, setSteelWeightage] = useState(
    selectedMaster?.weightages?.steel?.toString() || '0'
  );

  // Sync form with selected master
  useEffect(() => {
    if (selectedMaster) {
      setContractName(selectedMaster.contractName || '');
      setAgreementNo(selectedMaster.agreementNo || '');
      setWorkOrderNo(selectedMaster.workOrderNo || '');
      setWorkOrderDate(selectedMaster.workOrderDate || '');
      setBaseDate(selectedMaster.baseDate || '');
      setContractAmount(selectedMaster.contractAmount?.toString() || '');
      setFixedPortion(selectedMaster.fixedPortion?.toString() || '15');
      setStarCement(selectedMaster.starCement?.toString() || '4700');
      setStarSteel(selectedMaster.starSteel?.toString() || '45785');
      setFormula(selectedMaster.formula || 'CPWD_75_25');
      setLabourWeightage(selectedMaster.weightages?.labour?.toString() || '0.22');
      setPolWeightage(selectedMaster.weightages?.pol?.toString() || '0.02');
      setOthersWeightage(selectedMaster.weightages?.others?.toString() || '0.76');
      setCementWeightage(selectedMaster.weightages?.cement?.toString() || '0');
      setSteelWeightage(selectedMaster.weightages?.steel?.toString() || '0');
    }
  }, [selectedMaster]);

  const handleNewMaster = () => {
    setIsEditing(true);
    onMasterSelect(null as any); // Clear selection
    setContractName('');
    setAgreementNo('');
    setWorkOrderNo('');
    setWorkOrderDate('');
    setBaseDate('');
    setTenderFloated('');
    setTenderSubmitted('');
    setAgencyName('');
    setWorkName('');
    setReceiptDate('');
    setContractAmount('');
    setFixedPortion('15');
    setStarCement('4700');
    setStarSteel('45785');
    setFormula('CPWD_75_25');
    setLabourWeightage('0.22');
    setPolWeightage('0.02');
    setOthersWeightage('0.76');
    setCementWeightage('0');
    setSteelWeightage('0');
  };

  const handleEditMaster = () => {
    if (!selectedMaster) return;
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (selectedMaster) {
      // Restore from selected master
      setContractName(selectedMaster.contractName);
      setAgreementNo(selectedMaster.agreementNo);
      setWorkOrderNo(selectedMaster.workOrderNo);
      setWorkOrderDate(selectedMaster.workOrderDate);
      setBaseDate(selectedMaster.baseDate);
      setContractAmount(selectedMaster.contractAmount.toString());
      setFixedPortion(selectedMaster.fixedPortion.toString());
      setStarCement(selectedMaster.starCement.toString());
      setStarSteel(selectedMaster.starSteel.toString());
      setFormula(selectedMaster.formula);
      setLabourWeightage(selectedMaster.weightages.labour.toString());
      setPolWeightage(selectedMaster.weightages.pol.toString());
      setOthersWeightage(selectedMaster.weightages.others.toString());
      setCementWeightage(selectedMaster.weightages.cement.toString());
      setSteelWeightage(selectedMaster.weightages.steel.toString());
    }
    setIsEditing(false);
  };

  const validateForm = () => {
    if (!contractName.trim()) {
      Alert.alert('Validation Error', 'Contract name is required');
      return false;
    }
    if (!agreementNo.trim()) {
      Alert.alert('Validation Error', 'Agreement number is required');
      return false;
    }
    if (!workOrderDate) {
      Alert.alert('Validation Error', 'Work order date is required');
      return false;
    }
    if (!baseDate) {
      Alert.alert('Validation Error', 'Base date is required');
      return false;
    }
    if (!contractAmount || parseFloat(contractAmount) <= 0) {
      Alert.alert('Validation Error', 'Valid contract amount is required');
      return false;
    }

    // Validate weightages sum to 1.0
    const totalWeightage =
      parseFloat(labourWeightage) +
      parseFloat(polWeightage) +
      parseFloat(othersWeightage) +
      parseFloat(cementWeightage) +
      parseFloat(steelWeightage);

    if (Math.abs(totalWeightage - 1.0) > 0.01) {
      Alert.alert(
        'Validation Error',
        `Total weightage must be 1.0. Current total: ${totalWeightage.toFixed(2)}`
      );
      return false;
    }

    return true;
  };

  const handleSaveMaster = async () => {
    console.log('[MasterSetupTab] handleSaveMaster called');
    console.log('[MasterSetupTab] Form values:', {
      contractName,
      agreementNo,
      workOrderNo,
      workOrderDate,
      baseDate,
      contractAmount,
      fixedPortion,
      starCement,
      starSteel
    });
    
    if (!validateForm()) {
      console.log('[MasterSetupTab] Validation failed');
      return;
    }

    try {
      setSaving(true);
      console.log('[MasterSetupTab] Starting save operation...');

      const masterData: Omit<
        EscalationMaster,
        'id' | 'createdAt' | 'updatedAt' | 'createdBy'
      > = {
        contractName: contractName.trim(),
        agreementNo: agreementNo.trim(),
        workOrderNo: workOrderNo.trim(),
        workOrderDate: workOrderDate, // Store as ISO string YYYY-MM-DD
        baseDate: baseDate, // Store as ISO string YYYY-MM-DD
        contractAmount: parseFloat(contractAmount) || 0,
        fixedPortion: parseFloat(fixedPortion) || 15,
        starCement: parseFloat(starCement) || 4700,
        starSteel: parseFloat(starSteel) || 45785,
        formula,
        weightages: {
          labour: parseFloat(labourWeightage) || 0.22,
          pol: parseFloat(polWeightage) || 0.02,
          others: parseFloat(othersWeightage) || 0.76,
          cement: parseFloat(cementWeightage) || 0,
          steel: parseFloat(steelWeightage) || 0,
        },
        uploadedFiles: selectedMaster?.uploadedFiles || [],
      };

      console.log('[MasterSetupTab] Master data to save:', masterData);

      if (selectedMaster?.id) {
        console.log('[MasterSetupTab] Updating existing master:', selectedMaster.id);
        // Update existing
        await updateMasterData(selectedMaster.id, masterData);
        const updatedMaster: EscalationMaster = {
          ...selectedMaster,
          ...masterData,
          updatedAt: new Date(),
        };
        console.log('[MasterSetupTab] Update successful');
        onMasterUpdated(updatedMaster);
      } else {
        console.log('[MasterSetupTab] Creating new master');
        // Create new
        const newId = await saveMasterData(masterData);
        console.log('[MasterSetupTab] New master created with ID:', newId);
        const newMaster: EscalationMaster = {
          id: newId,
          ...masterData,
          createdAt: new Date(),
          updatedAt: new Date(),
          createdBy: '', // Will be set by service
        };
        onMasterCreated(newMaster);
      }

      console.log('[MasterSetupTab] Save completed successfully');
      setIsEditing(false);
    } catch (error: any) {
      console.error('[MasterSetupTab] Error saving master:', error);
      console.error('[MasterSetupTab] Error stack:', error.stack);
      Alert.alert('Error', `Failed to save master data: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Master Selection */}
      {!isEditing && masters.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Master</Text>
          <Dropdown
            value={selectedMaster?.id || ''}
            options={[
              { label: '-- Select Master --', value: '' },
              ...masters.map(master => ({
                label: `${master.contractName} (${master.agreementNo})`,
                value: master.id
              }))
            ]}
            onSelect={(value) => {
              const master = masters.find((m) => m.id === value);
              if (master) onMasterSelect(master);
            }}
            placeholder="-- Select Master --"
          />
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        {!isEditing ? (
          <>
            <TouchableOpacity style={styles.primaryButton} onPress={handleNewMaster}>
              <Text style={styles.primaryButtonText}>➕ New Master</Text>
            </TouchableOpacity>
            {selectedMaster && (
              <TouchableOpacity style={styles.secondaryButton} onPress={handleEditMaster}>
                <Text style={styles.secondaryButtonText}>✏️ Edit</Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          <>
            <TouchableOpacity
              style={[styles.primaryButton, saving && styles.disabledButton]}
              onPress={handleSaveMaster}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.primaryButtonText}>💾 Save</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleCancelEdit}
              disabled={saving}
            >
              <Text style={styles.secondaryButtonText}>❌ Cancel</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* Form */}
      <View style={styles.form}>
        {/* Contract Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contract Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contract Name *</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={contractName}
              onChangeText={setContractName}
              placeholder="Enter contract name"
              editable={isEditing}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Agreement Number *</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={agreementNo}
              onChangeText={setAgreementNo}
              placeholder="Enter agreement number"
              editable={isEditing}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Work Order Number</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={workOrderNo}
              onChangeText={setWorkOrderNo}
              placeholder="Enter work order number"
              editable={isEditing}
            />
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputGroupHalf}>
              <DatePickerField
                label="Work Order Date"
                value={workOrderDate}
                onChangeDate={setWorkOrderDate}
                disabled={!isEditing}
                required
              />
            </View>

            <View style={styles.inputGroupHalf}>
              <DatePickerField
                label="Base Date"
                value={baseDate}
                onChangeDate={setBaseDate}
                disabled={!isEditing}
                required
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contract Amount (₹) *</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={contractAmount}
              onChangeText={setContractAmount}
              placeholder="Enter contract amount"
              keyboardType="numeric"
              editable={isEditing}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fixed Portion (%)</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={fixedPortion}
              onChangeText={setFixedPortion}
              placeholder="Enter fixed portion percentage"
              keyboardType="numeric"
              editable={isEditing}
            />
          </View>
        </View>

        {/* Star Rates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Star Rates (₹ per unit)</Text>
          
          <View style={styles.inputRow}>
            <View style={styles.inputGroupHalf}>
              <Text style={styles.label}>Star Cement Rate</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.disabledInput]}
                value={starCement}
                onChangeText={setStarCement}
                placeholder="₹ per quintal"
                keyboardType="numeric"
                editable={isEditing}
              />
            </View>

            <View style={styles.inputGroupHalf}>
              <Text style={styles.label}>Star Steel Rate</Text>
              <TextInput
                style={[styles.input, !isEditing && styles.disabledInput]}
                value={starSteel}
                onChangeText={setStarSteel}
                placeholder="₹ per quintal"
                keyboardType="numeric"
                editable={isEditing}
              />
            </View>
          </View>
        </View>

        {/* Formula Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Escalation Formula</Text>
          <Dropdown
            value={formula}
            options={FORMULA_OPTIONS}
            onSelect={(value) => setFormula(value as EscalationFormula)}
            disabled={!isEditing}
            placeholder="Select Formula"
          />
        </View>

        {/* Weightages */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Component Weightages</Text>
          <Text style={styles.helperText}>Total must equal 1.0</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Labour Weightage</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={labourWeightage}
              onChangeText={setLabourWeightage}
              placeholder="0.22"
              keyboardType="numeric"
              editable={isEditing}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>POL Weightage</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={polWeightage}
              onChangeText={setPolWeightage}
              placeholder="0.02"
              keyboardType="numeric"
              editable={isEditing}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Others Weightage</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={othersWeightage}
              onChangeText={setOthersWeightage}
              placeholder="0.76"
              keyboardType="numeric"
              editable={isEditing}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Cement Weightage</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={cementWeightage}
              onChangeText={setCementWeightage}
              placeholder="0"
              keyboardType="numeric"
              editable={isEditing}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Steel Weightage</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={steelWeightage}
              onChangeText={setSteelWeightage}
              placeholder="0"
              keyboardType="numeric"
              editable={isEditing}
            />
          </View>

          <View style={styles.totalWeightage}>
            <Text style={styles.totalWeightageLabel}>Total:</Text>
            <Text
              style={[
                styles.totalWeightageValue,
                Math.abs(
                  parseFloat(labourWeightage || '0') +
                    parseFloat(polWeightage || '0') +
                    parseFloat(othersWeightage || '0') +
                    parseFloat(cementWeightage || '0') +
                    parseFloat(steelWeightage || '0') -
                    1.0
                ) > 0.01 && styles.totalWeightageError,
              ]}
            >
              {(
                parseFloat(labourWeightage || '0') +
                parseFloat(polWeightage || '0') +
                parseFloat(othersWeightage || '0') +
                parseFloat(cementWeightage || '0') +
                parseFloat(steelWeightage || '0')
              ).toFixed(2)}
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  section: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.TEXT_PRIMARY,
    marginBottom: spacing.md,
  },
  helperText: {
    fontSize: 12,
    color: colors.TEXT_SECONDARY,
    marginBottom: spacing.sm,
    fontStyle: 'italic',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: colors.ACTION_BLUE,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.BORDER_LIGHT,
  },
  secondaryButtonText: {
    color: colors.TEXT_PRIMARY,
    fontSize: 14,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  form: {
    padding: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  inputGroupHalf: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.TEXT_PRIMARY,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.BORDER_LIGHT,
    borderRadius: 6,
    padding: 12,
    fontSize: 14,
    color: colors.TEXT_PRIMARY,
    backgroundColor: '#fff',
  },
  disabledInput: {
    backgroundColor: '#f9f9f9',
    color: colors.TEXT_SECONDARY,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.BORDER_LIGHT,
    borderRadius: 6,
    padding: 12,
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: 14,
    color: colors.TEXT_PRIMARY,
    flex: 1,
  },
  placeholderText: {
    color: colors.TEXT_SECONDARY,
  },
  dropdownArrow: {
    fontSize: 12,
    color: colors.TEXT_SECONDARY,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dropdownModal: {
    backgroundColor: '#fff',
    borderRadius: 8,
    maxHeight: 400,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.BORDER_LIGHT,
  },
  dropdownItemSelected: {
    backgroundColor: colors.PRIMARY_LIGHT,
  },
  dropdownItemText: {
    fontSize: 14,
    color: colors.TEXT_PRIMARY,
  },
  dropdownItemTextSelected: {
    fontWeight: '600',
    color: colors.ACTION_BLUE,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: colors.BORDER_LIGHT,
    borderRadius: 6,
    backgroundColor: '#fff',
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  totalWeightage: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.md,
    borderTopWidth: 2,
    borderTopColor: colors.BORDER_LIGHT,
    marginTop: spacing.md,
  },
  totalWeightageLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.TEXT_PRIMARY,
  },
  totalWeightageValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.SUCCESS_GREEN,
  },
  totalWeightageError: {
    color: colors.ERROR_RED,
  },
});

export default MasterSetupTab;
