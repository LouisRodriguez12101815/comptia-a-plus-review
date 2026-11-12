// Shared by the app and standalone progress readers.
export const DEFAULT_STUDY_FOCUS = '220-1201';
export const examOptions = [{ id: '220-1201' }, { id: '220-1202' }, { id: 'n10-009' }, { id: 'clf-c02' }, { id: 'saa-c03' }, { id: 'sy0-701' }, { id: 'az-900' }, { id: 'az-104' }, { id: 'all' }];
export function isStudyFocus(value) { return examOptions.some(exam => exam.id === value); }
