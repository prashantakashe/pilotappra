import React, { useState } from 'react';
import { Alert } from 'react-native';
import { View, StyleSheet, Text, Platform, ScrollView } from 'react-native';
import { TextInput, Button } from 'react-native-paper';
// Use react-native-paper Dropdown or fallback to native select for web
import DateTimePicker from '@react-native-community/datetimepicker';

const PROJECT_TYPES = [
  'Building',
  'Road',
  'Metro',
  'Net Zero',
  'Sports',
  'Cold Storage',
];

const COMPLETION_UNITS = ['Months', 'Days', 'Years'];

export interface ProjectFormValues {
  name: string;
  shortName: string;
  type: string;
  employer: string;
  pmc: string;
  address: string;
  startDate: Date | null;
  durationValue: string;
  durationUnit: string;
  completionDate: Date | null;
  extCompletion1: Date | null;
  extCompletion2: Date | null;
  tenderAmount: string;
  percentageAboveBelow: string;
  gstPercent: string;
  additionalWorkAmount: string;
}

interface ProjectFormProps {
  initialValues?: Partial<ProjectFormValues>;
  onSubmit: (values: ProjectFormValues) => void;
  onCancel: () => void;
  submitLabel?: string;
}

const ProjectForm: React.FC<ProjectFormProps> = ({ initialValues = {}, onSubmit, onCancel, submitLabel = 'Save' }) => {
  const [values, setValues] = useState<ProjectFormValues>({
    name: initialValues.name || initialValues.nameOfWork || '',
    shortName: initialValues.shortName || initialValues.nameOfWorkShort || '',
    type: initialValues.type || '',
    employer: initialValues.employer || '',
    pmc: initialValues.pmc || '',
    address: initialValues.address || initialValues.projectLocation || '',
    startDate: initialValues.startDate || (initialValues.startDate ? new Date(initialValues.startDate) : null),
    durationValue: initialValues.durationValue || '',
    durationUnit: initialValues.durationUnit || COMPLETION_UNITS[0],
    completionDate: initialValues.completionDate || (initialValues.completionDate ? new Date(initialValues.completionDate) : null),
    extCompletion1: initialValues.extCompletion1 || (initialValues.extCompletion1 ? new Date(initialValues.extCompletion1) : null),
    extCompletion2: initialValues.extCompletion2 || (initialValues.extCompletion2 ? new Date(initialValues.extCompletion2) : null),
    tenderAmount: initialValues.tenderAmount || '',
    percentageAboveBelow: initialValues.percentageAboveBelow || '',
    gstPercent: initialValues.gstPercent || '',
    additionalWorkAmount: initialValues.additionalWorkAmount || '',
  });
    // --- Calculation helpers ---
    const tenderAmountNum = parseFloat(values.tenderAmount) || 0;
    const percentAboveBelowNum = parseFloat(values.percentageAboveBelow) || 0;
    const gstPercentNum = parseFloat(values.gstPercent) || 0;
    const additionalWorkAmountNum = parseFloat(values.additionalWorkAmount) || 0;

    // Contract Amount = Tender Amount + (Tender Amount * % Above/Below / 100)
    const contractAmount = tenderAmountNum + (tenderAmountNum * percentAboveBelowNum / 100);

    // Revised Contract Value = Contract Amount + Additional Work Amount (if any)
    const revisedContractValue = additionalWorkAmountNum > 0 ? contractAmount + additionalWorkAmountNum : undefined;

    // Contract Amount with GST = (Contract Amount or Revised) + (that * GST % / 100)
    const baseForGst = revisedContractValue !== undefined ? revisedContractValue : contractAmount;
    const contractAmountWithGst = baseForGst + (baseForGst * gstPercentNum / 100);

    // Currency formatter
    const formatCurrency = (num: number) => `₹ ${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    // Percentage formatter
    const formatPercent = (num: number) => `${num.toFixed(2)} %`;
  const [showStartDate, setShowStartDate] = useState(false);
  const [showDuration, setShowDuration] = useState(false);
  const [showExt1, setShowExt1] = useState(false);
  const [showExt2, setShowExt2] = useState(false);

  // Error state for missing fields
  const [errors, setErrors] = useState<string[]>([]);

  // Helper to validate required fields and return missing field names
  function getMissingFields() {
    const missing = [];
    if (!values.name) missing.push('Project Name');
    if (!values.shortName) missing.push('Short Name');
    if (!values.type) missing.push('Project Type');
    if (!values.employer) missing.push('Employer Name');
    if (!values.pmc) missing.push('PMC Name');
    if (!values.address) missing.push('Project Address');
    if (!values.startDate) missing.push('Start Date');
    if (!values.durationValue) missing.push('Project Duration');
    if (!values.durationUnit) missing.push('Duration Unit');
    if (!values.completionDate) missing.push('Completion Date');
    return missing;
  }

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.form, { paddingBottom: 80 }]}> 
      {errors.length > 0 && (
        <View style={{ backgroundColor: '#ffeaea', borderRadius: 8, padding: 12, marginBottom: 16, borderColor: '#e53935', borderWidth: 1 }}>
          <Text style={{ color: '#e53935', fontWeight: 'bold', marginBottom: 4 }}>Please fill the following required fields:</Text>
          {errors.map((err, i) => (
            <Text key={i} style={{ color: '#e53935', marginLeft: 8 }}>• {err}</Text>
          ))}
        </View>
      )}
      <TextInput
        label="Project Name"
        value={values.name}
        onChangeText={text => setValues(v => ({ ...v, name: text }))}
        style={styles.input}
      />
      <TextInput
        label="Project Short Name"
        value={values.shortName}
        onChangeText={text => setValues(v => ({ ...v, shortName: text }))}
        style={styles.input}
      />
      {/* Project Type Dropdown */}
      <Text style={styles.label}>Project Type</Text>
      {Platform.OS === 'web' ? (
        <select
          value={values.type}
          onChange={e => setValues(v => ({ ...v, type: e.target.value }))}
          style={{ ...styles.input, padding: 8, borderRadius: 6, borderColor: '#ccc', borderWidth: 1 }}
        >
          <option value="">Select Type</option>
          {PROJECT_TYPES.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      ) : (
        <TextInput
          label="Project Type"
          value={values.type}
          onFocus={() => {}}
          onChangeText={text => setValues(v => ({ ...v, type: text }))}
          style={styles.input}
          placeholder="Select or type project type"
        />
      )}
      <TextInput
        label="Employer Name"
        value={values.employer}
        onChangeText={text => setValues(v => ({ ...v, employer: text }))}
        style={styles.input}
      />
      <TextInput
        label="PMC Name"
        value={values.pmc}
        onChangeText={text => setValues(v => ({ ...v, pmc: text }))}
        style={styles.input}
      />
      <TextInput
        label="Project Address"
        value={values.address}
        onChangeText={text => setValues(v => ({ ...v, address: text }))}
        style={styles.input}
      />
      {/* Date Pickers: Use native input for web, DateTimePicker for mobile */}
      <Text style={styles.label}>Start Date</Text>
      {Platform.OS === 'web' ? (
        <input
          type="date"
          value={values.startDate && values.startDate instanceof Date ? values.startDate.toISOString().substring(0, 10) : ''}
          onChange={e => {
            const val = e.target.value;
            setValues(v => ({ ...v, startDate: val ? new Date(val + 'T00:00:00') : null }));
          }}
          style={{ ...styles.input, padding: 8, borderRadius: 6, borderColor: '#ccc', borderWidth: 1 }}
        />
      ) : (
        <>
          <Button onPress={() => setShowStartDate(true)} mode="outlined" style={styles.input}>
            {values.startDate ? `Start Date: ${values.startDate.toLocaleDateString()}` : 'Select Start Date'}
          </Button>
          {showStartDate && (
            <DateTimePicker
              value={values.startDate || new Date()}
              mode="date"
              display="default"
              onChange={(_, date) => {
                setShowStartDate(false);
                if (date) setValues(v => ({ ...v, startDate: date }));
              }}
            />
          )}
        </>
      )}
      <Text style={styles.label}>Project Duration</Text>
      <View style={styles.row}>
        <TextInput
          label="Duration"
          value={values.durationValue}
          onChangeText={text => setValues(v => ({ ...v, durationValue: text }))}
          style={[styles.input, { flex: 2 }]}
          keyboardType="numeric"
        />
        {Platform.OS === 'web' ? (
          <select
            value={values.durationUnit}
            onChange={e => setValues(v => ({ ...v, durationUnit: e.target.value }))}
            style={{ ...styles.input, padding: 8, borderRadius: 6, borderColor: '#ccc', borderWidth: 1, flex: 1, marginLeft: 8 }}
          >
            {COMPLETION_UNITS.map(unit => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
        ) : (
          <View style={{ flex: 1, marginLeft: 8 }}>
            {COMPLETION_UNITS.map(unit => (
              <Button
                key={unit}
                mode={values.durationUnit === unit ? 'contained' : 'outlined'}
                onPress={() => setValues(v => ({ ...v, durationUnit: unit }))}
                style={styles.dropdownBtn}
              >
                {unit}
              </Button>
            ))}
          </View>
        )}
      </View>
      <Text style={styles.label}>Completion Date</Text>
      {Platform.OS === 'web' ? (
        <input
          type="date"
          value={values.completionDate && values.completionDate instanceof Date ? values.completionDate.toISOString().substring(0, 10) : ''}
          onChange={e => {
            const val = e.target.value;
            setValues(v => ({ ...v, completionDate: val ? new Date(val + 'T00:00:00') : null }));
          }}
          style={{ ...styles.input, padding: 8, borderRadius: 6, borderColor: '#ccc', borderWidth: 1 }}
        />
      ) : (
        <>
          <Button onPress={() => setShowDuration(true)} mode="outlined" style={styles.input}>
            {values.completionDate ? `Completion Date: ${values.completionDate.toLocaleDateString()}` : 'Select Completion Date'}
          </Button>
          {showDuration && (
            <DateTimePicker
              value={values.completionDate || new Date()}
              mode="date"
              display="default"
              onChange={(_, date) => {
                setShowDuration(false);
                if (date) setValues(v => ({ ...v, completionDate: date }));
              }}
            />
          )}
        </>
      )}
      {/* --- Financial Fields --- */}
      <Text style={styles.label}>Tender Amount</Text>
      <TextInput
        label="Tender Amount (₹)"
        value={values.tenderAmount}
        onChangeText={text => setValues(v => ({ ...v, tenderAmount: text.replace(/[^\d.]/g, '') }))}
        style={styles.input}
        keyboardType="numeric"
        left={<TextInput.Affix text="₹" />}
      />
      <Text style={styles.label}>Percentage (Above / Below)</Text>
      <TextInput
        label="% Above / Below"
        value={values.percentageAboveBelow}
        onChangeText={text => setValues(v => ({ ...v, percentageAboveBelow: text.replace(/[^\d.-]/g, '') }))}
        style={styles.input}
        keyboardType="numeric"
        right={<TextInput.Affix text="%" />}
      />
      <Text style={styles.label}>Contract Amount</Text>
      <TextInput
        label="Contract Amount (₹)"
        value={values.tenderAmount || values.percentageAboveBelow ? formatCurrency(contractAmount) : ''}
        style={styles.input}
        editable={false}
        left={<TextInput.Affix text="₹" />}
      />
      <Text style={styles.label}>GST %</Text>
      <TextInput
        label="GST %"
        value={values.gstPercent}
        onChangeText={text => setValues(v => ({ ...v, gstPercent: text.replace(/[^\d.]/g, '') }))}
        style={styles.input}
        keyboardType="numeric"
        right={<TextInput.Affix text="%" />}
      />
      <Text style={styles.label}>Additional Work Amount</Text>
      <TextInput
        label="Additional Work Amount (₹)"
        value={values.additionalWorkAmount}
        onChangeText={text => setValues(v => ({ ...v, additionalWorkAmount: text.replace(/[^\d.]/g, '') }))}
        style={styles.input}
        keyboardType="numeric"
        left={<TextInput.Affix text="₹" />}
      />
      <Text style={styles.label}>Revised Contract Value</Text>
      <TextInput
        label="Revised Contract Value (₹)"
        value={additionalWorkAmountNum > 0 ? formatCurrency(revisedContractValue!) : ''}
        style={styles.input}
        editable={false}
        left={<TextInput.Affix text="₹" />}
      />
      <Text style={styles.label}>Contract Amount with GST</Text>
      <TextInput
        label="Contract Amount with GST (₹)"
        value={values.tenderAmount || values.percentageAboveBelow || values.gstPercent ? formatCurrency(contractAmountWithGst) : ''}
        style={styles.input}
        editable={false}
        left={<TextInput.Affix text="₹" />}
      />

      {/* --- Work Status Section (placeholders for now) --- */}
      <Text style={[styles.label, { marginTop: 16 }]}>Work Status</Text>
      <Text style={styles.label}>R A Bill No.</Text>
      <TextInput value={''} style={styles.input} editable={false} placeholder="Auto from Bill tab" />
      <Text style={styles.label}>Gross Bill Amount</Text>
      <TextInput value={''} style={styles.input} editable={false} placeholder="Auto from Bill tab" left={<TextInput.Affix text="₹" />} />
      <Text style={styles.label}>Gross Bill Amount with GST</Text>
      <TextInput value={''} style={styles.input} editable={false} placeholder="Auto from Bill tab" left={<TextInput.Affix text="₹" />} />
      <Text style={styles.label}>Financial Work Progress</Text>
      <TextInput value={''} style={styles.input} editable={false} placeholder="Auto-calculated" right={<TextInput.Affix text="%" />} />
      <Text style={styles.label}>Balance Amount of Work</Text>
      <TextInput value={''} style={styles.input} editable={false} placeholder="Auto-calculated" left={<TextInput.Affix text="₹" />} />
      <Text style={styles.label}>Extended Completion Date 1</Text>
      {Platform.OS === 'web' ? (
        <input
          type="date"
          value={values.extCompletion1 && values.extCompletion1 instanceof Date ? values.extCompletion1.toISOString().substring(0, 10) : ''}
          onChange={e => {
            const val = e.target.value;
            setValues(v => ({ ...v, extCompletion1: val ? new Date(val + 'T00:00:00') : null }));
          }}
          style={{ ...styles.input, padding: 8, borderRadius: 6, borderColor: '#ccc', borderWidth: 1 }}
        />
      ) : (
        <>
          <Button onPress={() => setShowExt1(true)} mode="outlined" style={styles.input}>
            {values.extCompletion1 ? `Extended Completion Date 1: ${values.extCompletion1.toLocaleDateString()}` : 'Select Extended Completion Date 1'}
          </Button>
          {showExt1 && (
            <DateTimePicker
              value={values.extCompletion1 || new Date()}
              mode="date"
              display="default"
              onChange={(_, date) => {
                setShowExt1(false);
                if (date) setValues(v => ({ ...v, extCompletion1: date }));
              }}
            />
          )}
        </>
      )}
      <Text style={styles.label}>Extended Completion Date 2</Text>
      {Platform.OS === 'web' ? (
        <input
          type="date"
          value={values.extCompletion2 && values.extCompletion2 instanceof Date ? values.extCompletion2.toISOString().substring(0, 10) : ''}
          onChange={e => {
            const val = e.target.value;
            setValues(v => ({ ...v, extCompletion2: val ? new Date(val + 'T00:00:00') : null }));
          }}
          style={{ ...styles.input, padding: 8, borderRadius: 6, borderColor: '#ccc', borderWidth: 1 }}
        />
      ) : (
        <>
          <Button onPress={() => setShowExt2(true)} mode="outlined" style={styles.input}>
            {values.extCompletion2 ? `Extended Completion Date 2: ${values.extCompletion2.toLocaleDateString()}` : 'Select Extended Completion Date 2'}
          </Button>
          {showExt2 && (
            <DateTimePicker
              value={values.extCompletion2 || new Date()}
              mode="date"
              display="default"
              onChange={(_, date) => {
                setShowExt2(false);
                if (date) setValues(v => ({ ...v, extCompletion2: date }));
              }}
            />
          )}
        </>
      )}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
        <Button onPress={onCancel} mode="outlined" style={{ marginRight: 12 }}>
          Cancel
        </Button>
        <Button
          onPress={() => {
            const missing = getMissingFields();
            if (missing.length > 0) {
              setErrors(missing);
              return;
            }
            setErrors([]);
            onSubmit(values);
          }}
          mode="contained"
          id="project-form-save-button"
        >
          {submitLabel}
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  form: { minWidth: 300, maxWidth: 400 },
  input: { marginBottom: 10 },
  label: { fontWeight: 'bold', marginBottom: 4 },
  dropdownRow: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
  dropdownBtn: { marginRight: 6, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
});

export default ProjectForm;
