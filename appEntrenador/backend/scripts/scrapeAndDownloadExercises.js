/**
 * Feature 044 — Scraping ético Fitcron + descarga de media local.
 *
 * Fuente: https://fitcron.com/exercises/ (robots.txt permite crawl).
 * No es un endpoint HTTP: solo script CLI.
 *
 * Usage (desde backend/):
 *   node scripts/scrapeAndDownloadExercises.js --dry-run
 *   node scripts/scrapeAndDownloadExercises.js --import-missing
 *   node scripts/scrapeAndDownloadExercises.js --import-missing --skip-detail
 *   node scripts/scrapeAndDownloadExercises.js --import-missing --limit=20
 *
 * Flags:
 *   --dry-run          Solo reporta acciones (sin disco ni DB)
 *   --import-missing   INSERT globales nuevos cuando no hay match wrkout
 *   --limit=N          Máx. acciones (update+insert) a procesar
 *   --skip-detail      No visita fichas (sin description_es)
 *   --delay-ms=N       Delay fijo; default aleatorio 3000–5000
 *   --skip-enriched    Omite filas que ya tienen local_media_path (re-runs)
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const cheerio = require('cheerio');
const pool = require('../src/config/db');
const {
  ensureExercisesI18nColumns,
  ensureExercisesMediaDir,
} = require('../src/db/ensureExercisesI18nColumns');

const LIST_URL = 'https://fitcron.com/exercises/';
const USER_AGENT =
  'TrainfitBot/1.0 (+https://trainfit.app; exercise-catalog-i18n; contact=dev@trainfit.app)';
const DEFAULT_MIN_DELAY_MS = 3000;
const DEFAULT_MAX_DELAY_MS = 5000;
const UPLOADS_REL = '/uploads/exercises';
const NAME_MAX = 150;
const MUSCLE_MAX = 100;
const DEFAULT_MUSCLE = 'General';

const http = axios.create({
  timeout: 45000,
  headers: {
    'User-Agent': USER_AGENT,
    Accept: 'text/html,application/xhtml+xml,image/*,*/*;q=0.8',
  },
  maxRedirects: 5,
  validateStatus: (status) => status >= 200 && status < 400,
});

function parseArgs(argv) {
  const flags = {
    dryRun: false,
    skipDetail: false,
    importMissing: false,
    skipEnriched: false,
    limit: null,
    delayMs: null,
  };
  for (const arg of argv) {
    if (arg === '--dry-run') flags.dryRun = true;
    else if (arg === '--skip-detail') flags.skipDetail = true;
    else if (arg === '--import-missing') flags.importMissing = true;
    else if (arg === '--skip-enriched') flags.skipEnriched = true;
    else if (arg.startsWith('--limit=')) {
      const n = Number(arg.slice('--limit='.length));
      flags.limit = Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
    } else if (arg.startsWith('--delay-ms=')) {
      const n = Number(arg.slice('--delay-ms='.length));
      flags.delayMs = Number.isFinite(n) && n >= 0 ? Math.floor(n) : null;
    }
  }
  return flags;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomDelayMs(fixedMs) {
  if (fixedMs != null) return fixedMs;
  return (
    DEFAULT_MIN_DELAY_MS
    + Math.floor(Math.random() * (DEFAULT_MAX_DELAY_MS - DEFAULT_MIN_DELAY_MS + 1))
  );
}

function truncate(value, max) {
  const s = String(value || '').trim();
  if (!s) return '';
  return s.length <= max ? s : s.slice(0, max);
}

function normalizeKey(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function englishNameFromMediaUrl(mediaUrl) {
  if (!mediaUrl) return null;
  const file = decodeURIComponent(mediaUrl.split('/').pop() || '');
  let base = file.replace(/\.(gif|mp4|webm|jpe?g|png)$/i, '');
  base = base.replace(/^\d+-/, '');
  base = base.replace(/_[A-Za-z][A-Za-z0-9-]*_\d+$/i, '');
  base = base.replace(/_\d+$/i, '');
  const cleaned = base.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned || null;
}

function tokenSet(value) {
  const stop = new Set(['the', 'a', 'an', 'and', 'of', 'on', 'to', 'with', 'version', 'v2', 'v3']);
  return new Set(
    normalizeKey(value)
      .split(' ')
      .filter((t) => t && t.length > 1 && !stop.has(t)),
  );
}

function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const t of a) {
    if (b.has(t)) inter += 1;
  }
  const union = a.size + b.size - inter;
  return union === 0 ? 0 : inter / union;
}

