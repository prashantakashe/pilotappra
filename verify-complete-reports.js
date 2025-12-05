// Verification Script for All Three New Reports
// Verifies Target Achievement, Status Conversion, and Contribution Reports

const fs = require('fs');

const filePath = './src/components/dailyWorkStatus/DWSReportTab.tsx';
const content = fs.readFileSync(filePath, 'utf8');

const checks = [
  // ReportType
  { name: 'ReportType includes target', pattern: /'target'/ },
  { name: 'ReportType includes statusConversion', pattern: /'statusConversion'/ },
  { name: 'ReportType includes contribution', pattern: /'contribution'/ },
  
  // State variables
  { name: 'targetAchievementData state', pattern: /const \[targetAchievementData, setTargetAchievementData\]/ },
  { name: 'statusConversionData state', pattern: /const \[statusConversionData, setStatusConversionData\]/ },
  { name: 'contributionData state', pattern: /const \[contributionData, setContributionData\]/ },
  
  // Generation functions
  { name: 'handleGenerateTargetAchievement function', pattern: /const handleGenerateTargetAchievement = async/ },
  { name: 'handleGenerateStatusConversion function', pattern: /const handleGenerateStatusConversion = async/ },
  { name: 'handleGenerateContribution function', pattern: /const handleGenerateContribution = async/ },
  
  // Excel export functions
  { name: 'exportTargetAchievementExcel function', pattern: /const exportTargetAchievementExcel = / },
  { name: 'exportStatusConversionExcel function', pattern: /const exportStatusConversionExcel = / },
  { name: 'exportContributionExcel function', pattern: /const exportContributionExcel = / },
  
  // PDF export functions
  { name: 'exportTargetAchievementPDF function', pattern: /const exportTargetAchievementPDF = / },
  { name: 'exportStatusConversionPDF function', pattern: /const exportStatusConversionPDF = / },
  { name: 'exportContributionPDF function', pattern: /const exportContributionPDF = / },
  
  // Dropdown options
  { name: 'Target Achievement in dropdown', pattern: /🎯 Target Achievement/ },
  { name: 'Status Conversion in dropdown', pattern: /🔄 Status Conversion/ },
  { name: 'Contribution Report in dropdown', pattern: /⭐ Contribution Report/ },
  
  // UI displays
  { name: 'Target Achievement UI display', pattern: /targetAchievementData && targetAchievementData\.length > 0/ },
  { name: 'Status Conversion UI display', pattern: /statusConversionData && \(/ },
  { name: 'Contribution UI display', pattern: /contributionData && contributionData\.length > 0/ },
  
  // Export routing
  { name: 'Excel export routing for target', pattern: /reportType === 'target' && targetAchievementData/ },
  { name: 'Excel export routing for statusConversion', pattern: /reportType === 'statusConversion' && statusConversionData/ },
  { name: 'Excel export routing for contribution', pattern: /reportType === 'contribution' && contributionData/ },
  
  // Report generation routing
  { name: 'Generation routing for target', pattern: /if \(reportType === 'target'\)/ },
  { name: 'Generation routing for statusConversion', pattern: /if \(reportType === 'statusConversion'\)/ },
  { name: 'Generation routing for contribution', pattern: /if \(reportType === 'contribution'\)/ }
];

console.log('🔍 Verifying Complete Report Suite Implementation\n');
console.log('=' .repeat(70));

let passed = 0;
let failed = 0;
const failedChecks = [];

checks.forEach((check, index) => {
  const found = check.pattern.test(content);
  const status = found ? '✅ PASS' : '❌ FAIL';
  console.log(`${String(index + 1).padStart(2, '0')}. ${check.name.padEnd(50, ' ')} ${status}`);
  
  if (found) {
    passed++;
  } else {
    failed++;
    failedChecks.push(check.name);
  }
});

console.log('=' .repeat(70));
console.log(`\nResults: ${passed}/${checks.length} checks passed`);

if (failed === 0) {
  console.log('\n✅ ALL CHECKS PASSED! Complete Report Suite is fully implemented.\n');
  console.log('📊 Summary:');
  console.log('   • 3 new reports added (Target Achievement, Status Conversion, Contribution)');
  console.log('   • 9 total reports available');
  console.log('   • 6 export functions (3 Excel + 3 PDF)');
  console.log('   • 3 generation functions');
  console.log('   • 3 UI display components');
  console.log('\n📝 Next Steps:');
  console.log('   1. Hard refresh browser (Ctrl+Shift+R)');
  console.log('   2. Navigate to Reports tab');
  console.log('   3. Test each new report:');
  console.log('      - 🎯 Target Achievement');
  console.log('      - 🔄 Status Conversion');
  console.log('      - ⭐ Contribution Report');
  console.log('   4. Verify Excel and PDF exports for each');
  console.log('   5. Check data accuracy and formatting\n');
} else {
  console.log(`\n❌ ${failed} check(s) failed:\n`);
  failedChecks.forEach((check, idx) => {
    console.log(`   ${idx + 1}. ${check}`);
  });
  console.log('\nPlease review the implementation.\n');
  process.exit(1);
}

// Additional file size check
const stats = fs.statSync(filePath);
const fileSizeKB = (stats.size / 1024).toFixed(2);
console.log(`📁 File Size: ${fileSizeKB} KB`);
console.log(`📏 File Lines: ${content.split('\n').length} lines\n`);
