const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/db.js");
const crypto = require("crypto");

/**
 * REGISTER
 */ const registerUser = async (req, res) => {
  const { full_name, email, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const result = await pool.query(
      `
      INSERT INTO public.users (full_name, email, password)
      VALUES ($1, $2, $3)
      RETURNING id, full_name, email, role, created_at
      `,
      [full_name, email, hashedPassword]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === "23505") {
      return res.status(400).json({ message: "Email already exists" });
    }
    console.error(err);
    res.status(500).json({ message: "Registration failed" });
  }
};

/**
 * LOGIN
 */
const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pool.query(
      "SELECT * FROM public.users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
};

/**
 * GET CURRENT USER
 */
 const getMe = async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT id, full_name, email, role, is_verified, created_at
      FROM public.users
      WHERE id = $1
      `,
      [req.user.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch user" });
  }
};

/**
 * FORGOT PASSWORD
 */
const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    // check if user exists
    const userResult = await pool.query(
      "SELECT id FROM public.users WHERE email = $1",
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // store OTP in DB
    await pool.query(
      `
      UPDATE public.users
      SET otp_code = $1
      WHERE email = $2
      `,
      [otp, email]
    );

    // 🚨 TEMP: return OTP in response (replace with email later)
    res.json({
      message: "OTP generated",
      otp
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Forgot password failed" });
  }
};


/**
 * RESET PASSWORD
 */
const resetPassword = async (req, res) => {
  const { email, otp, new_password } = req.body;

  try {
    // find user with matching email + otp
    const result = await pool.query(
      `
      SELECT id
      FROM public.users
      WHERE email = $1 AND otp_code = $2
      `,
      [email, otp]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ message: "Invalid OTP or email" });
    }

    // hash new password
    const hashedPassword = await bcrypt.hash(new_password, 10);

    // update password + clear OTP
    await pool.query(
      `
      UPDATE public.users
      SET password = $1,
          otp_code = NULL
      WHERE email = $2
      `,
      [hashedPassword, email]
    );

    res.json({ message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Reset password failed" });
  }
};



module.exports = { registerUser, loginUser, getMe , forgotPassword,resetPassword};