const { Router } = require("express");
const { registerUser, loginUser, getMe,forgotPassword,resetPassword } = require("../controllers/users/user.controller.js");
const { authenticate } = require("../middleware/auth.middleware.js");

const router = Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.get("/me", authenticate, getMe);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = { userRouter: router };
