import assert from 'node:assert/strict';
import { translations } from './src/i18n/translations.ts';

console.log('🧪 Testing Finance Dashboard i18n Dictionary Integrity...');

assert.ok(translations.en, 'English dictionary must exist');
assert.ok(translations.id, 'Bahasa Indonesia dictionary must exist');

function getKeys(obj, prefix = '') {
  let keys = [];
  for (const [key, val] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof val === 'object' && val !== null) {
      keys = keys.concat(getKeys(val, fullKey));
    } else {
      keys.push({ key: fullKey, value: val });
    }
  }
  return keys;
}

const enKeys = getKeys(translations.en);
const idKeys = getKeys(translations.id);

const enKeyMap = new Map(enKeys.map((item) => [item.key, item.value]));
const idKeyMap = new Map(idKeys.map((item) => [item.key, item.value]));

console.log(`- Total EN translation keys: ${enKeys.length}`);
console.log(`- Total ID translation keys: ${idKeys.length}`);

assert.equal(
  enKeys.length,
  idKeys.length,
  `Key mismatch count: EN=${enKeys.length}, ID=${idKeys.length}`
);

for (const [key, enVal] of enKeyMap.entries()) {
  assert.ok(idKeyMap.has(key), `Missing ID key: ${key}`);
  const idVal = idKeyMap.get(key);
  assert.ok(typeof enVal === 'string' && enVal.trim().length > 0, `Empty EN key: ${key}`);
  assert.ok(typeof idVal === 'string' && idVal.trim().length > 0, `Empty ID key: ${key}`);
}

console.log('✅ ALL Finance Dashboard i18n tests passed successfully (100% key parity)!');
