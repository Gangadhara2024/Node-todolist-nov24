const mongoose = require("mongoose");

const todoSchema = new mongoose.Schema(
  {
    todo: {
      type: String,
      required: true,
      trim: true,
      minLength: 3,
      maxLength: 100,
    },

    username: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);
const todoModel = mongoose.model("todo", todoSchema);
module.exports = todoModel;
