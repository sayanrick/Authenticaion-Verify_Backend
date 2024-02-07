const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const userModel = require("../Models/userModel");
const crypto = require("crypto");
const { sendVerificationMail } = require("../utils/sendVerificationMail");

const createToken = (_id) => {
  const jwtSecretKey = process.env.JWT_SECRET_KEY;

  return jwt.sign({ _id }, jwtSecretKey, { expiresIn: "3d" });
};

const registerUser = async (req, res) => {
  const { name, email, password } = req.body;

  try {
    let user = await userModel.findOne({ email });
    if (user) return res.status(400).json("User already exists...");

    user = new userModel({
      name,
      email,
      password,
      emailToken: crypto.randomBytes(54).toString("hex"),
    });

    if (!name || !email || !password)
      return res.status(400).json("All fields are required...");

    if (!validator.isEmail(email))
      return res.status(400).json("Email must be a valid email...");

    if (!validator.isStrongPassword(password))
      return res.status(400).json("Password must be a strong password..");

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(user.password, salt);

    await user.save();

    sendVerificationMail(user);

    const token = createToken(user._id);

    res.status(200).json({ _id: user._id, name, email, token });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    let user = await userModel.findOne({ email });

    if (!user) return res.status(400).json("Invalid email or password...");

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword)
      return res.status(400).json("Invalid email or password...");

    const token = createToken(user._id);

    res.status(200).json({ _id: user._id, name: user.name, email, token });
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
};

const findUser = async (req, res) => {
  const userId = req.params.userId;

  try {
    const user = await userModel.findById(userId);

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json(error);
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await userModel.find();

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json(error);
  }
};

const verifyEmail = async (req, res) => {
  try {
    const emailToken = req.body.emailToken;

    if (!emailToken) return res.status(404).json("Email token not found..");

    const user = await userModel.findOne({ emailToken });

    if (user) {
      user.emailToken = null;
      user.isVerified = true;

      await user.save();

      const token = createToken(user._id);

      res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token,
        isVerified: user?.isVerified,
      });
    } else {
      res.status(404).json("Email verification failed! Invalid Token!");
    }
  } catch (error) {
    res.status(500).json(error.message);
  }
};

module.exports = { registerUser, loginUser, findUser, getUsers, verifyEmail };
