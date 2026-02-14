/**
 * Update an admin's password (hashes it via User model).
 * Use this if you inserted an admin via MySQL with a plain password.
 * Run: node scripts/update-admin-password.mjs <email> <newPassword>
 */

import db from '../src/models/index.js';

const { User } = db;

async function main() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error('Usage: node scripts/update-admin-password.mjs <email> <newPassword>');
    process.exit(1);
  }

  try {
    await db.sequelize.authenticate();

    const user = await User.findOne({ where: { email } });
    if (!user) {
      console.error('User not found:', email);
      process.exit(1);
    }

    user.password = password;
    await user.save(); // beforeUpdate hook hashes the password

    console.log('Password updated for', email);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  } finally {
    await db.sequelize.close();
  }
}

main();
