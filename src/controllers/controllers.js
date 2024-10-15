"use strict";
const passport = require("passport");
const dao = require("../database/dao");
const utils = require("../utils/utils");
const security = require("../security/security");

exports.registrationHandler = async (req, res) => {
  const { username, password, type } = req.body;

  if (!username || !password || !type) {
    return res.status(400).json({ error: "Invalid user format provided" });
  }

  try {
    const existingUser = await dao.fetchUserFromDB(username);
    if (existingUser) {
      return res
        .status(409)
        .json({ error: `Error - user ${username} already exists` });
    }
  } catch (err) {
    return res.status(500).json({ error: "Failed to check user existence" });
  }

  if (type !== "student" && type !== "professor") {
    return res.status(400).json({ error: "Invalid user type provided" });
  }

  const salt = security.generateSalt();
  const hashedPassword = security.hashPassword(password, salt);

  try {
    await dao.insertUserIntoDB(username, hashedPassword, salt, type);

    const response = {
      username,
      type,
    };

    res.status(201).json(response);
  } catch (err) {
    return res.status(500).json({ error: "Failed to register user" });
  }
};

exports.loginHandler = (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(info.status).json({ error: info.error });
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
      return res
        .status(400)
        .json({ error: "Error - student_id is a mandatory field" });
    }
    if (!stud.name) {
      return res
        .status(400)
        .json({ error: "Error - name is a mandatory field" });
    }
    if (!stud.surname) {
      return res
        .status(400)
        .json({ error: "Error - surname is a mandatory field" });
    }
    if (stud.birth_date) {
      if (!utils.isValidDateFormat(stud.birth_date)) {
        return res
          .status(400)
          .json({ error: "Invalid birth_date format, must be YYYY-MM-DD" });
      }
    }

    const found = await dao.isStudentRegistered(stud.student_id);
    if (found) {
      return res.status(409).json({
        error: `Error - student with id ${stud.student_id} already exists`,
      });
    }

    await dao.createStudent(stud);
    res.status(201).json(stud);
  } catch (err) {
    res.status(500).json({ error: `Error - ${err.message}` });
  }
};
exports.getStudentByIdHandler = async (req, res) => {
  try {
    const tokenString = req.headers.authorization.split("Bearer ")[1]; // Already checked by middleware
    const userType = await security.verifyToken(tokenString); // Already checked by middleware
    const studentId = req.params.student_id;
    if (!studentId) {
      return res
        .status(400)
        .json({ error: "Error - student_id is a mandatory field" });
    }
    if (userType === "student") {
      const studentIdToken = await security.getIdFromToken(tokenString);
      if (!studentIdToken) {
        return res.status(500).json({ error: "Failed to extract student ID" });
      }
      if (studentId != studentIdToken) {
        return res
          .status(401)
          .json({ error: "You cannot read another student's data" });
      }
    }
    const student = await dao.getStudentById(studentId);
    if (!student) {
      return res
        .status(404)
        .json({ error: `Error - student with id ${studentId} does not exist` });
    }

    res.status(200).json(student);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve student" });
  }
};
exports.getAllStudentsHandler = async (req, res) => {
  try {
    const students = await dao.fetchStudents();
    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve student" });
  }
};
exports.getAllProfessorStudentsHandler = async (req, res) => {
  try {
    const tokenString = req.headers.authorization.split("Bearer ")[1]; // Already checked by middleware
    const userType = await security.verifyToken(tokenString); // Already checked by middleware

    let students;
    if (userType === "professor") {
      const professorId = await security.getIdFromToken(tokenString);
      if (!professorId) {
        return res
          .status(500)
          .json({ error: "Failed to extract professor ID" });
      }
      students = await dao.fetchProfessorStudents(professorId);
    } else {
      students = await dao.fetchStudents();
    }

    res.status(200).json(students);
  } catch (err) {
    console.error("Error retrieving students:", err);
    res.status(500).json({ error: "Failed to retrieve students" });
  }
};
exports.enrollStudentToCourseHandler = async (req, res) => {
  try {
    const studCour = req.body;

    if (!studCour.student_id) {
      return res
        .status(400)
        .json({ error: "Error - student_id is a mandatory field" });
    }
    if (!studCour.course_id) {
      return res
        .status(400)
        .json({ error: "Error - course_id is a mandatory field" });
    }

    const isStudentRegistered = await dao.isStudentRegistered(
      studCour.student_id
    );
    if (!isStudentRegistered) {
      return res.status(404).json({
        error: `Error - student with id ${studCour.student_id} not found`,
      });
    }

    const isCourseRegistered = await dao.isCourseRegistered(studCour.course_id);
    if (!isCourseRegistered) {
      return res.status(404).json({
        error: `Error - course with id ${studCour.course_id} not found`,
      });
    }

    const isEnrolled = await dao.isStudentEnrolledToCourse(
      studCour.student_id,
      studCour.course_id
    );
    if (isEnrolled) {
      return res.status(409).json({
        error: `Error - student ${studCour.student_id} is already enrolled in course ${studCour.course_id}`,
      });
    }

    await dao.enrollStudentToCourse(studCour);
    res.status(201).json({
      message: `Student ${studCour.student_id} successfully enrolled in course ${studCour.course_id}`,
    });
  } catch (err) {
    console.error("Error enrolling student to course:", err);
    res.status(500).json({ error: `Failed to enroll student: ${err.message}` });
  }
};
exports.deleteStudentByIdHandler = async (req, res) => {
  const studentId = req.params.student_id;

  try {
    const found = await dao.isStudentRegistered(studentId);
    if (!found) {
      return res
        .status(404)
        .json({ error: `Error - student with id ${studentId} not found` });
    }
    await dao.deleteStudent(studentId);

    res
      .status(200)
      .json({ message: `Student with ID ${studentId} deleted successfully` });
  } catch (err) {
    console.error("Error deleting student:", err);
    res.status(500).json({ error: `Error - ${err.message}` });
  }
};
exports.newProfessorHandler = async (req, res) => {
  try {
    const prof = req.body;

    if (!prof.professor_id) {
      return res
        .status(400)
        .json({ error: "Error - professor_id is a mandatory field" });
    }
    if (!prof.name) {
      return res
        .status(400)
        .json({ error: "Error - name is a mandatory field" });
    }
    if (!prof.surname) {
      return res
        .status(400)
        .json({ error: "Error - surname is a mandatory field" });
    }
    if (prof.salary && prof.salary <= 0) {
      return res
        .status(400)
        .json({ error: "Error - salary must be a positive value" });
    }
    if (prof.hire_date) {
      if (!utils.isValidDateFormat(prof.hire_date)) {
        return res
          .status(400)
          .json({ error: "Invalid hire_date format, must be YYYY-MM-DD" });
      }
    }

    const found = await dao.isProfessorRegistered(prof.professor_id);
    if (found) {
      return res.status(409).json({
        error: `Error - professor with id ${prof.professor_id} already exists`,
      });
    }

    const createdProfessor = await dao.createProfessor(prof);
    res.header("Content-Type", "application/json");
    res.status(201).json(createdProfessor);
  } catch (err) {
    console.error("Error creating professor:", err);
    res
      .status(500)
      .json({ error: `Failed to insert professor: ${err.message}` });
  }
};
exports.getProfessorByIdHandler = async (req, res) => {
  try {
    const tokenString = req.headers.authorization.split("Bearer ")[1]; // Already checked by middleware
    const userType = await security.verifyToken(tokenString); // Already checked by middleware
    const professorId = req.params.professor_id;
    if (!professorId) {
      return res
        .status(400)
        .json({ error: "Error - professor_id is a mandatory field" });
    }
    if (userType === "professor") {
      const professorIdToken = await security.getIdFromToken(tokenString);
      if (!professorIdToken) {
        return res
          .status(500)
          .json({ error: "Failed to extract professor ID" });
      }
      if (professorId != professorIdToken) {
        return res
          .status(401)
          .json({ error: "You cannot read another professor's data" });
      }
    }
    const professor = await dao.getProfessorById(professorId);
    if (!professor) {
      return res.status(404).json({
        error: `Error - professor with id ${professorId} does not exist`,
      });
    }

    res.status(200).json(professor);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve professor" });
  }
};
exports.getAllProfessorsHandler = async (req, res) => {
  try {
    const professors = await dao.fetchProfessors();
    res.status(200).json(professors);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve professors" });
  }
};
exports.deleteProfessorByIdHandler = async (req, res) => {
  const professorId = req.params.professor_id;

  try {
    const found = await dao.isProfessorRegistered(professorId);
    if (!found) {
      return res
        .status(404)
        .json({ error: `Error - professor with id ${professorId} not found` });
    }
    await dao.deleteProfessor(professorId);

    res.status(200).json({
      message: `Professor with ID ${professorId} deleted successfully`,
    });
  } catch (err) {
    console.error("Error deleting professor:", err);
    res.status(500).json({ error: `Error - ${err.message}` });
  }
};
exports.newCourseHandler = async (req, res) => {
  try {
    const course = req.body;

    if (!course.course_id) {
      return res
        .status(400)
        .json({ error: "Error - course_id is a mandatory field" });
    }
    if (!course.name) {
      return res
        .status(400)
        .json({ error: "Error - name is a mandatory field" });
    }

    const found = await dao.isCourseRegistered(course.course_id);
    if (found) {
      return res.status(409).json({
        error: `Error - course with id ${course.course_id} already exists`,
      });
    }

    const createdCourse = await dao.createCourse(course);
    res.header("Content-Type", "application/json");
    res.status(201).json(createdCourse);
  } catch (err) {
    console.error("Error creating course:", err);
    res.status(500).json({ error: `Failed to insert course: ${err.message}` });
  }
};
exports.getCourseByIdHandler = async (req, res) => {
  try {
    const courseId = req.params.course_id;
    if (!courseId) {
      return res
        .status(400)
        .json({ error: "Error - course_id is a mandatory field" });
    }

    const course = await dao.getCourseById(courseId);
    if (!course) {
      return res
        .status(404)
        .json({ error: `Error - course with id ${courseId} does not exist` });
    }

    res.status(200).json(course);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve course" });
  }
};
exports.getAllCoursesHandler = async (req, res) => {
  try {
    const courses = await dao.fetchCourses();
    res.status(200).json(courses);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve courses" });
  }
};
exports.deleteCourseByIdHandler = async (req, res) => {
  const courseId = req.params.course_id;

  try {
    const found = await dao.isCourseRegistered(courseId);
    if (!found) {
      return res
        .status(404)
        .json({ error: `Error - course with id ${courseId} not found` });
    }
    await dao.deleteCourse(courseId);

    res
      .status(200)
      .json({ message: `Course with ID ${courseId} deleted successfully` });
  } catch (err) {
    console.error("Error deleting course:", err);
    res.status(500).json({ error: `Error - ${err.message}` });
  }
};
exports.assignProfessorToCourseHandler = async (req, res) => {
  let ass;

  try {
    ass = req.body;
  } catch (err) {
    return res
      .status(400)
      .json({ error: `Invalid request payload: ${err.message}` });
  }

  if (!ass.course_id) {
    return res
      .status(400)
      .json({ error: "Error - course_id is a mandatory field" });
  }
  if (!ass.professor_id) {
    return res
      .status(400)
      .json({ error: "Error - professor_id is a mandatory field" });
  }

  let found;
  try {
    found = await dao.isCourseRegistered(ass.course_id);
  } catch (err) {
    return res.status(500).json({ error: `Error - ${err.message}` });
  }
  if (!found) {
    return res
      .status(404)
      .json({ error: `Error - course with id ${ass.course_id} not found` });
  }

  // Check existing professor
  try {
    found = await dao.isProfessorRegistered(ass.professor_id);
  } catch (err) {
    return res.status(500).json({ error: `Error - ${err.message}` });
  }
  if (!found) {
    return res.status(404).json({
      error: `Error - professor with id ${ass.professor_id} not found`,
    });
  }

  // Assign professor to course
  try {
    await dao.assignProfessorToCourse(ass);
  } catch (err) {
    return res
      .status(500)
      .json({ error: `Failed to insert professor: ${err.message}` });
  }

  res.setHeader("Content-Type", "application/json");
  res.status(200).json({
    message: `Professor ${ass.professor_id} assigned to course ${ass.course_id} successfully`,
  });
};
exports.assignStudentResultHandler = async (req, res) => {
  const tokenString = req.headers["authorization"].replace("Bearer ", "");
  const userType = await security.verifyToken(tokenString);

  let ass;
  try {
    ass = req.body;
  } catch (err) {
    return res
      .status(400)
      .json({ error: `Invalid request payload: ${err.message}` });
  }

  if (!ass.course_id) {
    return res
      .status(400)
      .json({ error: "Error - course_id is a mandatory field" });
  }
  if (!ass.student_id) {
    return res
      .status(400)
      .json({ error: "Error - student_id is a mandatory field" });
  }
  if (!ass.result) {
    return res
      .status(400)
      .json({ error: "Error - result is a mandatory field" });
  }
  if (ass.result < 0 || ass.result > 30) {
    return res
      .status(400)
      .json({ error: "Error - result needs to be a value between 0 and 30" });
  }

  let found;
  try {
    found = await dao.isCourseRegistered(ass.course_id);
  } catch (err) {
    return res.status(500).json({ error: `Error - ${err.message}` });
  }
  if (!found) {
    return res
      .status(404)
      .json({ error: `Error - course with id ${ass.course_id} not found` });
  }

  try {
    found = await dao.isStudentRegistered(ass.student_id);
  } catch (err) {
    return res.status(500).json({ error: `Error - ${err.message}` });
  }
  if (!found) {
    return res
      .status(404)
      .json({ error: `Error - student with id ${ass.student_id} not found` });
  }

  // Check if the logged-in professor is trying to assign a valuation
  // to a student of one of HIS courses
  if (userType === "professor") {
    let professorId;
    try {
      professorId = await security.getIdFromToken(tokenString);
    } catch (err) {
      return res.status(500).json({ error: "Failed to extract professor id" });
    }
    let ok;
    try {
      ok = await dao.checkStudEnrolledInProfCourse(
        ass.student_id,
        professorId,
        ass.course_id
      );
    } catch (err) {
      return res.status(500).json({
        error: `Failed to retrieve courses for professor: ${err.message}`,
      });
    }
    if (!ok) {
      return res.status(401).json({
        error: `You are not allowed to assign a valuation to the course ${ass.course_id}. You are not the teacher assigned or the student ${ass.student_id} is not enrolled.`,
      });
    }
  }

  try {
    await dao.assignResultToStudent(ass);
  } catch (err) {
    return res
      .status(500)
      .json({ error: `Failed to insert result: ${err.message}` });
  }

  res.setHeader("Content-Type", "application/json");
  res.status(200).json({
    message: `Valuation of ${ass.result} assigned to student ${ass.student_id} of course ${ass.course_id}`,
  });
};
exports.getStudentResultsHandler = async (req, res) => {
  const tokenString = req.headers.authorization.split("Bearer ")[1]; // Already checked by middleware
  const userType = await security.verifyToken(tokenString); // Already checked by middleware
  const studentId = req.params.student_id;

  if (!studentId) {
    return res
      .status(400)
      .json({ error: "Error - student_id is a mandatory field" });
  }
  if (userType === "student") {
    const studentIdToken = await security.getIdFromToken(tokenString);
    if (!studentIdToken) {
      return res.status(500).json({ error: "Failed to extract student ID" });
    }
    if (studentId != studentIdToken) {
      return res
        .status(401)
        .json({ error: "You cannot read other students' results" });
    }
  }
  try {
    const studentResults = await dao.getStudentResults(studentId);
    res.header("Content-Type", "application/json");
    res.json(studentResults);
  } catch (err) {
    console.error("Failed to retrieve all student results:", err);
    return res
      .status(500)
      .json({ error: "Failed to retrieve all student results" });
  }
};
exports.getStudentStatisticsHandler = async (req, res) => {
  try {
    const studentStatistics = await dao.getStudentStatistics();
    res.header("Content-Type", "application/json");
    res.json(studentStatistics);
  } catch (err) {
    console.error("Failed to retrieve all students statistics:", err);
    return res
      .status(500)
      .json({ error: "Failed to retrieve all students statistics" });
  }
};
