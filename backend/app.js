const express = require('express');
const cors = require('cors');
require('dotenv').config();
const {pool} = require('./config/db');
const {userRouter} = require('./routes/user.routes');

const app = express();
app.use(cors());

app.use(express.json());

app.get("/test-db", async (req, res) => {
  try {
    const result = await pool.query(
      `
      INSERT INTO public.users (full_name, email, password)
      VALUES ($1, $2, $3)
      RETURNING id, full_name, email, created_at
      `,
      [
        "Test User",
        `test_${Date.now()}@example.com`,
        "dummy_hashed_password"
      ]
    );

    res.json({
      status: "db write success",
      user: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      status: "db write failed",
      error: err.message
    });
  }
});

app.use("/api/users", userRouter);
app.use("/api/appointments", require("./routes/appointment.routes").appointmentRouter);
<<<<<<< HEAD

=======
app.use("/api/razorpay", require("./routes/razorpay.routes"));
>>>>>>> ddd86cfecc32b456310dfedffb4312ad2a35fbc4
app.listen(5000, ()=>{
    console.log('server is running on port 3000');  
})