function isSafeContainment(a, b) {
  if (!a || !b || a === b) return a === b;
  const shorter = a.length <= b.length ? a : b;
  const longer = a.length <= b.length ? b : a;
  if (shorter.length < 12 || shorter.split(' ').length < 3) return false;
  return longer.includes(shorter);
}

function findCatalogMatch(item, index, catalogRows, usedIds = null) {
  const esKey = normalizeKey(item.nameEs);
  if (esKey && index.has(`es:${esKey}`)) {
    const byEs = index.get(`es:${esKey}`);
    if (!usedIds || !usedIds.has(byEs.id)) return byEs;
  }

  if (item.nameEnKey && index.has(item.nameEnKey)) {
    const exact = index.get(item.nameEnKey);
    if (!usedIds || !usedIds.has(exact.id)) return exact;
  }

  const guessTokens = tokenSet(item.nameEnGuess || '');
  if (!guessTokens.size && !item.nameEnKey) return null;

  let best = null;
  let bestScore = 0;

  for (const row of catalogRows) {
    if (usedIds && usedIds.has(row.id)) continue;
    const nameKey = normalizeKey(row.name);
    if (!nameKey) continue;

    if (item.nameEnKey && nameKey === item.nameEnKey) return row;

    if (item.nameEnKey && isSafeContainment(nameKey, item.nameEnKey)) {
      if (0.88 > bestScore) {
        bestScore = 0.88;
        best = row;
      }
      continue;
    }

    if (guessTokens.size) {
      const score = jaccard(guessTokens, tokenSet(row.name));
      if (score > bestScore) {
        bestScore = score;
        best = row;
      }
    }
  }

  return bestScore >= 0.72 ? best : null;
}

function extensionFromUrl(url) {
  const clean = String(url || '').split('?')[0];
  const match = clean.match(/\.(gif|mp4|webm|jpe?g|png)$/i);
  return match ? match[1].toLowerCase().replace('jpeg', 'jpg') : 'gif';
}

function mediaTypeFromExt(ext) {
  if (ext === 'mp4' || ext === 'webm') return 'video';
  if (ext === 'gif') return 'gif';
  if (ext === 'jpg' || ext === 'png') return 'image';
  return 'gif';
}

function localRelativePath(exerciseId, ext) {
  return `${UPLOADS_REL}/exercise_${exerciseId}.${ext}`;
}

function mediaAbsPath(exerciseId, ext) {
  return path.join(
    __dirname,
    '..',
    'public',
    'uploads',
    'exercises',
    `exercise_${exerciseId}.${ext}`,
  );
}

async function fetchHtml(url, delayMs) {
  const wait = randomDelayMs(delayMs);
  console.log(`[delay] ${wait}ms → ${url}`);
  await sleep(wait);
  const res = await http.get(url, { responseType: 'text' });
  return res.data;
}

function parseListing(html) {
  const $ = cheerio.load(html);
  const items = [];
  const seen = new Set();

  $('.view-item').each((_, el) => {
    const $el = $(el);
    const nameEs = ($el.attr('data-name') || $el.find('.item-name').text() || '').trim();
    const targetMuscleEs = ($el.attr('data-main-muscle') || '').trim() || null;
    const detailUrl = $el.find('a[href*="/exercise/"]').attr('href') || null;
    const mediaUrl = $el.find('.item-image img').attr('src')
      || $el.find('img').attr('src')
      || null;

    if (!nameEs || !detailUrl || !mediaUrl) return;
    if (seen.has(detailUrl)) return;
    seen.add(detailUrl);

    const nameEnGuess = englishNameFromMediaUrl(mediaUrl);
    items.push({
      nameEs,
      targetMuscleEs,
      detailUrl,
      sourceMediaUrl: mediaUrl,
      nameEnGuess,
      nameEnKey: normalizeKey(nameEnGuess),
    });
  });

  return items;
}

