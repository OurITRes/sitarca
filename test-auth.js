import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_FILE = path.join(__dirname, 'server/data/config.json');

function hashPassword(pwd) {
  return crypto.createHash('sha256').update(pwd || '').digest('hex');
}

function readFull() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch {
    return { config: {}, supportedLanguages: [], users: [], roles: [] };
  }
}

function createUser(user) {
  const full = readFull();
  if (!user.id) throw new Error('id_required: Field "id" is required');
  full.users = full.users || [];
  if (full.users.find(u => u.id === user.id)) throw new Error(`user_exists: User ${user.id} already exists`);
  
  if (user.password) {
    user.passwordHash = hashPassword(user.password);
    delete user.password;
  }
  
  user.roles = user.roles || ['user'];
  user.authMode = user.authMode || 'local';
  
  full.users.push(user);
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(full, null, 2));
  return user;
}

function login(id, password) {
  const full = readFull();
  const user = (full.users || []).find(u => u.id === id);
  if (!user) throw new Error(`user_not_found: User ${id} not found`);
  const expected = (user.passwordHash || '');
  const suppliedHash = hashPassword(password);
  if (expected !== suppliedHash) throw new Error('wrong_password: Password does not match');
  return { token: crypto.randomBytes(16).toString('hex'), id, roles: user.roles || [] };
}

async function test() {
  console.log('\n=== TEST 1: Create user ===');
  try {
    const newUser = createUser({
      id: 'testuser@local.com',
      displayName: 'Test User',
      password: 'SecurePass123'
    });
    console.log('✓ User created:', JSON.stringify(newUser, null, 2));
  } catch (e) {
    console.error('✗ Error:', e.message);
  }

  console.log('\n=== TEST 2: Verify config.json was updated ===');
  try {
    const full = readFull();
    const created = full.users.find(u => u.id === 'testuser@local.com');
    if (created) {
      console.log('✓ User found in config.json:');
      console.log('  - id:', created.id);
      console.log('  - displayName:', created.displayName);
      console.log('  - passwordHash:', created.passwordHash ? '(set)' : '(empty)');
      console.log('  - authMode:', created.authMode);
      console.log('  - roles:', created.roles);
    } else {
      console.error('✗ User NOT found in config.json');
    }
  } catch (e) {
    console.error('✗ Error:', e.message);
  }

  console.log('\n=== TEST 3: Login with correct password ===');
  try {
    const result = login('testuser@local.com', 'SecurePass123');
    console.log('✓ Login successful:', JSON.stringify(result, null, 2));
  } catch (e) {
    console.error('✗ Error:', e.message);
  }

  console.log('\n=== TEST 4: Login with wrong password ===');
  try {
    const result = login('testuser@local.com', 'WrongPassword');
    console.log('✗ Should have failed but didn\'t:', result);
  } catch (e) {
    console.log('✓ Expected error:', e.message);
  }

  console.log('\n=== TEST 5: Login with non-existent user ===');
  try {
    const result = login('nonexistent@local.com', 'AnyPassword');
    console.log('✗ Should have failed but didn\'t:', result);
  } catch (e) {
    console.log('✓ Expected error:', e.message);
  }

  console.log('\n=== Final config.json ===');
  const full = readFull();
  console.log(JSON.stringify(full, null, 2));
}

test().catch(console.error);
