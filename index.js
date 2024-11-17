"use strict";

const express = require("express");
require("dotenv").config();
const { body, param, query, validationResult } = require("express-validator");
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
const port = process.env.SERVER_PORT;
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

//endpoint to register a new user
app.post(
  "/register",
  [
    body("username").isString().notEmpty().withMessage("Username is required"),
    body("password").isString().notEmpty().withMessage("Password is required"),
    body("type")
      .isIn(["student", "professor"])
      .withMessage("Type must be 'student' or 'professor'"),
  ],
  middlewares.isAdmin,
  controllers.registrationHandler
);

//endpoint to handle login
app.post(
  "/login",
  [
    body("username").isString().notEmpty().withMessage("Username is required"),
    body("password").isString().notEmpty().withMessage("Password is required"),
  ],
  controllers.loginHandler
);

//endpoint to store a student
app.post(
  "/students",
  [
    body("student_id")
      .matches(/^S[0-9]+$/)
      .withMessage("Invalid student_id format"),
    body("name")
      .isString()
      .isLength({ min: 1 })
      .withMessage("Name is required"),
    body("surname")
      .isString()
      .isLength({ min: 1 })
      .withMessage("Surname is required"),
    body("birth_date")
      .optional()
      .isISO8601()
      .withMessage("Invalid date format, must be YYYY-MM-DD"),
  ],
  controllers.newStudentHandler
);


//endpoint to get a student by its id
app.get(
  "/students/:student_id(S[0-9]+)",
  [
    param("student_id")
      .matches(/^S[0-9]+$/)
      .withMessage("Invalid student_id format"),
  ],
  controllers.getStudentByIdHandler
);


//endpoint to get all students for admin only
app.get(
  "/students",
  [
    query("limit")
      .optional()
      .isInt({ gt: 0 })
      .withMessage("Limit must be a positive integer"),
    query("offset")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Offset must be a non-negative integer"),
  ],
  controllers.getAllStudentsHandler
);

//endpoint to get all students for professors (return all students enrolled in professor's courses)
app.get(
  "/professors/:professor_id/students",
  [
    param("professor_id")
      .matches(/^P[0-9]+$/)
      .withMessage("Invalid professor_id format"),
    query("limit")
      .optional()
      .isInt({ gt: 0 })
      .withMessage("Limit must be a positive integer"),
    query("offset")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Offset must be a non-negative integer"),
  ],
  middlewares.isAdminOrProfessor,
  controllers.getAllProfessorStudentsHandler
);

//endpoint to store a student
app.post(
  "/students/:student_id/courses/:course_id",
  [
    param("student_id")
      .matches(/^S[0-9]+$/)
      .withMessage("Invalid student_id format"),
    param("course_id")
    .matches(/^C[0-9]+$/)
      .withMessage("Invalid course_id format"),
  ],
  controllers.enrollStudentToCourseHandler
);

//endpoint to delete a student in base of its id
app.delete(
  "/students/:student_id",
  [
    param("student_id")
      .matches(/^S[0-9]+$/)
      .withMessage("Invalid student_id format"),
  ],
  middlewares.isAdmin,
  controllers.deleteStudentByIdHandler
);


//endpoint to store a professor
app.post(
  "/professors",
  [
    body("professor_id")
      .matches(/^P[0-9]+$/)
      .withMessage("Invalid professor_id format"),
    body("name").isString().notEmpty().withMessage("Name is required"),
    body("surname").isString().notEmpty().withMessage("Surname is required"),
    body("salary")
      .optional()
      .isFloat({ gt: 0 })
      .withMessage("Salary must be a positive value"),
    body("hire_date")
      .optional()
      .isISO8601()
      .withMessage("Invalid date format, must be YYYY-MM-DD"),
  ],
  middlewares.isAdmin,
  controllers.newProfessorHandler
);