async function scrapeDetailDescription(detailUrl, delayMs) {
  const html = await fetchHtml(detailUrl, delayMs);
  const $ = cheerio.load(html);

  const og = $('meta[property="og:description"]').attr('content');
  if (og && og.trim()) {
    return og.replace(/\[\s*&hellip;\s*\]/gi, '').replace(/…/g, '').trim();
  }

  const paragraphs = [];
  $('.elementor-widget-theme-post-content p, .entry-content p, article p').each((_, el) => {
    const text = $(el).text().replace(/\s+/g, ' ').trim();
    if (text.length > 40) paragraphs.push(text);
  });
  return paragraphs[0] || null;
}

async function downloadMediaIfNeeded({
  sourceUrl,
  absolutePath,
  dryRun,
  delayMs,
}) {
  if (fs.existsSync(absolutePath)) {
    return { skipped: true, reason: 'already-exists' };
  }
  if (dryRun) {
    return { skipped: true, reason: 'dry-run' };
  }

  const wait = randomDelayMs(delayMs);
  console.log(`[delay] ${wait}ms → download ${sourceUrl}`);
  await sleep(wait);

  const res = await http.get(sourceUrl, { responseType: 'stream' });
  await fs.promises.mkdir(path.dirname(absolutePath), { recursive: true });

  await new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(absolutePath);
    res.data.pipe(writer);
    writer.on('finish', resolve);
    writer.on('error', reject);
    res.data.on('error', reject);
  });

  return { skipped: false };
}

async function loadCatalogExercises(connection) {
  const [rows] = await connection.query(
    `SELECT id, name, name_es, description_es, local_media_path, media_type
     FROM exercises
     WHERE created_by_trainer_id IS NULL
     ORDER BY id ASC`,
  );
  return rows;
}

function buildCatalogIndex(rows) {
  const byKey = new Map();
  for (const row of rows) {
    const key = normalizeKey(row.name);
    if (key && !byKey.has(key)) byKey.set(key, row);
    const esKey = normalizeKey(row.name_es);
    if (esKey && !byKey.has(`es:${esKey}`)) byKey.set(`es:${esKey}`, row);
  }
  return byKey;
}

async function nameExistsGlobal(connection, name) {
  const [rows] = await connection.query(
    `SELECT id FROM exercises
     WHERE name = ? AND created_by_trainer_id IS NULL
     LIMIT 1`,
    [name],
  );
  return rows.length > 0;
}

async function resolveUniqueGlobalName(connection, preferred, fallbackEn) {
  const candidates = [
    truncate(preferred, NAME_MAX),
    truncate(fallbackEn, NAME_MAX),
  ].filter(Boolean);

  for (const base of candidates) {
    if (!(await nameExistsGlobal(connection, base))) return base;
  }

  const root = truncate(preferred || fallbackEn || 'Exercise', NAME_MAX - 6) || 'Exercise';
  for (let i = 2; i < 200; i += 1) {
    const candidate = truncate(`${root} (${i})`, NAME_MAX);
    if (!(await nameExistsGlobal(connection, candidate))) return candidate;
  }
  throw new Error(`No se pudo generar nombre único para "${preferred}"`);
}

async function upsertExercise(connection, {
  id,
  nameEs,
  descriptionEs,
  targetMuscleEs,
  localMediaPath,
  mediaType,
}) {
  await connection.query(
    `UPDATE exercises
     SET name_es = COALESCE(?, name_es),
         description_es = COALESCE(?, description_es),
         target_muscle_es = COALESCE(?, target_muscle_es),
         local_media_path = COALESCE(?, local_media_path),
         media_type = CASE
           WHEN ? IS NOT NULL AND ? <> 'none' THEN ?
           ELSE media_type
         END
     WHERE id = ?
       AND created_by_trainer_id IS NULL`,
    [
      nameEs,
      descriptionEs,
      targetMuscleEs,
      localMediaPath,
      mediaType,
      mediaType,
      mediaType,
      id,
    ],
  );
}

