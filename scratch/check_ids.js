const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');

const caIds = [
  'modalCaDetail', 'caDetailModalTitle', 'btnCloseCaDetailModal',
  'caDetailUserAvatar', 'caDetailUserName', 'caDetailUserUsername', 'caDetailUserDept',
  'caDetailScore', 'caDetailGradeBadge', 'caDetailPassBadge', 'caDetailTicketId',
  'caDetailDate', 'caDetailChannel', 'caDetailFocusParam', 'caDetailNotes',
  'caDetailCreatedBy', 'caDetailCreatedAt', 'caDetailUpdatedWrap', 'caDetailUpdatedAt',
  'caDetailBtnEdit', 'btnCloseCaDetailBtn', 'formCaTicketNo'
];

const findingIds = [
  'modalFindingDetail', 'findingDetailModalTitle', 'btnCloseFindingDetailModal',
  'findingDetailId', 'findingDetailTypeBadge', 'findingDetailCategoryBadge',
  'findingDetailDate', 'findingDetailDevBadge', 'findingDetailStatusBadge',
  'findingDetailUserAvatar', 'findingDetailUserName', 'findingDetailUserUsername',
  'findingDetailDept', 'findingDetailDesc', 'findingDetailActionPlan',
  'findingDetailCommitment', 'findingDetailCreatedAt', 'findingDetailBtnEdit',
  'btnCloseFindingDetailBtn'
];

console.log('Checking CA IDs:');
caIds.forEach(id => {
  if (!html.includes(`id="${id}"`)) console.log('MISSING CA ID:', id);
});
console.log('Checking Finding IDs:');
findingIds.forEach(id => {
  if (!html.includes(`id="${id}"`)) console.log('MISSING Finding ID:', id);
});
console.log('Done checking IDs.');

