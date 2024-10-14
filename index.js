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

//endpoint to get a student by its id
app.get(
  "/student/:student_id",
  middlewares.isAdminOrProfessorOrStudent,
  controllers.getStudentByIdHandler
);

//endpoint to get all students for admin only
app.get("/students", middlewares.isAdmin, controllers.getAllStudentsHandler);

//endpoint to get all students for professors (return all students enrolled in professor's courses)
app.get(
  "/professorstudents",
  middlewares.isAdminOrProfessor,
  controllers.getAllProfessorStudentsHandler
);

//endpoint to store a student
app.post(
  "/enrollstudent",
  middlewares.isAdmin,
  controllers.enrollStudentToCourseHandler
);

//endpoint to delete a student in base of its id
app.delete(
  "/student/:student_id",
  middlewares.isAdmin,
  controllers.deleteStudentByIdHandler
);

//endpoint to store a professor
app.post("/professor", middlewares.isAdmin, controllers.newProfessorHandler);

//endpoint to get a professor by its id
app.get(
  "/professor/:professor_id",
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
  "/professor/:professor_id",
  middlewares.isAdmin,
  controllers.deleteProfessorByIdHandler
);

//endpoint to store a course
app.post("/course", middlewares.isAdmin, controllers.newCourseHandler);

//endpoint to get a course by its id
app.get(
  "/course/:course_id",
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
  "/course/:course_id",
  middlewares.isAdmin,
  controllers.deleteCourseByIdHandler
);

//endpoint to assign a professor to a specific course
app.put(
  "/assignprofessor",
  middlewares.isAdmin,
  controllers.assignProfessorToCourseHandler
);

//endpoint to let a professor to assign a new valuation to a student
app.put(
  "/assignstudentresult",
  middlewares.isAdminOrProfessor,
  controllers.assignStudentResultHandler
);

//endpoint to let a student to get the list of its results
app.get(
  "/getstudentresults/:student_id",
  middlewares.isAdminOrProfessorOrStudent,
  controllers.getStudentResultsHandler
);

// Activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