async function insertExercise(connection, {
  name,
  nameEs,
  descriptionEs,
  targetMuscle,
  targetMuscleEs,
  mediaType,
  localMediaPath,
}) {
  const [result] = await connection.query(
    `INSERT INTO exercises
      (name, name_es, description, description_es, target_muscle, target_muscle_es,
       media_type, media_url, local_media_path, created_by_trainer_id)
     VALUES (?, ?, NULL, ?, ?, ?, ?, NULL, ?, NULL)`,
    [
      name,
      nameEs,
      descriptionEs,
      targetMuscle,
      targetMuscleEs,
      mediaType,
      localMediaPath,
    ],
  );
  return result.insertId;
}

async function fetchDescription(item, flags, stats) {
  if (flags.skipDetail) return null;
  try {
    const descriptionEs = await scrapeDetailDescription(item.detailUrl, flags.delayMs);
    stats.detailFetched += 1;
    return descriptionEs;
  } catch (err) {
    stats.errors += 1;
    console.warn(`[detail] error ${item.detailUrl}:`, err.message);
    return null;
  }
}

async function downloadForExercise(item, exerciseId, flags, stats) {
  const ext = extensionFromUrl(item.sourceMediaUrl);
  const relPath = localRelativePath(exerciseId, ext);
  const absPath = mediaAbsPath(exerciseId, ext);
  const mediaType = mediaTypeFromExt(ext);

  try {
    const dl = await downloadMediaIfNeeded({
      sourceUrl: item.sourceMediaUrl,
      absolutePath: absPath,
      dryRun: flags.dryRun,
      delayMs: flags.delayMs,
    });
    if (dl.skipped) {
      stats.downloadSkipped += 1;
      if (dl.reason === 'already-exists') {
        console.log(`[download] skip exists: ${absPath}`);
      } else {
        console.log(`[download] would download: ${item.sourceMediaUrl} → ${absPath}`);
      }
    } else {
      stats.downloaded += 1;
      console.log(`[download] saved: ${absPath}`);
    }
  } catch (err) {
    stats.errors += 1;
    console.warn(`[download] error ${item.sourceMediaUrl}:`, err.message);
  }

  return { relPath, mediaType, ext };
}

