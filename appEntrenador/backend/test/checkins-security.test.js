const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const db = require('../src/config/db');
const clientsService = require('../src/modules/clients/clients.service');
const {
  PHOTOS_DIR,
  cleanupProgressPhotoFiles,
  ensurePhotosDir,
} = require('../src/middleware/uploadProgressPhotos');
const checkinsService = require('../src/modules/checkins/checkins.service');

test('check-in history exposes only the protected photo endpoint', async () => {
  const originalQuery = db.query;
  db.query = async (sql) => {
    if (sql.includes('FROM weekly_checkins')) {
      return [[{
        id: 10,
        client_id: 5,
        created_at: '2026-07-16',
        sleep_quality: 4,
        stress_level: 2,
        diet_adherence: 5,
        notes: null,
      }]];
    }
    return [[{
      id: 42,
      client_id: 5,
      checkin_id: 10,
      image_url: '/uploads/photos/private.jpg',
      pose_type: 'front',
      taken_at: '2026-07-16',
    }]];
  };

  try {
    const result = await checkinsService.listByClient(
      { id: 5, rol: 'client' },
      5,
    );
    assert.equal(result[0].photos[0].image_url, '/api/checkins/photos/42');
  } finally {
    db.query = originalQuery;
  }
});

test('photo download enforces client and trainer ownership', async () => {
  ensurePhotosDir();
  const filename = `security-test-${process.pid}.jpg`;
  const absolutePath = path.join(PHOTOS_DIR, filename);
  fs.writeFileSync(absolutePath, 'test');

  const originalQuery = db.query;
  const originalOwnershipCheck = clientsService.getClientOwnedByTrainer;
  db.query = async () => [[{
    id: 42,
    client_id: 5,
    image_url: `/uploads/photos/${filename}`,
  }]];

  try {
    await assert.rejects(
      checkinsService.getPhotoForRequester({ id: 6, rol: 'client' }, 42),
      (error) => error.code === 403,
    );

    const ownPhoto = await checkinsService.getPhotoForRequester(
      { id: 5, rol: 'client' },
      42,
    );
    assert.equal(ownPhoto.absolutePath, absolutePath);

    let checkedOwnership = null;
    clientsService.getClientOwnedByTrainer = async (clientId, trainerId) => {
      checkedOwnership = { clientId, trainerId };
    };
    await checkinsService.getPhotoForRequester(
      { id: 9, rol: 'trainer' },
      42,
    );
    assert.deepEqual(checkedOwnership, { clientId: 5, trainerId: 9 });
  } finally {
    db.query = originalQuery;
    clientsService.getClientOwnedByTrainer = originalOwnershipCheck;
    fs.rmSync(absolutePath, { force: true });
  }
});

test('stored photo paths cannot escape the progress-photo directory', () => {
  assert.throws(
    () => checkinsService.resolveStoredPhotoPath('/uploads/photos/../secret.jpg'),
    (error) => error.code === 404,
  );
  assert.throws(
    () => checkinsService.resolveStoredPhotoPath('/uploads/photos/nested/photo.jpg'),
    (error) => error.code === 404,
  );
});

test('failed multipart requests remove files already written by multer', () => {
  ensurePhotosDir();
  const absolutePath = path.join(PHOTOS_DIR, `cleanup-test-${process.pid}.jpg`);
  fs.writeFileSync(absolutePath, 'test');

  cleanupProgressPhotoFiles({
    front: [{ path: absolutePath }],
  });

  assert.equal(fs.existsSync(absolutePath), false);
});
