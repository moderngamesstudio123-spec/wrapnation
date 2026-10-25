const crypto = require('crypto');

const secret = process.env.HMAC_SECRET || 'wrap_nation_table_hmac_secret_key_must_be_random_and_secure!';

console.log('=== WRAP NATION TABLE QR URLS ===\n');
for (let i = 1; i <= 12; i++) {
  const sig = crypto.createHmac('sha256', secret).update(`table:${i}`).digest('hex');
  console.log(`Table #${i}: /t/${i}.${sig}`);
}
