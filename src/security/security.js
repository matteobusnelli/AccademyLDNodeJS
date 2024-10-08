"use strict";
const jwt = require("jsonwebtoken");
const dao = require("../database/dao");
const crypto = require("crypto");

const secretKey = "random-secret-key";
exports.CreateToken = (username, userType) => {
  return new Promise((resolve, reject) => {
    const token = jwt.sign(
      {
        username: username,
        type: userType,
        exp: Math.floor(Date.now() / 1000) + 24 * 60 * 60,
      },
      secretKey
    );
    resolve(token);
  });
};
exports.verifyToken = (tokenString) => {
  return new Promise((resolve, reject) => {
    jwt.verify(tokenString, secretKey, (err, decoded) => {
      if (err) {
        return reject(new Error("Invalid token"));
      }
      const userType = decoded.type;
      resolve(userType);
    });
  });
};
exports.LoginUser = (username, password, done) => {
  dao.FetchUserFromDB(username, password).then((user) => {
    if (!user) {
      return done(null, false, {
        error: "User not found.",
      });
    }
    const salt = user.salt;
    const saltedPassword = password + salt;
    const hash = crypto
      .createHash("sha256")
      .update(saltedPassword)
      .digest("hex");

    if (hash !== user.hashpassword)
      return done(null, false, {
        error: "Incorrect username and/or password.",
      });

    this.CreateToken(user.username, user.type)
      .then((token) => {
        return done(null, {
          username: user.username,
          type: user.type,
          token,
        });
      })
      .catch((err) => {
        console.error(err);
        return done(err);
      });
  });
};

exports.DeserializeUser = (id, done) => {
  dao
    .FetchUserFromDB(id)
    .then((user) => {
      done(null, user);
    })
    .catch((err) => {
      done(err, null);
    });
};
