const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const session = require("express-session");
const mongodbSession = require("connect-mongodb-session")(session);

const { userFormValidate, isEmailValidate } = require("./utils/formUtil");
const userModel = require("./models/userModel");
const isAuth = require("./middlewares/isAuth");
const todoDataValidation = require("./utils/todoUtil");
const todoModel = require("./models/todoModel");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

const mongostore = new mongodbSession({
  uri: process.env.MONGO_URI,
  collection: "sessions",
});

const PORT = process.env.PORT;

app.use(
  session({
    secret: process.env.SECRET_KEY,
    store: mongostore,
    resave: false,
    saveUninitialized: false,
  })
);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("Mongodb connected succesfully"))
  .catch((err) => console.log(err));

app.set("view engine", "ejs");

app.get("/registerform", (req, res) => {
  return res.render("registerPage");
});

app.post("/register", async (req, res) => {
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

    return res.redirect("loginform");
    // return res.status(201).json({
    //   message: "Register succesfull",
    //   data: userDB,
    // });
  } catch (error) {
    return res.status(500).json(error);
  }
});

app.get("/loginform", (req, res) => {
  return res.render("loginPage");
});

app.post("/login", async (req, res) => {
  console.log(req.body);
  const { loginId, password } = req.body;

  if (!loginId || !password)
    return res.status(400).json("user credentials missing");

  try {
    let userdb;
    if (isEmailValidate({ key: loginId })) {
      userdb = await userModel.findOne({ email: loginId });
    } else {
      userdb = await userModel.findOne({ username: loginId });
    }

    if (!userdb)
      return res.status(400).json("user doesn't exists! please register");

    const matchedPassword = await bcrypt.compare(password, userdb.password);
    if (!matchedPassword) return res.status(400).json("password incorrect");

    console.log(req.session);
    req.session.isAuth = true;
    req.session.user = {
      userId: userdb._id,
      email: userdb.email,
      username: userdb.username,
    };

    if (matchedPassword) return res.redirect("dashboard");
  } catch (error) {
    return res.status(400).json(error);
  }
});

app.get("/dashboard", isAuth, (req, res) => {
  console.log(req.session);
  return res.render("dashboard");
});

app.post("/logout", isAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json("logout unsuccesfull");

    return res.redirect("dashboard");
  });
});

app.post("/logoutall", isAuth, async (req, res) => {
  const username = req.session.user.username;

  const userSchema = new mongoose.Schema({ _id: String }, { strict: false });
  const userModel = mongoose.model("session", userSchema);

  try {
    const deleteDB = await userModel.deleteMany({
      "session.user.username": username,
    });

    console.log(deleteDB);
    return res.status(200).json("logoutall succesfull");
  } catch (error) {
    return res.status(500).json(error);
  }
});

app.post("/create-item", isAuth, async (req, res) => {
  console.log(req.body);
  const username = req.session.user.username;
  const todo = req.body.todo;

  try {
    await todoDataValidation({ todo });
  } catch (error) {
    return res.send({
      status: 400,
      message: error,
    });
  }

  try {
    const todoObj = new todoModel({
      todo,
      username,
    });

    const todoDB = await todoObj.save();

    return res.send({
      status: 201,
      message: "todo created succesfully",
      data: todoDB,
    });
  } catch (error) {
    return res.send({
      status: 500,
      message: "Internal server error",
      error: error,
    });
  }
});

app.get("/read-item", isAuth, async (req, res) => {
  const username = req.session.user.username;
  const SKIP = Number(req.query.skip) || 0;

  try {
    // const readData = await todoModel.find({ username: username });

    const readData = await todoModel.aggregate([
      {
        $match: { username: username },
      },
      {
        $skip: SKIP,
      },
      {
        $limit: 3,
      },
    ]);
    console.log(readData);

    if (readData.length === 0)
      return res.send({
        status: 204,
        message: "No Todos found",
      });

    return res.send({
      status: 200,
      messsage: "Read success",
      data: readData,
    });
  } catch (error) {
    return res.send({
      status: 500,
      message: "Internal server error",
      error: error,
    });
  }
});

app.post("/edit-item", isAuth, async (req, res) => {
  const { newData, todoId } = req.body;
  const username = req.session.user.username;
  console.log("newdata", newData + " todoid", todoId);

  if (!todoId)
    return res.send({
      status: 400,
      message: "Todo missing",
    });

  try {
    await todoDataValidation({ todo: newData });
  } catch (error) {
    return res.send({
      status: 400,
      message: error,
    });
  }

  try {
    const editDB = await todoModel.findOne({ _id: todoId });
    console.log(editDB);

    if (!editDB)
      return res.send({
        status: 400,
        message: "No todo found with _id",
      });

    console.log(username, editDB.username);

    if (username !== editDB.username)
      return res.send({
        status: 403,
        message: "not allowed to edit this todo",
      });

    const updatedTodo = await todoModel.findOneAndUpdate(
      { _id: todoId },
      { todo: newData },
      { new: true }
    );
    return res.send({
      status: 200,
      message: "todo updated succesfully",
      data: updatedTodo,
    });
  } catch (error) {
    return res.send({
      status: 400,
      message: error,
    });
  }
});

app.post("/delete-item", isAuth, async (req, res) => {
  const { todoId } = req.body;
  const username = req.session.user.username;
  console.log("todoid", todoId);

  if (!todoId)
    return res.send({
      status: 400,
      message: "Todo missing",
    });

  try {
    const deleteDB = await todoModel.findOne({ _id: todoId });
    console.log(deleteDB);
    console.log(username, deleteDB.username);

    if (!deleteDB)
      return res.send({
        status: 400,
        message: "no todo found",
      });

    if (username !== deleteDB.username)
      return res.send({
        status: 403,
        message: "not allowed to delete this todo",
      });

    const updatedTodo = await todoModel.findOneAndDelete({ _id: todoId });
    return res.send({
      status: 200,
      message: "todo deleted succesfully",
      data: updatedTodo,
    });
  } catch (error) {
    return res.send({
      status: 400,
      message: error,
    });
  }
});

app.listen(PORT, () => {
  console.log(`server is on http://localhost:${PORT}`);
});
