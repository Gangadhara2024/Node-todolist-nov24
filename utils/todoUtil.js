const todoDataValidation = ({ todo }) => {
  return new Promise((resolve, reject) => {
    if (!todo) return reject("todo is missing");

    if (typeof todo !== "string") return reject("todo is not text");
    if (todo.length < 3 || todo.length > 100)
      return reject("todolength exceeded");

    resolve();
  });
};
module.exports = todoDataValidation;
