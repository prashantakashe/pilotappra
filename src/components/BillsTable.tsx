import React, { useState, useEffect } from 'react';
// Helper to format date as DD-MM-YYYY
function formatDateDMY(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

// Helper to format amount with ₹ and commas
function formatAmount(val) {
  if (!val || isNaN(val)) return '₹ 0';
  return `₹ ${parseFloat(val).toLocaleString('en-IN')}`;
}
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import GlassIcon from './GlassIcon';

const BILL_TYPES = ["R A Bill", "Escalation", "Material Advance", "Claim"];

const initialRow = {
  billType: '',
  no: '', // New editable No. column
  submissionDate: '',
  basicAmount: '',
  gstPercent: '',
  gstAmount: '',
  grossAmount: '',
  netAmountReceived: '',
  receivedDate: '',
  billDocUrl: '',
  billDocName: '',
};


import { getBills, addBill, updateBill, deleteBill } from '../services/billsService';

const BillsTable = ({ projectId }) => {
  const [rows, setRows] = useState([{ ...initialRow }]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      console.warn('[BillsTable] projectId is missing! Data will not load.');
      setLoading(false);
      return;
    }
    setLoading(true);
    getBills(projectId)
      .then(bills => {
        setRows([...bills.map(b => ({ ...b, isEditing: false })), { ...initialRow, isEditing: true }]);
        setLoading(false);
      })
      .catch(e => {
        console.error('[BillsTable] Failed to load bills:', e);
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
    if (!row.billType || !row.submissionDate) return alert('Please fill required fields.');
    let updatedRows = [...rows];
    if (row.id) {
      await updateBill(row.id, { ...row, isEditing: false });
      updatedRows[idx] = { ...row, isEditing: false };
    } else {
      const saved = await addBill(projectId, { ...row, isEditing: false });
      updatedRows[idx] = { ...saved, isEditing: false };
      // Always keep a blank row at the end
      updatedRows.push({ ...initialRow, isEditing: true });
    }
    setRows(updatedRows);
  };

  const handleDelete = async idx => {
    const row = rows[idx];
    if (window.confirm('Are you sure you want to delete this row?')) {
      if (row.id) await deleteBill(row.id);
      setRows(rows.filter((_, i) => i !== idx));
    }
  };

  const handleFileChange = (idx, file) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    setRows(rows.map((row, i) => i === idx ? { ...row, billDocUrl: url, billDocName: file.name } : row));
  };

  if (loading) return <Text>Loading...</Text>;
  // Calculate totals for each Bill Type
  const billTypeTotals = BILL_TYPES.map(type => {
    let basicTotal = 0;
    let grossTotal = 0;
    let netTotal = 0;
    rows.forEach(row => {
      if (row.billType === type) {
        if (row.basicAmount) basicTotal += parseFloat(row.basicAmount) || 0;
        if (row.grossAmount) grossTotal += parseFloat(row.grossAmount) || 0;
        if (row.netAmountReceived) netTotal += parseFloat(row.netAmountReceived) || 0;
      }
    });
    return { type, basicTotal, grossTotal, netTotal };
  });

  return (
      <View style={{ width: '100%', overflowX: 'auto' }}>
        <View style={{ width: '100%', maxHeight: 500, overflowY: 'auto' }}>
      <View style={styles.tableHeader}>
        <Text style={[styles.headerCell, { width: 50 }]}>Sr. No.</Text>
        <Text style={[styles.headerCell, { width: 140, textAlign: 'left' }]}>Bill Type</Text>
        <Text style={[styles.headerCell, { width: 70 }]}>No.</Text>
        <Text style={[styles.headerCell, { width: 130 }]}>Submission Date</Text>
        <Text style={[styles.headerCell, { width: 120 }]}>Basic Amount</Text>
        <Text style={[styles.headerCell, { width: 80 }]}>GST (%)</Text>
        <Text style={[styles.headerCell, { width: 120 }]}>GST Amount</Text>
        <Text style={[styles.headerCell, { width: 120 }]}>Gross Amount</Text>
        <Text style={[styles.headerCell, { width: 150 }]}>Net Amount Received</Text>
        <Text style={[styles.headerCell, { width: 130 }]}>Received Date</Text>
        <Text style={[styles.headerCell, { width: 120 }]}>File</Text>
        <Text style={[styles.headerCell, { width: 60 }]}>Actions</Text>
      </View>
      {rows.map((row, idx) => {
        const isLastRow = idx === rows.length - 1;
        return (
          <View key={idx} style={[styles.dataRow, idx % 2 === 0 ? styles.rowEven : styles.rowOdd]}>
            <Text style={[styles.cell, { width: 50 }]}>{idx + 1}</Text>
            {row.isEditing ? (
              <>
                <select value={row.billType} onChange={e => handleChange(idx, 'billType', e.target.value)} style={{ ...styles.select, width: 140, textAlign: 'left' }}>
                  <option value="">Select</option>
                  {BILL_TYPES.map(type => (<option key={type} value={type}>{type}</option>))}
                </select>
                <input style={{ ...styles.input, width: 70 }} value={row.no} onChange={e => handleChange(idx, 'no', e.target.value)} placeholder="No." />
                <input style={{ ...styles.input, width: 130 }} type="date" value={row.submissionDate} onChange={e => handleChange(idx, 'submissionDate', e.target.value)} />
                <input style={{ ...styles.input, width: 120 }} value={row.basicAmount} onChange={e => handleChange(idx, 'basicAmount', e.target.value)} />
                <input style={{ ...styles.input, width: 80 }} value={row.gstPercent} onChange={e => handleChange(idx, 'gstPercent', e.target.value)} />
                <input style={{ ...styles.input, width: 120 }} value={row.gstAmount} onChange={e => handleChange(idx, 'gstAmount', e.target.value)} />
                <input style={{ ...styles.input, width: 120 }} value={row.grossAmount} onChange={e => handleChange(idx, 'grossAmount', e.target.value)} />
                <input style={{ ...styles.input, width: 150 }} value={row.netAmountReceived} onChange={e => handleChange(idx, 'netAmountReceived', e.target.value)} />
                <input style={{ ...styles.input, width: 130 }} type="date" value={row.receivedDate} onChange={e => handleChange(idx, 'receivedDate', e.target.value)} />
                <View style={[styles.cell, { width: 120, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}> 
                  {row.billDocUrl ? (
                    <>
                      <a href={row.billDocUrl} target="_blank" rel="noopener noreferrer" style={{ marginRight: 8 }}>
                        <GlassIcon name="eye" size={20} color="#1E90FF" />
                      </a>
                      <span style={{ fontSize: 12, marginRight: 8 }}>{row.billDocName}</span>
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
                <Text style={{ ...styles.cell, width: 140, textAlign: 'left' }}>{row.billType}</Text>
                <Text style={{ ...styles.cell, width: 70 }}>{row.no}</Text>
                <Text style={{ ...styles.cell, width: 130 }}>{formatDateDMY(row.submissionDate)}</Text>
                <Text style={{ ...styles.cell, width: 120 }}>{formatAmount(row.basicAmount)}</Text>
                <Text style={{ ...styles.cell, width: 80 }}>{row.gstPercent}</Text>
                <Text style={{ ...styles.cell, width: 120 }}>{formatAmount(row.gstAmount)}</Text>
                <Text style={{ ...styles.cell, width: 120 }}>{formatAmount(row.grossAmount)}</Text>
                <Text style={{ ...styles.cell, width: 150 }}>{formatAmount(row.netAmountReceived)}</Text>
                <Text style={{ ...styles.cell, width: 130 }}>{formatDateDMY(row.receivedDate)}</Text>
                <View style={[styles.cell, { width: 120, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}> 
                  {row.billDocUrl ? (
                    <>
                      <a href={row.billDocUrl} target="_blank" rel="noopener noreferrer" style={{ marginRight: 8 }}>
                        <GlassIcon name="eye" size={20} color="#1E90FF" />
                      </a>
                      <span style={{ fontSize: 12, marginRight: 8 }}>{row.billDocName}</span>
                    </>
                  ) : null}
                </View>
              </>
            )}
            <View style={[styles.cell, { width: 60, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}> 
              {row.isEditing ? (
                <>
                  <TouchableOpacity onPress={() => handleSave(idx)} style={{ marginRight: 8 }}>
                    <GlassIcon name="checkmark-circle-outline" size={20} color="#1E90FF" />
                  </TouchableOpacity>
                  {rows.length > 1 && (
                    <TouchableOpacity onPress={() => handleDelete(idx)}>
                      <GlassIcon name="trash-outline" size={20} color="#e53935" />
                    </TouchableOpacity>
                  )}
                  {isLastRow && (
                    <TouchableOpacity onPress={addRow} style={styles.addBtn}>
                      <GlassIcon name="add-circle-outline" size={22} color="#1E90FF" />
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <TouchableOpacity onPress={() => handleEdit(idx)}>
                  <GlassIcon name="create-outline" size={20} color="#1E90FF" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        );
      })}
      {/* Totals Row for Each Bill Type */}
      {billTypeTotals.map((tot, i) => (
        <View key={tot.type} style={[styles.dataRow, { backgroundColor: '#e0f7fa' }]}> 
          <Text style={[styles.cell, { width: 50, fontWeight: 'bold' }]}>Total</Text>
          <Text style={[styles.cell, { width: 140, fontWeight: 'bold', textAlign: 'left' }]}>{tot.type}</Text>
          <Text style={[styles.cell, { width: 70 }]}></Text>
          <Text style={[styles.cell, { width: 130 }]}></Text>
          <Text style={[styles.cell, { width: 120, fontWeight: 'bold' }]}>{formatAmount(tot.basicTotal)}</Text>
          <Text style={[styles.cell, { width: 80 }]}></Text>
          <Text style={[styles.cell, { width: 120 }]}></Text>
          <Text style={[styles.cell, { width: 120, fontWeight: 'bold' }]}>{formatAmount(tot.grossTotal)}</Text>
          <Text style={[styles.cell, { width: 150, fontWeight: 'bold' }]}>{formatAmount(tot.netTotal)}</Text>
          <Text style={[styles.cell, { width: 130 }]}></Text>
          <Text style={[styles.cell, { width: 120 }]}></Text>
          <Text style={[styles.cell, { width: 60 }]}></Text>
        </View>
      ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#eaf2fb',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomWidth: 1,
    borderColor: '#d1e3f8',
    alignItems: 'center',
    minWidth: 1200,
    position: 'sticky',
    top: 0,
    zIndex: 2,
  },
  headerCell: {
    fontWeight: '700',
    color: '#1976d2',
    fontSize: 15,
    paddingVertical: 10,
    paddingHorizontal: 6,
    textAlign: 'center',
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 1200,
    borderBottomWidth: 1,
    borderColor: '#e3eaf2',
  },
  cell: {
    paddingVertical: 8,
    paddingHorizontal: 6,
    fontSize: 15,
    color: '#222',
    textAlign: 'center',
  },
  rowEven: { backgroundColor: '#f8fbff' },
  rowOdd: { backgroundColor: '#f4f8fb' },
  select: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    fontSize: 15,
    backgroundColor: '#f9fafb',
    marginBottom: 2,
    padding: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 6,
    fontSize: 15,
    backgroundColor: '#f9fafb',
    marginBottom: 2,
    padding: 4,
  },
  addBtn: {
    marginLeft: 8,
    backgroundColor: 'transparent',
    borderRadius: 20,
    padding: 2,
  },
});

export default BillsTable;
