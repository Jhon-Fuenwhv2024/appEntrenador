const assert = require('node:assert/strict');
const test = require('node:test');

const checkTrainerLimits = require('../src/middleware/checkTrainerLimits');
const invitesController = require('../src/modules/invites/invites.controller');
const authRouter = require('../src/modules/auth/auth.routes');

test('the legacy invite alias enforces trainer plan limits before creating an invite', () => {
  const routeLayer = authRouter.stack.find(
    (layer) => layer.route?.path === '/generate-token',
  );

  assert.ok(routeLayer, 'POST /generate-token must remain registered');
  assert.equal(routeLayer.route.methods.post, true);

  const handlers = routeLayer.route.stack.map((layer) => layer.handle);
  const limitIndex = handlers.indexOf(checkTrainerLimits);
  const createIndex = handlers.indexOf(invitesController.create);

  assert.notEqual(limitIndex, -1, 'plan-limit middleware must be registered');
  assert.notEqual(createIndex, -1, 'invite controller must be registered');
  assert.equal(
    limitIndex,
    createIndex - 1,
    'plan limits must be checked immediately before invite creation',
  );
});
