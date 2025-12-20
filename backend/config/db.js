const pkg = require('pg');
const { Pool } = pkg;

 const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // REQUIRED for Render
  },
});

module.exports = { pool };

(async () => {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("DB connected at:", res.rows[0].now);
  } catch (err) {
    console.error("DB connection failed:", err);
  }
})();

