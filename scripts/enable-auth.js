const fs = require('fs');
const crypto = require('crypto');

const envPath = '.env';
if (!fs.existsSync(envPath)) throw new Error('Create .env with DATABASE_URL before enabling authentication.');

let env = fs.readFileSync(envPath, 'utf8');
const jwtSecret = crypto.randomBytes(48).toString('hex');
if (/^JWT_SECRET=/m.test(env)) env = env.replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${jwtSecret}`);
else env += `\nJWT_SECRET=${jwtSecret}\n`;
if (/^AUTH_REQUIRED=/m.test(env)) env = env.replace(/^AUTH_REQUIRED=.*$/m, 'AUTH_REQUIRED=true');
else env += 'AUTH_REQUIRED=true\n';
if (/^NODE_ENV=/m.test(env)) env = env.replace(/^NODE_ENV=.*$/m, 'NODE_ENV=development');
else env += 'NODE_ENV=development\n';
fs.writeFileSync(envPath, env);
console.log('Authentication enabled locally. The JWT secret was saved in .env and was not printed.');
