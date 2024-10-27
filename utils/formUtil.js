const isEmailValidate = ({ key }) => {
    const isEmail = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i.test(key);
    return isEmail;
  };
  
  const userFormValidate = ({ name, email, username, password }) => {
    return new Promise((resolve, reject) => {
      if (!name || !email || !username || !password) reject("user data missing");
  
      if (typeof name !== "string") reject("name is not text");
      if (typeof email !== "string") reject("email is not text");
      if (typeof username !== "string") reject("username is not text");
      if (typeof password !== "string") reject("password is not text");
  
      if (username.length < 3 || username.length > 30)
        reject("username is exceeded");
  
      if (!isEmailValidate({ key: email })) reject("email format is incorrect");
  
      resolve();
    });
  };
  module.exports = { userFormValidate, isEmailValidate }