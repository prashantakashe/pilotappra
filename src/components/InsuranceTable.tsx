import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Platform, Linking, ScrollView } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import GlassIcon from './GlassIcon';
import { getInsurances, addInsurance, updateInsurance, deleteInsurance } from '../services/insuranceService';

const POLICY_TYPES = [
    "Contractor's All Risk (CAR)",
    'WorkMens Compensation',
    'Third Party Liability',
    'Plant & Machinery',
];

const initialRow = {
    id: null,
    type: '',
    policyNo: '',
    company: '',
    sumInsured: '',
    premiumPaid: '',
    startDate: '',
    endDate: '',
    validity: '',
    renewalDueDate: '',
    copySubmitted: '',
    policyDocUrl: '',
    policyDocName: '',
    isEditing: true,
};

// Placeholder for a cross-platform file picker library like expo-document-picker
const mockFilePicker = async () => {
    if (Platform.OS === 'web') {
        // Web implementation would typically involve a hidden <input type="file" />
        alert('File upload initiated (Web). Real implementation requires DocumentPicker or a controlled file input.');
        return { uri: 'mock_web_url', name: 'mock_policy.pdf' };
    } else {
        // Mobile implementation using DocumentPicker or similar
        alert('File upload initiated (Mobile). Real implementation requires DocumentPicker.');
        // Example: const res = await DocumentPicker.pickSingle({...});
        return { uri: 'mock_mobile_uri', name: 'mock_policy.pdf' };
    }
};


