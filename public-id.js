const crypto = require('crypto');

function normalizeArtworkCode(value) {
  const normalized = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

  if (!normalized) {
    throw new Error('Invalid artworkCode');
  }

  return normalized;
}

function normalizeSize(value) {
  const raw = String(value || '').trim().toUpperCase();

  const map = {
    S: 'S',
    M: 'M',
    L: 'L',
    SMALL: 'S',
    MEDIUM: 'M',
    LARGE: 'L',
    '16X20': 'S',
    '16×20': 'S',
    '16 X 20': 'S',
    '16 × 20': 'S',
    '20X25': 'M',
    '20×25': 'M',
    '20 X 25': 'M',
    '20 × 25': 'M',
    '24X30': 'L',
    '24×30': 'L',
    '24 X 30': 'L',
    '24 × 30': 'L'
  };

  const compact = raw.replace(/\s+/g, '');
  const normalized = map[raw] || map[compact];

  if (!normalized || !['S', 'M', 'L'].includes(normalized)) {
    throw new Error('Invalid size');
  }

  return normalized;
}

function normalizeEdition(value, digits = 3) {
  const num = Number(value);

  if (!Number.isInteger(num) || num <= 0) {
    throw new Error('Edition must be a positive integer');
  }

  return String(num).padStart(digits, '0');
}

function generateRandomSuffix(length = 4) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = crypto.randomBytes(length);
  let out = '';

  for (let i = 0; i < length; i++) {
    out += chars[bytes[i] % chars.length];
  }

  return out;
}

function generatePublicId(input) {
  const randomLength =
    input && Number.isInteger(input.randomLength) && input.randomLength > 0
      ? input.randomLength
      : 4;

  if (typeof input === 'string') {
    const slug = input.trim().toUpperCase();
    if (!slug) {
      throw new Error('Invalid slug');
    }
    return `${slug}-${generateRandomSuffix(randomLength)}`;
  }

  if (!input || typeof input !== 'object') {
    throw new Error('generatePublicId requires a slug string or an object');
  }

  const brandPart = String(input.brand || 'GLA')
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '');

  if (!brandPart) {
    throw new Error('Invalid brand');
  }

  const artworkPart = normalizeArtworkCode(input.artworkCode);
  const sizePart = normalizeSize(input.size);
  const editionPart = normalizeEdition(input.edition);
  const randomPart = generateRandomSuffix(randomLength);

  return `${brandPart}-${artworkPart}-${sizePart}-${editionPart}-${randomPart}`;
}

module.exports = {
  generatePublicId,
  normalizeArtworkCode,
  normalizeSize,
  normalizeEdition,
  generateRandomSuffix
};

if (require.main === module) {
  const [, , artworkCode, size, edition] = process.argv;

  if (!artworkCode || !size || !edition) {
    console.error('Usage: node public-id.js <artworkCode> <size> <edition>');
    process.exit(1);
  }

  const publicId = generatePublicId({
    brand: 'GLA',
    artworkCode,
    size,
    edition
  });

  console.log(publicId);
}