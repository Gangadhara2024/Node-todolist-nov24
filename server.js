const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const { userFormValidate, isEmailValidate } = require("./utils/formUtil");
const userModel = require("./models/userModel");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Mongodb connected succesfully"))
  .catch((err) => console.log(err));

app.set("view engine", "ejs");

app.get("/registerform", (req, res) => {
  return res.render("registerPage");
});

app.post("/registerform", async (req, res) => {
  console.log(req.body);

  const { name, email, username, password } = req.body;

  try {
    await userFormValidate({ name, email, username, password });
  } catch (error) {
    return res.status(400).json(error);
  }

  try {
    const userEmailExists = await userModel.findOne({ email: email });
    if (userEmailExists) return res.status(400).json("email already exists");

    const usernameExists = await userModel.findOne({ username: username });
    if (usernameExists) return res.status(400).json("username already exists");

    const HashedPassword = await bcrypt.hash(
      password,
      Number(process.env.SALT)
    );

    const userObj = new userModel({
      name: name,
      email: email,
      username: username,
      password: HashedPassword,
    });
    const userDB = await userObj.save();

    return res.status(201).json({
      message: "Register succesfull",
      data: userDB,
    });
  } catch (error) {
    return res.status(500).json(error);
  }
});

app.get("/loginform", (req, res) => {
  return res.render("loginPage");
});

app.post("/loginform", async (req, res) => {
  console.log(req.body);
  const { loginId, password } = req.body;

  if (!loginId || !password)
    return res.status(400).json("user credentials missing");

  return res.send("all ok");
});
