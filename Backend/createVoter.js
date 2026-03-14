const bcrypt = require('bcryptjs');
const pool = require('./config/db');

async function create() {
  try {
    console.log('Creating test voter...');
    const hash = await bcrypt.hash('Voter@123456', 12);

    const [result] = await pool.query(
      'INSERT INTO voters (name, reg_number, email, password_hash) VALUES (?, ?, ?, ?)',
      ['John Mutuku', '24/06962', 'johnnzioka803@gmail.com', hash]
    );

    console.log('✅ Voter created! ID:', result.insertId);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      console.log('Voter already exists, updating...');
      const hash = await bcrypt.hash('Voter@123456', 12);
      await pool.query(
        'UPDATE voters SET password_hash = ? WHERE reg_number = ?',
        [hash, '24/06962']
      );
      console.log('✅ Voter password updated!');
    } else {
      console.error('❌ Error:', err.message);
    }
  }
  process.exit();
}

create();