const bcrypt = require('bcryptjs');
const pool = require('./config/db');

async function create() {
  try {
    console.log('Connecting to database...');
    const hash = await bcrypt.hash('Admin@123456', 12);
    console.log('Hash generated:', hash);

    const [result] = await pool.query(
      'INSERT INTO admins (name, email, password_hash) VALUES (?, ?, ?)',
      ['Admin', 'admin@school.ac.ke', hash]
    );

    console.log('✅ Admin created successfully! ID:', result.insertId);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      console.log('Admin already exists, updating password...');
      const hash = await bcrypt.hash('Admin@123456', 12);
      await pool.query(
        'UPDATE admins SET password_hash = ? WHERE email = ?',
        [hash, 'admin@school.ac.ke']
      );
      console.log('✅ Password updated!');
    } else {
      console.error('❌ Error:', err.message);
      console.error(err);
    }
  }
  process.exit();
}

create();