const InsuranceTable = ({ projectId }) => {
    const [rows, setRows] = useState([{ ...initialRow }]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!projectId) {
            console.warn('[InsuranceTable] projectId is missing! Data will not load.');
            setLoading(false);
            return;
        }
        setLoading(true);
        getInsurances(projectId)
            .then(insurances => {
                // Load existing rows, and append one new empty row for immediate addition
                setRows([...insurances.map(b => ({ ...b, isEditing: false })), { ...initialRow, isEditing: true }]);
                setLoading(false);
            })
            .catch(e => {
                console.error('[InsuranceTable] Failed to load insurances:', e);
                setLoading(false);
            });
    }, [projectId]);

    const handleChange = (idx, field, value) => {
        const updated = rows.map((row, i) => (i === idx ? { ...row, [field]: value } : row));
        setRows(updated);
    };

    const addRow = () => {
        // Only add a new row if the current placeholder has data (for better UX)
        const lastRow = rows[rows.length - 1];
        if (lastRow.type || lastRow.policyNo || lastRow.id) {
                setRows([...rows, { ...initialRow, isEditing: true }]);
        } else {
                alert('Please save or fill the current empty row before adding a new one.');
        }
    };

    const handleEdit = idx => {
        setRows(rows.map((row, i) => i === idx ? { ...row, isEditing: true } : row));
    };

    const handleSave = async idx => {
        const row = rows[idx];
        if (!row.type || !row.policyNo) return alert('Please fill required fields (Type and Policy No).');
    
        let updatedRows = [...rows];

        try {
                if (row.id) {
                        // Existing row: Update
                        await updateInsurance(row.id, { ...row, isEditing: false });
                        updatedRows[idx] = { ...row, isEditing: false };
                } else {
                        // New row: Add
                        const saved = await addInsurance(projectId, { ...row, isEditing: false });
                        updatedRows[idx] = { ...saved, isEditing: false };
            
                        // If it was the placeholder row, add a new placeholder
                        if (idx === rows.length - 1) {
                                updatedRows.push({ ...initialRow, isEditing: true });
                        }
                }
                setRows(updatedRows);
        } catch (e) {
                console.error("Save failed:", e);
                alert(`Failed to save insurance: ${e.message || 'Unknown error'}`);
        }
    };

    const handleDelete = async idx => {
        const row = rows[idx];
    
        // If it's the empty placeholder row, just reset it
        if (!row.id && idx === rows.length - 1) {
            setRows(rows.filter((_, i) => i !== idx).concat([{ ...initialRow, isEditing: true }]));
            return;
        }

        if (window.confirm('Are you sure you want to delete this row?')) {
            try {
                if (row.id) await deleteInsurance(row.id);
                setRows(rows.filter((_, i) => i !== idx));
            } catch (e) {
                console.error("Delete failed:", e);
                alert(`Failed to delete insurance: ${e.message || 'Unknown error'}`);
            }
        }
    };

    // Corrected file change handler to use TouchableOpacity in JSX
    const handleFileChange = async (idx) => {
        try {
            const file = await mockFilePicker(); 
            if (file) {
                setRows(rows.map((row, i) => i === idx ? { ...row, policyDocUrl: file.uri, policyDocName: file.name } : row));
            }
        } catch (e) {
            console.log('File picker cancelled or failed:', e);
        }
    };
  
    const handleViewDocument = (url) => {
        if (url) {
                Linking.openURL(url).catch(err => console.error("Couldn't load page", err));
        }
    };

    if (loading) return <Text style={{ textAlign: 'center', padding: 20 }}>Loading...</Text>;
  
    return (
        <ScrollView horizontal style={{ width: '100%' }} contentContainerStyle={{ minWidth: 1600 }}>
            <View style={{ flexDirection: 'column', flex: 1 }}>
                {/* Table Header */}
                <View style={[styles.dataRow, styles.tableHeader]}>
                    <Text style={[styles.headerCell, { width: 50 }]}>Sr No.</Text>
                    <Text style={[styles.headerCell, { width: 180 }]}>Type of Policy</Text>
                    <Text style={[styles.headerCell, { width: 160 }]}>Policy No</Text>
                    <Text style={[styles.headerCell, { width: 200 }]}>Insurance Company</Text>
                    <Text style={[styles.headerCell, { width: 140 }]}>Sum Insured</Text>
                    <Text style={[styles.headerCell, { width: 130 }]}>Premium Paid</Text>
                    <Text style={[styles.headerCell, { width: 130 }]}>Policy Start Date</Text>
                    <Text style={[styles.headerCell, { width: 130 }]}>Policy End Date</Text>
                    <Text style={[styles.headerCell, { width: 110 }]}>Policy Validity</Text>
                    <Text style={[styles.headerCell, { width: 100 }]}>Renewal</Text>
                    <Text style={[styles.headerCell, { width: 150 }]}>Copy to Client</Text>
                    <Text style={[styles.headerCell, { width: 120 }]}>Document</Text>
                    <Text style={[styles.headerCell, { width: 60 }]}>Actions</Text>
                </View>
                {/* Table Rows */}
                {rows.map((row, idx) => {
                    const isLastRow = idx === rows.length - 1;
                    const isEditing = row.isEditing;
                    return (
                        <View
                            key={row.id || `new-${idx}`}
                            style={[
                                styles.dataRow,
                                idx % 2 === 0 ? styles.rowEven : styles.rowOdd
                            ]}
                        >
                            <Text style={[styles.cell, { width: 50 }]}>{idx + 1}</Text>
                            {/* Conditional Rendering for Edit/View Mode */}
                            {isEditing ? (
                                <>
                                    {/* Type of Policy (Picker) */}
                                    <View style={{ width: 180, ...styles.pickerContainer }}>
                                        <Picker
                                            selectedValue={row.type}
                                            onValueChange={value => handleChange(idx, 'type', value)}
                                            style={styles.select}
                                        >
                                            <Picker.Item label="Select" value="" />
                                            {POLICY_TYPES.map(type => (
                                                <Picker.Item key={type} label={type} value={type} />
                                            ))}
                                        </Picker>
                                    </View>
                                    {/* Other Inputs */}
                                    <TextInput style={[styles.input, { width: 160 }]} value={row.policyNo} onChangeText={v => handleChange(idx, 'policyNo', v)} placeholder="Policy No" />
                                    <TextInput style={[styles.input, { width: 200 }]} value={row.company} onChangeText={v => handleChange(idx, 'company', v)} placeholder="Company" />
                                    <TextInput style={[styles.input, { width: 140 }]} value={row.sumInsured} onChangeText={v => handleChange(idx, 'sumInsured', v)} keyboardType="numeric" placeholder="Amount" />
                                    <TextInput style={[styles.input, { width: 130 }]} value={row.premiumPaid} onChangeText={v => handleChange(idx, 'premiumPaid', v)} keyboardType="numeric" placeholder="Amount" />
                                    <TextInput style={[styles.input, { width: 130 }]} value={row.startDate} onChangeText={v => handleChange(idx, 'startDate', v)} placeholder="YYYY-MM-DD" />
                                    <TextInput style={[styles.input, { width: 130 }]} value={row.endDate} onChangeText={v => handleChange(idx, 'endDate', v)} placeholder="YYYY-MM-DD" />
                                    <TextInput style={[styles.input, { width: 110 }]} value={row.validity} onChangeText={v => handleChange(idx, 'validity', v)} placeholder="e.g. 1 year" />
                                    <TextInput style={[styles.input, { width: 100 }]} value={row.renewalDueDate} onChangeText={v => handleChange(idx, 'renewalDueDate', v)} placeholder="YYYY-MM-DD" />
                                    <TextInput style={[styles.input, { width: 150 }]} value={row.copySubmitted} onChangeText={v => handleChange(idx, 'copySubmitted', v)} placeholder="Yes/No" />
                                    {/* Document Upload/View */}
                                    <View style={[styles.cell, { width: 120, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}> 
                                        {row.policyDocUrl ? (
                                            <TouchableOpacity onPress={() => handleViewDocument(row.policyDocUrl)} style={{ marginRight: 8 }}>
                                                <GlassIcon name="eye" size={20} color="#1E90FF" />
                                            </TouchableOpacity>
                                        ) : null}
                                        <TouchableOpacity onPress={() => handleFileChange(idx)} style={{ marginLeft: 4 }}>
                                            <GlassIcon name={row.policyDocUrl ? "create-outline" : "folder"} size={20} color="#1E90FF" />
                                        </TouchableOpacity>
                                        {row.policyDocName ? (
                                            <Text style={{ fontSize: 10, marginLeft: 8, maxWidth: 60 }} numberOfLines={1}>
                                                {row.policyDocName}
                                            </Text>
                                        ) : null}
                                    </View>
                                </>
                            ) : (
                                // Read-only Fields (Text)
                                <>
                                    <Text style={{ ...styles.cell, width: 180 }}>{row.type}</Text>
                                    <Text style={{ ...styles.cell, width: 160 }}>{row.policyNo}</Text>
                                    <Text style={{ ...styles.cell, width: 200 }}>{row.company}</Text>
                                    <Text style={{ ...styles.cell, width: 140 }}>{row.sumInsured}</Text>
                                    <Text style={{ ...styles.cell, width: 130 }}>{row.premiumPaid}</Text>
                                    <Text style={{ ...styles.cell, width: 130 }}>{row.startDate}</Text>
                                    <Text style={{ ...styles.cell, width: 130 }}>{row.endDate}</Text>
                                    <Text style={{ ...styles.cell, width: 110 }}>{row.validity}</Text>
                                    <Text style={{ ...styles.cell, width: 100 }}>{row.renewalDueDate}</Text>
                                    <Text style={{ ...styles.cell, width: 150 }}>{row.copySubmitted}</Text>
                                    {/* Document View only */}
                                    <View style={[styles.cell, { width: 120, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}> 
                                        {row.policyDocUrl ? (
                                            <TouchableOpacity onPress={() => handleViewDocument(row.policyDocUrl)}>
                                                <GlassIcon name="eye" size={20} color="#1E90FF" />
                                            </TouchableOpacity>
                                        ) : null}
                                        {row.policyDocName ? (
                                            <Text style={{ fontSize: 12, marginLeft: 8, maxWidth: 80 }} numberOfLines={1}>
                                                {row.policyDocName}
                                            </Text>
                                        ) : null}
                                    </View>
                                </>
                            )}
                            {/* Actions Column */}
                            <View style={[styles.cell, { width: 60, flexDirection: 'row', justifyContent: isEditing ? 'space-around' : 'center', alignItems: 'center' }]}> 
                                {isEditing ? (
                                    <>
                                        <TouchableOpacity onPress={() => handleSave(idx)} style={{ marginRight: 4 }}>
                                            <GlassIcon name="checkmark-circle-outline" size={22} color="#1E90FF" />
                                        </TouchableOpacity>
                                        {(rows.length > 1 || row.id) && (
                                            <TouchableOpacity onPress={() => handleDelete(idx)}>
                                                <GlassIcon name="trash-outline" size={22} color="#e53935" />
                                            </TouchableOpacity>
                                        )}
                                        {/* The addRow function will now be implicit when saving the last row, 
                                                but keeping the button here for explicit control on the last row */}
                                        {isLastRow && (
                                            <TouchableOpacity onPress={addRow} style={styles.addBtn}>
                                                <GlassIcon name="add-circle-outline" size={22} color="#1E90FF" />
                                            </TouchableOpacity>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <TouchableOpacity onPress={() => handleEdit(idx)} style={{ marginRight: 4 }}>
                                            <GlassIcon name="create-outline" size={22} color="#FFA500" />
                                        </TouchableOpacity>
                                        <TouchableOpacity onPress={() => handleDelete(idx)}>
                                            <GlassIcon name="trash-outline" size={22} color="#e53935" />
                                        </TouchableOpacity>
                                    </>
                                )}
                            </View>
                        </View>
                    );
                })}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    tableHeader: {
        backgroundColor: '#f4f8fb',
        borderBottomWidth: 1,
        borderColor: '#e0e7ef',
        alignItems: 'center',
        minHeight: 50,
    },
    headerCell: {
        fontWeight: '700',
        fontSize: 14,
        padding: 8,
        textAlign: 'center',
        color: '#1E90FF',
    },
    dataRow: {
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: 44,
        // Add minWidth to enable horizontal scroll in web environment
        minWidth: 1600, 
    },
    rowEven: {
        backgroundColor: '#f9fafb',
    },
    rowOdd: {
        backgroundColor: '#e6f0fa',
    },
    cell: {
        padding: 8,
        textAlign: 'center',
        fontSize: 13,
        justifyContent: 'center',
    },
    input: {
        padding: 6,
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 4,
        fontSize: 13,
        margin: 2,
        height: 35, // Consistent height
        textAlign: 'center',
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 4,
        margin: 2,
        height: 35, // Consistent height
        justifyContent: 'center', // Center content vertically in the View
    },
    select: {
        // Styling the picker itself
        flex: 1,
        fontSize: 13,
        height: 35,
        // Note: Picker styling is inconsistent across platforms, 
        // often requiring platform-specific workarounds.
    },
    addBtn: {
        marginLeft: 8,
        padding: 4,
        borderRadius: 20,
        backgroundColor: '#f4f8fb',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

const modalStyles = StyleSheet.create({
    centeredView: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 10,
        padding: 10,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
        maxHeight: '80%',
        minWidth: 200,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    option: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        width: '100%',
        alignItems: 'center',
    },
});

export default InsuranceTable;