async function main() {
  const flags = parseArgs(process.argv.slice(2));
  console.log('[scrapeAndDownloadExercises] flags:', flags);
  console.log(`[scrapeAndDownloadExercises] User-Agent: ${USER_AGENT}`);

  await ensureExercisesI18nColumns();
  const mediaDir = ensureExercisesMediaDir();
  console.log(`[scrapeAndDownloadExercises] media dir: ${mediaDir}`);

  const listHtml = await fetchHtml(LIST_URL, flags.delayMs);
  const scraped = parseListing(listHtml);
  console.log(`[scrapeAndDownloadExercises] listados Fitcron: ${scraped.length}`);

  const connection = await pool.getConnection();
  const stats = {
    scraped: scraped.length,
    matched: 0,
    unmatched: 0,
    updated: 0,
    inserted: 0,
    skippedEnriched: 0,
    downloaded: 0,
    downloadSkipped: 0,
    detailFetched: 0,
    errors: 0,
  };
  const unmatchedSamples = [];

  try {
    let catalog = await loadCatalogExercises(connection);
    let index = buildCatalogIndex(catalog);
    console.log(`[scrapeAndDownloadExercises] catálogo global DB: ${catalog.length}`);

    let processedActions = 0;
    const usedIds = new Set();

    for (const item of scraped) {
      if (flags.limit != null && processedActions >= flags.limit) {
        break;
      }

      let match = findCatalogMatch(item, index, catalog, usedIds);

      // Sin match: importar como fila nueva si --import-missing
      if (!match) {
        stats.unmatched += 1;
        if (unmatchedSamples.length < 15) {
          unmatchedSamples.push({
            reason: item.nameEnKey ? 'no-db-match' : 'no-en-guess',
            nameEs: item.nameEs,
            nameEnGuess: item.nameEnGuess,
          });
        }

        if (!flags.importMissing) {
          continue;
        }

        processedActions += 1;
        const descriptionEs = await fetchDescription(item, flags, stats);
        const muscleEs = truncate(item.targetMuscleEs || DEFAULT_MUSCLE, MUSCLE_MAX)
          || DEFAULT_MUSCLE;
        const preferredName = truncate(item.nameEs, NAME_MAX);

        if (flags.dryRun) {
          console.log('[insert] dry-run', {
            name: preferredName,
            name_es: item.nameEs,
            target_muscle: muscleEs,
            source: item.sourceMediaUrl,
            description_es: descriptionEs
              ? `${descriptionEs.slice(0, 80)}…`
              : null,
          });
          stats.inserted += 1;
          continue;
        }

        try {
          const uniqueName = await resolveUniqueGlobalName(
            connection,
            preferredName,
            item.nameEnGuess,
          );
          // Placeholder path until we know id — insert then update path.
          const insertId = await insertExercise(connection, {
            name: uniqueName,
            nameEs: truncate(item.nameEs, NAME_MAX),
            descriptionEs,
            targetMuscle: muscleEs,
            targetMuscleEs: muscleEs,
            mediaType: 'gif',
            localMediaPath: null,
          });

          const { relPath, mediaType } = await downloadForExercise(
            item,
            insertId,
            flags,
            stats,
          );

          await connection.query(
            `UPDATE exercises
             SET local_media_path = ?, media_type = ?
             WHERE id = ? AND created_by_trainer_id IS NULL`,
            [relPath, mediaType, insertId],
          );

          const newRow = {
            id: insertId,
            name: uniqueName,
            name_es: item.nameEs,
            local_media_path: relPath,
            media_type: mediaType,
          };
          catalog.push(newRow);
          index = buildCatalogIndex(catalog);
          usedIds.add(insertId);
          stats.inserted += 1;
          console.log(
            `[insert] #${insertId} "${uniqueName}" | media → ${relPath}`,
          );
        } catch (err) {
          stats.errors += 1;
          console.warn(`[insert] error "${item.nameEs}":`, err.message);
        }
        continue;
      }

      usedIds.add(match.id);
      stats.matched += 1;

      if (flags.skipEnriched && match.local_media_path) {
        stats.skippedEnriched += 1;
        continue;
      }

      processedActions += 1;

      const descriptionEs = await fetchDescription(item, flags, stats);
      const { relPath, mediaType } = await downloadForExercise(
        item,
        match.id,
        flags,
        stats,
      );

      console.log(
        `[match] #${match.id} "${match.name}" ← "${item.nameEs}"`
        + ` | media → ${relPath}`
        + (flags.dryRun ? ' [dry-run]' : ''),
      );

      if (flags.dryRun) {
        console.log('[upsert] dry-run', {
          id: match.id,
          name_es: item.nameEs,
          description_es: descriptionEs
            ? `${descriptionEs.slice(0, 80)}…`
            : null,
          target_muscle_es: item.targetMuscleEs,
          local_media_path: relPath,
          media_type: mediaType,
        });
        stats.updated += 1;
        continue;
      }

      try {
        await upsertExercise(connection, {
          id: match.id,
          nameEs: truncate(item.nameEs, NAME_MAX),
          descriptionEs,
          targetMuscleEs: truncate(item.targetMuscleEs, MUSCLE_MAX) || null,
          localMediaPath: relPath,
          mediaType,
        });
        match.local_media_path = relPath;
        match.name_es = item.nameEs;
        stats.updated += 1;
      } catch (err) {
        stats.errors += 1;
        console.warn(`[upsert] error #${match.id}:`, err.message);
      }
    }

    console.log('\n=== RESUMEN ===');
    console.log(stats);
    console.log(`Tasa de match: ${scraped.length
      ? ((stats.matched / scraped.length) * 100).toFixed(1)
      : 0}%`);
    if (flags.importMissing) {
      console.log(
        `Importados / a importar: ${stats.inserted} | Actualizados: ${stats.updated}`,
      );
    }
    if (unmatchedSamples.length && !flags.importMissing) {
      console.log('Muestras unmatched (usa --import-missing para crearlos):', unmatchedSamples);
    }
  } finally {
    connection.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('[scrapeAndDownloadExercises] Fatal:', err.message);
  process.exitCode = 1;
  pool.end().catch(() => {});
});
