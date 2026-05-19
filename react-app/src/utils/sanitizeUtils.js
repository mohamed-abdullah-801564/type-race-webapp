export const sanitizeName = (name) => {
  if (typeof name !== 'string') return '';
  return name.replace(/[^a-zA-Z0-9_]/g, '').trim().slice(0, 15);
};

export const validateWPM = (wpm) => {
  return typeof wpm === 'number' && wpm >= 0 && wpm <= 300;
};

export const validateAccuracy = (acc) => {
  return typeof acc === 'number' && acc >= 0 && acc <= 100;
};

export const sanitizeInput = (text) => {
  if (typeof text !== 'string') return '';
  return text.replace(/(<([^>]+)>)/gi, '');
};
