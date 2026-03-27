// build-records.js
// Usage:
// node build-records.js AMFW L 1 "A Mind Full of Water" AMFW.jpg
//
// Output:
// records/GLA-AMFW-L-001/data.json
//
// Optional env:
// ARCHIVE_BASE_URL=https://verify.glamoph.com
// DEFAULT_ARTIST=GLAMOPH
// DEFAULT_MEDIUM="Archival pigment print on fine art paper"
// DEFAULT_FRAME=Black
// DEFAULT_SIGNATURE=signature.png

const fs = require('fs');
const path = require('path');

let generatePublicId;
try {
  ({ generatePublicId } = require('./public-id'));
} catch (error) {
  generatePublicId = null;
}

const RECORDS_DIR = path.join(__dirname, 'records');

const ARCHIVE_BASE_URL =
  process.env.ARCHIVE_BASE_URL || 'https://verify.glamoph.com';

const DEFAULTS = {
  verified: 'Artwork Verified',
  artist: process.env.DEFAULT_ARTIST || 'GLAMOPH',
  medium:
    process.env.DEFAULT_MEDIUM ||
    'Archival pigment print on fine art paper',
  frame: process.env.DEFAULT_FRAME || 'Black',
  signature: process.env.DEFAULT_SIGNATURE || 'signature.png',
};

const SIZE_MAP = {
  S: {
    label: '16 × 20 in (S)',
    editionTotal: 50,
  },
  M: {
    label: '20 × 25 in (M)',
    editionTotal: 30,
  },
  L: {
    label: '24 × 30 in (L)',
    editionTotal: 10,
  },
};

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function padEdition(value) {
  return String(value).padStart(3, '0');
}

function normalizeArtworkCode(value) {
  const code = String(value || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '');

  if (!code) {
    throw new Error('artworkCode is required.');
  }

  return code;
}

function normalizeSize(value) {
  const size = String(value || '').trim().toUpperCase();

  if (!SIZE_MAP[size]) {
    throw new Error('size must be one of: S, M, L');
  }

  return size;
}

function normalizeEditionNumber(value) {
  const num = Number(value);

  if (!Number.isInteger(num) || num <= 0) {
    throw new Error('edition must be a positive integer.');
  }

  return num;
}

function normalizeTitle(value) {
  const title = String(value || '').trim();

  if (!title) {
    throw new Error('title is required.');
  }

  return title;
}

function normalizeImage(value, artworkCode) {
  const image = String(value || '').trim();
  return image || `${artworkCode}.jpg`;
}

function formatArchiveDate(date = new Date()) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function buildPublicSlug(artworkCode, size, editionNumber) {
  return `GLA-${artworkCode}-${size}-${padEdition(editionNumber)}`;
}

function buildPublicId(publicSlug) {
  if (typeof generatePublicId === 'function') {
    return generatePublicId(publicSlug);
  }

  const random = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${publicSlug}-${random}`;
}

function formatEditionDisplay(value) {
  return String(value).padStart(2, '0');
}

function buildEditionText(editionNumber, totalEditions) {
  return `Edition ${formatEditionDisplay(editionNumber)} / ${totalEditions}`;
}

function buildRecord({
  artworkCode,
  size,
  editionNumber,
  title,
  image,
}) {
  const sizeConfig = SIZE_MAP[size];
  const publicSlug = buildPublicSlug(artworkCode, size, editionNumber);
  const publicId = buildPublicId(publicSlug);

  return {
    verified: DEFAULTS.verified,
    title,
    artworkId: publicSlug,
    edition: buildEditionText(editionNumber, sizeConfig.editionTotal),
    artist: DEFAULTS.artist,
    medium: DEFAULTS.medium,
    size: sizeConfig.label,
    frame: DEFAULTS.frame,
    archiveDate: formatArchiveDate(),
    archiveUrl: `${ARCHIVE_BASE_URL}/${publicSlug}`,
    image,
    signature: DEFAULTS.signature,
    artworkCode,
    publicId,
    publicSlug,
  };
}

function writeRecordFile(record) {
  const recordDir = path.join(RECORDS_DIR, record.publicSlug);
  const outputPath = path.join(recordDir, 'data.json');

  ensureDir(recordDir);
  fs.writeFileSync(outputPath, JSON.stringify(record, null, 2), 'utf8');

  return outputPath;
}

function main() {
  const [, , rawArtworkCode, rawSize, rawEdition, rawTitle, rawImage] = process.argv;

  if (!rawArtworkCode || !rawSize || !rawEdition || !rawTitle) {
    console.error(
      'Usage: node build-records.js <artworkCode> <size:S|M|L> <editionNumber> "<title>" [imageFilename]'
    );
    process.exit(1);
  }

  const artworkCode = normalizeArtworkCode(rawArtworkCode);
  const size = normalizeSize(rawSize);
  const editionNumber = normalizeEditionNumber(rawEdition);
  const title = normalizeTitle(rawTitle);
  const image = normalizeImage(rawImage, artworkCode);

  const maxEdition = SIZE_MAP[size].editionTotal;
  if (editionNumber > maxEdition) {
    throw new Error(
      `edition ${editionNumber} exceeds max editions for size ${size} (${maxEdition}).`
    );
  }

  ensureDir(RECORDS_DIR);

  const record = buildRecord({
    artworkCode,
    size,
    editionNumber,
    title,
    image,
  });

  const outputPath = writeRecordFile(record);

  console.log(`Created: ${outputPath}`);
  console.log(JSON.stringify(record, null, 2));
}

main();