//endpoint to get a professor by its id
app.get(
  "/professors/:professor_id",
  [
    param("professor_id")
      .matches(/^P[0-9]+$/)
      .withMessage("Invalid professor_id format"),
  ],
  middlewares.isAdminOrProfessor,
  controllers.getProfessorByIdHandler
);


//endpoint to get all professors
app.get(
  "/professors",
  middlewares.isAdmin,
  controllers.getAllProfessorsHandler
);

//endpoint to delete a professor in base of its id
app.delete(
  "/professors/:professor_id",
  [
    param("professor_id")
      .matches(/^P[0-9]+$/)
      .withMessage("Invalid professor_id format"),
  ],
  middlewares.isAdmin,
  controllers.deleteProfessorByIdHandler
);


//endpoint to store a course
app.post(
  "/courses",
  [
    body("course_id")
      .matches(/^C[0-9]+$/)
      .withMessage("Invalid course_id format"),
    body("name").isString().notEmpty().withMessage("Name is required"),
  ],
  middlewares.isAdmin,
  controllers.newCourseHandler
);


//endpoint to get a course by its id
app.get(
  "/courses/:course_id",
  [
    param("course_id")
      .matches(/^C[0-9]+$/)
      .withMessage("Invalid course_id format"),
  ],
  middlewares.isAdminOrProfessorOrStudent,
  controllers.getCourseByIdHandler
);


//endpoint to get all courses
app.get(
  "/courses",
  middlewares.isAdminOrProfessorOrStudent,
  controllers.getAllCoursesHandler
);

//endpoint to delete a course in base of its id
app.delete(
  "/courses/:course_id",
  [
    param("course_id")
      .matches(/^C[0-9]+$/)
      .withMessage("Invalid course_id format"),
  ],
  middlewares.isAdmin,
  controllers.deleteCourseByIdHandler
);


//endpoint to assign a professor to a specific course
app.patch(
  "/professors/:professor_id/courses/:course_id",
  [
    param("professor_id")
      .matches(/^P[0-9]+$/)
      .withMessage("Invalid professor_id format"),
    param("course_id")
    .matches(/^C[0-9]+$/)
      .withMessage("Invalid course_id format"),
  ],
  middlewares.isAdmin,
  controllers.assignProfessorToCourseHandler
);

//endpoint to let a professor to assign a new valuation to a student
app.patch(
  "/students/:student_id/courses/:course_id/results",
  [
    param("student_id")
      .matches(/^S[0-9]+$/)
      .withMessage("Invalid student_id format"),
    param("course_id")
    .matches(/^C[0-9]+$/)
      .withMessage("Invalid course_id format"),
    body("result")
      .isInt({ min: 0, max: 30 })
      .withMessage("Result must be an integer between 0 and 30"),
  ],
  middlewares.isAdminOrProfessor,
  controllers.assignStudentResultHandler
);

//endpoint to let a student to get the list of its results
app.get(
  "/students/:student_id/courses/results",
  [
    param("student_id")
      .matches(/^S[0-9]+$/)
      .withMessage("Invalid student_id format"),
  ],
  middlewares.isAdminOrProfessorOrStudent,
  controllers.getStudentResultsHandler
);


//endpoint to get all students' statistics
app.get(
  "/students/statistics",
  [
    query("limit")
      .optional()
      .isInt({ gt: 0 })
      .withMessage("Limit must be a positive integer"),
    query("offset")
      .optional()
      .isInt({ min: 0 })
      .withMessage("Offset must be a non-negative integer"),
  ],
  middlewares.isAdminOrProfessor,
  controllers.getStudentStatisticsHandler
);

//endpoint to get students rank of a course
app.get(
  "/courses/:course_id/rank",
  [
    param("course_id")
      .matches(/^C[0-9]+$/)
      .withMessage("Invalid course_id format"),
  ],
  middlewares.isAdminOrProfessor,
  controllers.getCourseBestStudentsHandler
);

// Activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
