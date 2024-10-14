"use strict";
const passport = require("passport");
const dao = require("../database/dao");
const utils = require("../utils/utils");

exports.loginHandler = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json(info);
    }
    req.login(user, (err) => {
      if (err) return next(err);

      return res.json(req.user);
    });
  })(req, res, next);
};

exports.newStudentHandler = async (req, res) => {
  try {
    const stud = req.body;
    if (!stud.student_id) {
      return res.status(400).send("Error - student_id is a mandatory field");
    }
    if (!stud.name) {
      return res.status(400).send("Error - name is a mandatory field");
    }
    if (!stud.surname) {
      return res.status(400).send("Error - surname is a mandatory field");
    }
    if (stud.birth_date) {
      if (!utils.isValidDateFormat(stud.birth_date)) {
        return res
          .status(400)
          .send("Invalid birth_date format, must be YYYY-MM-DD");
      }
    }

    const found = await dao.isStudentRegistered(stud.student_id);
    if (found) {
      return res
        .status(409)
        .send(`Error - student with id ${stud.student_id} already exists`);
    }

    await dao.createStudent(stud);
    res.status(201).json(stud);
  } catch (err) {
    res.status(500).send(`Error - ${err.message}`);
  }
};
