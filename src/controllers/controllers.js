"use strict";
const passport = require("passport");
const dao = require("../database/dao");
const utils = require("../utils/utils");
const security = require("../security/security");

exports.registrationHandler = async (req, res) => {
  const validationErrors = utils.handleValidationErrors(req, res);
  if (validationErrors) return;
  
  const { username, password, type } = req.body;

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
  const validationErrors = utils.handleValidationErrors(req, res);
  if (validationErrors) return;
  
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
  const validationErrors = utils.handleValidationErrors(req, res);
  if (validationErrors) return;

  try {
    const stud = req.body;

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
  const validationErrors = utils.handleValidationErrors(req, res);
  if (validationErrors) return;
  
  try {
    const tokenString = req.headers.authorization.split("Bearer ")[1]; // Already checked by middleware
    const userType = await security.verifyToken(tokenString); // Already checked by middleware
    const studentId = req.params.student_id;

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
  const validationErrors = utils.handleValidationErrors(req, res);
  if (validationErrors) return;
  
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = parseInt(req.query.offset, 10) || 0;

    const students = await dao.fetchStudents(limit, offset);
    res.status(200).json(students);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve student" });
  }
};
exports.getAllProfessorStudentsHandler = async (req, res) => {
  const validationErrors = utils.handleValidationErrors(req, res);
  if (validationErrors) return;
  
  try {
    const { professor_id } = req.params;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = parseInt(req.query.offset, 10) || 0;

    if (!professor_id) {
      return res.status(400).json({ error: "professor_id is required" });
    }

    const students = await dao.fetchProfessorStudents(professor_id, limit, offset);

    res.status(200).json(students);
  } catch (err) {
    console.error("Error retrieving students:", err);
    res.status(500).json({ error: "Failed to retrieve students" });
  }
};
exports.enrollStudentToCourseHandler = async (req, res) => {
  const validationErrors = utils.handleValidationErrors(req, res);
  if (validationErrors) return;
  
  try {
    const { student_id, course_id } = req.params;

    const isStudentRegistered = await dao.isStudentRegistered(student_id);
    if (!isStudentRegistered) {
      return res.status(404).json({
        error: `Error - student with id ${student_id} not found`,
      });
    }

    const isCourseRegistered = await dao.isCourseRegistered(course_id);
    if (!isCourseRegistered) {
      return res.status(404).json({
        error: `Error - course with id ${course_id} not found`,
      });
    }

    const isEnrolled = await dao.isStudentEnrolledToCourse(student_id, course_id);
    if (isEnrolled) {
      return res.status(409).json({
        error: `Error - student ${student_id} is already enrolled in course ${course_id}`,
      });
    }

    await dao.enrollStudentToCourse({ student_id, course_id });
    res.status(201).json({
      message: `Student ${student_id} successfully enrolled in course ${course_id}`,
    });
  } catch (err) {
    console.error("Error enrolling student to course:", err);
    res.status(500).json({ error: `Failed to enroll student: ${err.message}` });
  }
};

exports.deleteStudentByIdHandler = async (req, res) => {
  const validationErrors = utils.handleValidationErrors(req, res);
  if (validationErrors) return;
  
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
  const validationErrors = utils.handleValidationErrors(req, res);
  if (validationErrors) return;
  
  try {
    const prof = req.body;

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
  const validationErrors = utils.handleValidationErrors(req, res);
  if (validationErrors) return;
  
  try {
    const tokenString = req.headers.authorization.split("Bearer ")[1]; // Already checked by middleware
    const userType = await security.verifyToken(tokenString); // Already checked by middleware
    const professorId = req.params.professor_id;

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
  const validationErrors = utils.handleValidationErrors(req, res);
  if (validationErrors) return;
  
  const limit = parseInt(req.query.limit, 10) || 10;
  const offset = parseInt(req.query.offset, 10) || 0;

  try {
    const professors = await dao.fetchProfessors(limit, offset);
    res.status(200).json(professors);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve professors" });
  }
};
exports.deleteProfessorByIdHandler = async (req, res) => {
  const validationErrors = utils.handleValidationErrors(req, res);
  if (validationErrors) return;
  
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
  const validationErrors = utils.handleValidationErrors(req, res);
  if (validationErrors) return;
  
  try {
    const course = req.body;

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
  const validationErrors = utils.handleValidationErrors(req, res);
  if (validationErrors) return;
  
  try {
    const courseId = req.params.course_id;
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
  const validationErrors = utils.handleValidationErrors(req, res);
  if (validationErrors) return;
  
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = parseInt(req.query.offset, 10) || 0;
    const courses = await dao.fetchCourses(limit, offset);
    res.status(200).json(courses);
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve courses" });
  }
};
exports.deleteCourseByIdHandler = async (req, res) => {
  const validationErrors = utils.handleValidationErrors(req, res);
  if (validationErrors) return;
  
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
  const validationErrors = utils.handleValidationErrors(req, res);
  if (validationErrors) return;
  
  try {
    const { professor_id, course_id } = req.params;

    const isCourseRegistered = await dao.isCourseRegistered(course_id);
    if (!isCourseRegistered) {
      return res
        .status(404)
        .json({ error: `Error - course with id ${course_id} not found` });
    }

    const isProfessorRegistered = await dao.isProfessorRegistered(professor_id);
    if (!isProfessorRegistered) {
      return res.status(404).json({
        error: `Error - professor with id ${professor_id} not found`,
      });
    }

    await dao.assignProfessorToCourse({ professor_id, course_id });

    res.status(200).json({
      message: `Professor ${professor_id} assigned to course ${course_id} successfully`,
    });
  } catch (err) {
    console.error("Error assigning professor to course:", err);
    res
      .status(500)
      .json({ error: `Failed to assign professor: ${err.message}` });
  }
};
exports.assignStudentResultHandler = async (req, res) => {
  const validationErrors = utils.handleValidationErrors(req, res);
  if (validationErrors) return;
  
  try {
    const { student_id, course_id } = req.params; 
    const { result } = req.body;

    const isCourseRegistered = await dao.isCourseRegistered(course_id);
    if (!isCourseRegistered) {
      return res
        .status(404)
        .json({ error: `Error - course with id ${course_id} not found` });
    }

    const isStudentRegistered = await dao.isStudentRegistered(student_id);
    if (!isStudentRegistered) {
      return res
        .status(404)
        .json({ error: `Error - student with id ${student_id} not found` });
    }

    const tokenString = req.headers["authorization"].replace("Bearer ", "");
    const userType = await security.verifyToken(tokenString);
    if (userType === "professor") {
      const professorId = await security.getIdFromToken(tokenString);
      const isAuthorized = await dao.checkStudEnrolledInProfCourse(
        student_id,
        professorId,
        course_id
      );
      if (!isAuthorized) {
        return res.status(401).json({
          error: `You are not allowed to assign a valuation to the course ${course_id}. You are not the teacher assigned or the student ${student_id} is not enrolled.`,
        });
      }
    }

    await dao.assignResultToStudent({ student_id, course_id, result });

    res.status(200).json({
      message: `Valuation of ${result} assigned to student ${student_id} of course ${course_id}`,
    });
  } catch (err) {
    console.error("Error assigning result:", err);
    res
      .status(500)
      .json({ error: `Failed to assign result: ${err.message}` });
  }
};
exports.getStudentResultsHandler = async (req, res) => {
  const validationErrors = utils.handleValidationErrors(req, res);
  if (validationErrors) return;
  
  const tokenString = req.headers.authorization.split("Bearer ")[1]; // Already checked by middleware
  const userType = await security.verifyToken(tokenString); // Already checked by middleware
  const studentId = req.params.student_id;

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
  const validationErrors = utils.handleValidationErrors(req, res);
  if (validationErrors) return;
  
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = parseInt(req.query.offset, 10) || 0;
    const studentStatistics = await dao.getStudentStatistics(limit, offset);
    res.header("Content-Type", "application/json");
    res.json(studentStatistics);
  } catch (err) {
    console.error("Failed to retrieve all students statistics:", err);
    return res
      .status(500)
      .json({ error: "Failed to retrieve all students statistics" });
  }
};
exports.getCourseBestStudentsHandler = async (req, res) => {
  const validationErrors = utils.handleValidationErrors(req, res);
  if (validationErrors) return;
  
  const tokenString = req.headers.authorization.split("Bearer ")[1]; // Already checked by middleware
  const userType = await security.verifyToken(tokenString); // Already checked by middleware
  const courseId = req.params.course_id;

  const isCourseRegistered = await dao.isCourseRegistered(courseId);
  if (!isCourseRegistered) {
    return res.status(404).json({
      error: `Error - course with id ${courseId} not found`,
    });
  }

  if (userType === "professor") {
    let professorId;
    try {
      professorId = await security.getIdFromToken(tokenString);
    } catch (err) {
      return res.status(500).json({ error: "Failed to extract professor id" });
    }
    let ok;
    try {
      ok = await dao.checkIsProfessorCourse(professorId, courseId);
    } catch (err) {
      return res.status(500).json({
        error: `Failed to check professor course: ${err.message}`,
      });
    }
    if (!ok) {
      return res.status(401).json({
        error: `You're not allowed to read statistics of other courses.`,
      });
    }
  }

  try {
    const studentResults = await dao.getCourseBestStudents(courseId);
    res.header("Content-Type", "application/json");
    res.json(studentResults);
  } catch (err) {
    console.error("Failed to retrieve all student results:", err);
    return res
      .status(500)
      .json({ error: "Failed to retrieve all student results" });
  }
};
