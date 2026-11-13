import test from 'node:test';
import assert from 'node:assert/strict';
import { resourcesForAwsClfObjective } from '../lib/aws-clf-resources.ts';

test('maps an objective to existing resources and focused practice', () => {
  const resources = resourcesForAwsClfObjective('4.2');
  assert.ok(resources.some((resource) => resource.type === 'notes'));
  assert.ok(resources.some((resource) => resource.type === 'practice' && resource.href === '/test?exam=clf-c02&focus=4.2'));
  assert.equal(new Set(resources.map((resource) => resource.href)).size, resources.length);
});

test('unknown objectives fail safely without fabricated resources', () => {
  assert.deepEqual(resourcesForAwsClfObjective('99.9'), []);
});
