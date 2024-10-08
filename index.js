"use strict";

const express = require("express");
const security = require("./src/security/security");
const controllers = require("./src/controllers/controllers");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const session = require("express-session");
const middlewares = require("./src/middlewares/middlewares");
passport.use(new LocalStrategy(security.LoginUser));

passport.serializeUser((user, done) => {
  done(null, user.username);
});
passport.deserializeUser(security.DeserializeUser);

const app = express();
const port = 3001;
app.use(express.json());

app.use(
  session({
    secret: "difojsdjndhirheish",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// ------------ ENDPOINTS ------------

//endpoint to handle login
app.post("/login", controllers.loginHandler);
//endpoint to store a student
app.post("/student", middlewares.isAdmin, controllers.newStudentHandler);

// Activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
