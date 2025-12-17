import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import GlassIcon from './GlassIcon';
import { getSecurityDeposits, addSecurityDeposit, updateSecurityDeposit, deleteSecurityDeposit } from '../services/securityDepositService';

const DEPOSIT_TYPES = ["Security Deposit", "Retension Money"];
const INSTRUMENT_FORMS = ["Cash", "FDR", "BG", "Cheque"];

const initialRow = {
  id: undefined,
  type: '',
  amount: '',
  percent: '',
  instrumentForm: '',
  instrumentNo: '',
  bankDetails: '',
  issuedOn: '',
  validUpto: '',
  documentUrl: '',
  documentName: '',
  isEditing: true,
};

// Add a type for the row to ensure 'id' is always present
type SecurityDepositRow = typeof initialRow & { id?: string };

const SecurityDepositTable = ({ projectId }) => {
  const [rows, setRows] = useState([{ ...initialRow }]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      console.warn('[SecurityDepositTable] projectId is missing! Data will not load.');
      setLoading(false);
      return;
    }
    setLoading(true);
    getSecurityDeposits(projectId)
      .then(deposits => {
        setRows([...deposits.map(b => ({ ...b, isEditing: false })), { ...initialRow, isEditing: true }]);
        setLoading(false);
      })
      .catch(e => {
        console.error('[SecurityDepositTable] Failed to load security deposits:', e);
        setLoading(false);
      });
  }, [projectId]);

  const handleChange = (idx, field, value) => {
    const updated = rows.map((row, i) => (i === idx ? { ...row, [field]: value } : row));
    setRows(updated);
  };

  const addRow = () => {
    setRows([...rows, { ...initialRow, isEditing: true }]);
  };

  const handleEdit = idx => {
    setRows(rows.map((row, i) => i === idx ? { ...row, isEditing: true } : row));
  };

  const handleSave = async idx => {
    const row = rows[idx];
    if (!row.type || !row.amount) return alert('Please fill required fields.');
    let updatedRows = [...rows];
    if (row.id) {
      await updateSecurityDeposit(row.id, { ...row, isEditing: false });
      updatedRows[idx] = { ...row, isEditing: false };
    } else {
      const saved = await addSecurityDeposit(projectId, { ...row, isEditing: false });
      updatedRows[idx] = { ...saved, isEditing: false };
      updatedRows.push({ ...initialRow, isEditing: true });
    }
    setRows(updatedRows);
  };

  const handleDelete = async idx => {
    const row = rows[idx];
    if (window.confirm('Are you sure you want to delete this row?')) {
      if (row.id) await deleteSecurityDeposit(row.id);
      setRows(rows.filter((_, i) => i !== idx));
    }
  };

  const handleFileChange = (idx, file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setRows(rows.map((row, i) => i === idx ? { ...row, documentUrl: url, documentName: file.name } : row));
  };

  if (loading) return <Text>Loading...</Text>;
  return (
    <div style={{ overflowX: 'auto', width: '100%' }}>
      <View style={[styles.tableWrapper, { minWidth: 1400 }]}> 
        <View style={styles.headerRow}>
          <Text style={[styles.headerCell, { width: 30 }]}>Sr No.</Text>
          <Text style={[styles.headerCell, { width: 170 }]}>Type</Text>
          <Text style={[styles.headerCell, { width: 120 }]}>Amount Submitted</Text>
          <Text style={[styles.headerCell, { width: 80 }]}>In %</Text>
          <Text style={[styles.headerCell, { width: 140 }]}>Instrument Form</Text>
          <Text style={[styles.headerCell, { width: 120 }]}>Instrument No.</Text>
          <Text style={[styles.headerCell, { width: 170 }]}>Bank Details</Text>
          <Text style={[styles.headerCell, { width: 120 }]}>Issued On</Text>
          <Text style={[styles.headerCell, { width: 120 }]}>Valid Upto</Text>
          <Text style={[styles.headerCell, { width: 120 }]}>Document</Text>
          <View style={[styles.headerCell, { width: 30 }]} />
        </View>
        {rows.map((row, idx) => {
          const isEditable = idx === rows.length - 1;
          return (
            <View
              key={idx}
              style={[styles.dataRow, idx % 2 === 0 ? styles.rowEven : styles.rowOdd]}
            >
              <Text style={[styles.cell, { width: 30 }]}>{idx + 1}</Text>
              {isEditable ? (
                <>
                  <select value={row.type} onChange={e => handleChange(idx, 'type', e.target.value)} style={{ ...styles.select, width: 170 }}>
                    <option value="">Select</option>
                    {DEPOSIT_TYPES.map(type => (<option key={type} value={type}>{type}</option>))}
                  </select>
                  <input style={{ ...styles.input, width: 120 }} value={row.amount} onChange={e => handleChange(idx, 'amount', e.target.value)} />
                  <input style={{ ...styles.input, width: 80 }} value={row.percent} onChange={e => handleChange(idx, 'percent', e.target.value)} />
                  <select value={row.instrumentForm} onChange={e => handleChange(idx, 'instrumentForm', e.target.value)} style={{ ...styles.select, width: 140 }}>
                    <option value="">Select</option>
                    {INSTRUMENT_FORMS.map(form => (<option key={form} value={form}>{form}</option>))}
                  </select>
                  <input style={{ ...styles.input, width: 120 }} value={row.instrumentNo} onChange={e => handleChange(idx, 'instrumentNo', e.target.value)} />
                  <input style={{ ...styles.input, width: 170 }} value={row.bankDetails} onChange={e => handleChange(idx, 'bankDetails', e.target.value)} />
                  <input style={{ ...styles.input, width: 120 }} type="date" value={row.issuedOn} onChange={e => handleChange(idx, 'issuedOn', e.target.value)} />
                  <input style={{ ...styles.input, width: 120 }} type="date" value={row.validUpto} onChange={e => handleChange(idx, 'validUpto', e.target.value)} />
                  <View style={[styles.cell, { width: 120, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}> 
                    {row.documentUrl ? (
                      <>
                        <a href={row.documentUrl} target="_blank" rel="noopener noreferrer" style={{ marginRight: 8 }}>
                          <GlassIcon name="eye" size={20} color="#1E90FF" />
                        </a>
                        <span style={{ fontSize: 12, marginRight: 8 }}>{row.documentName}</span>
                        <label style={{ cursor: 'pointer' }}>
                          <GlassIcon name="create-outline" size={20} color="#1E90FF" />
                          <input type="file" accept="application/pdf" style={{ display: 'none' }} onChange={e => handleFileChange(idx, e.target.files[0])} />
                        </label>
                      </>
                    ) : (
                      <label style={{ cursor: 'pointer' }}>
                        <GlassIcon name="folder" size={20} color="#1E90FF" />
                        <input type="file" accept="application/pdf" style={{ display: 'none' }} onChange={e => handleFileChange(idx, e.target.files[0])} />
                      </label>
                    )}
                  </View>
                </>
              ) : (
                <>
                  <Text style={{ ...styles.cell, width: 170 }}>{row.type}</Text>
                  <Text style={{ ...styles.cell, width: 120 }}>{row.amount}</Text>
                  <Text style={{ ...styles.cell, width: 80 }}>{row.percent}</Text>
                  <Text style={{ ...styles.cell, width: 140 }}>{row.instrumentForm}</Text>
                  <Text style={{ ...styles.cell, width: 120 }}>{row.instrumentNo}</Text>
                  <Text style={{ ...styles.cell, width: 170 }}>{row.bankDetails}</Text>
                  <Text style={{ ...styles.cell, width: 120 }}>{row.issuedOn}</Text>
                  <Text style={{ ...styles.cell, width: 120 }}>{row.validUpto}</Text>
                  <View style={[styles.cell, { width: 120, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}> 
                    {row.documentUrl ? (
                      <>
                        <a href={row.documentUrl} target="_blank" rel="noopener noreferrer" style={{ marginRight: 8 }}>
                          <GlassIcon name="eye" size={20} color="#1E90FF" />
                        </a>
                        <span style={{ fontSize: 12, marginRight: 8 }}>{row.documentName}</span>
                      </>
                    ) : null}
                  </View>
                </>
              )}
              <View style={[styles.cell, { width: 30, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}> 
                {isEditable ? (
                  <>
                    <TouchableOpacity onPress={() => handleSave(idx)} style={{ marginRight: 8 }}>
                      <GlassIcon name="checkmark-circle-outline" size={20} color="#1E90FF" />
                    </TouchableOpacity>
                    {rows.length > 1 && (
                      <TouchableOpacity onPress={() => handleDelete(idx)}>
                        <GlassIcon name="trash-outline" size={20} color="#e53935" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={addRow} style={styles.addBtn}>
                      <GlassIcon name="add-circle-outline" size={22} color="#1E90FF" />
                    </TouchableOpacity>
                  </>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </div>
  );
};

const styles = StyleSheet.create({
  tableWrapper: {
    borderWidth: 1,
    borderColor: '#e0e7ef',
    borderRadius: 10,
    overflow: 'hidden',
    margin: 16,
    backgroundColor: '#fff',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#f4f8fb',
    borderBottomWidth: 1,
    borderColor: '#e0e7ef',
    alignItems: 'center',
  },
  headerCell: {
    flex: 1,
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
  },
  rowEven: {
    backgroundColor: '#f9fafb',
  },
  rowOdd: {
    backgroundColor: '#e6f0fa',
  },
  cell: {
    flex: 1,
    padding: 8,
    textAlign: 'center',
    fontSize: 13,
  },
  input: {
    flex: 1,
    padding: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    fontSize: 13,
    margin: 2,
  },
  select: {
    flex: 1,
    padding: 6,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 4,
    fontSize: 13,
    margin: 2,
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

export default SecurityDepositTable;
