const test = require('node:test');
const assert = require('node:assert/strict');

const profileService = require('../src/modules/profile/profile.service');
const profileController = require('../src/modules/profile/profile.controller');
const profileRoutes = require('../src/modules/profile/profile.routes');

test('profile updates authorize ownership before writing an avatar', () => {
  const putRoute = profileRoutes.stack.find(
    (layer) => layer.route?.path === '/profile/:userId' && layer.route.methods.put,
  );

  assert.ok(putRoute, 'PUT /profile/:userId route must exist');

  const middlewareNames = putRoute.route.stack.map((layer) => layer.handle.name);
  const authorizationIndex = middlewareNames.indexOf('authorizeByUserId');
  const uploadIndex = middlewareNames.indexOf('uploadAvatarMiddleware');

  assert.notEqual(authorizationIndex, -1, 'ownership authorization middleware is required');
  assert.notEqual(uploadIndex, -1, 'avatar upload middleware is required');
  assert.ok(
    authorizationIndex < uploadIndex,
    'ownership authorization must run before the avatar is written',
  );
});

test('profile authorization stops unauthorized requests', async (t) => {
  const originalAuthorize = profileService.assertCanAccessProfile;
  const originalConsoleError = console.error;
  let nextCalled = false;

  t.after(() => {
    profileService.assertCanAccessProfile = originalAuthorize;
    console.error = originalConsoleError;
  });

  profileService.assertCanAccessProfile = async () => {
    const error = new Error('No autorizado');
    error.code = 403;
    throw error;
  };
  console.error = () => {};

  const response = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };

  await profileController.authorizeByUserId(
    { params: { userId: '42' }, user: { id: 7, rol: 'client' } },
    response,
    () => {
      nextCalled = true;
    },
  );

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.success, false);
  assert.equal(nextCalled, false);
});
