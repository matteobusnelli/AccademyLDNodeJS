"use strict";
const db = require("./postgres");

exports.insertUserIntoDB = async (username, hashedPassword, salt, userType) => {
  const query = `
    insert into users (username, hashpassword, salt, type)
    values ($1, $2, $3, $4)
  `;
  try {
    await db.query(query, [username, hashedPassword, salt, userType]);
  } catch (err) {
    console.error("Error inserting user into DB:", err);
    throw err;
  }
};

//function that returns the user in base of its id
exports.fetchUserFromDB = (id) => {
  return new Promise((resolve, reject) => {
    const query = `SELECT username, hashpassword, salt, type FROM users WHERE username = $1`;

    db.query(query, [id])
      .then((result) => {
        if (result.rows.length === 0) {
          return resolve(null);
        }
        resolve(result.rows[0]);
      })
      .catch((err) => {
        reject(err);
      });
  });
};
exports.isStudentRegistered = async (studentId) => {
  const query = "select exists (select 1 from students where student_id = $1)";
  try {
    const result = await db.query(query, [studentId]);
    return result.rows[0].exists;
  } catch (err) {
    console.error("Error checking if student is registered:", err);
    throw err;
  }
};
exports.createStudent = async (student) => {
  const query = `
    insert into students (student_id, name, surname, birth_date, enrollment_date)
    values ($1, $2, $3, $4, $5)`;
  try {
    await db.query(query, [
      student.student_id,
      student.name,
      student.surname,
      student.birth_date,
      student.enrollment_date,
    ]);
    return student;
  } catch (err) {
    console.error("Error inserting student:", err);
    throw err;
  }
};
exports.getStudentById = async (studentId) => {
  const query = "select * from students where student_id = $1";
  try {
    const result = await db.query(query, [studentId]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  } catch (err) {
    console.error("Error retrieving student by ID:", err);
  }
};
exports.fetchStudents = async () => {
  const query = "select * from students";
  try {
    const result = await db.query(query);
    return result.rows;
  } catch (err) {
    console.error("Error retrieving all students:", err);
  }
};
exports.fetchProfessorStudents = async (professorId) => {
  const query = `
    select s.*
    from students s
    inner join students_courses sc on sc.student_id = s.student_id
    inner join courses c on c.course_id = sc.course_id and c.professor_id = $1
  `;

  try {
    const result = await db.query(query, [professorId]);

    const students = result.rows.map((row) => ({
      student_id: row.student_id,
      name: row.name,
      surname: row.surname,
      birth_date: row.birth_date,
      enrollment_date: row.enrollment_date,
    }));

    return students;
  } catch (err) {
    console.error("Error fetching professor's students:", err);
    throw err;
  }
};
exports.isCourseRegistered = async (courseId) => {
  const query = `
    select exists (select 1 from courses where course_id = $1)
  `;

  try {
    const result = await db.query(query, [courseId]);
    return result.rows[0].exists;
  } catch (err) {
    console.error("Error checking if course is registered:", err);
    throw err;
  }
};
exports.isStudentEnrolledToCourse = async (studentId, courseId) => {
  const query = `
    select true as result
    from students_courses sc
    inner join students s on sc.student_id = s.student_id
    where sc.student_id = $1 and sc.course_id = $2
  `;

  try {
    const result = await db.query(query, [studentId, courseId]);
    return result.rowCount > 0;
  } catch (err) {
    if (err.message.startsWith("Student")) {
      throw err;
    }
    console.error("Error checking if student is enrolled to course:", err);
    throw err;
  }
};
exports.enrollStudentToCourse = async (course) => {
  const query = `
    insert into students_courses (student_id, course_id) values ($1, $2)
  `;

  try {
    await db.query(query, [course.student_id, course.course_id]);
    return "";
  } catch (err) {
    console.error("Error enrolling student to course:", err);
    throw err;
  }
};
exports.deleteStudent = async (studentId) => {
  const query = `
    delete from students where student_id = $1
  `;

  try {
    await db.query(query, [studentId]);
    return null;
  } catch (err) {
    console.error("Error deleting student:", err);
    throw err;
  }
};
exports.isProfessorRegistered = async (professorId) => {
  const query =
    "select exists (select 1 from professors where professor_id = $1)";
  try {
    const result = await db.query(query, [professorId]);
    return result.rows[0].exists;
  } catch (err) {
    console.error("Error checking if professor is registered:", err);
    throw err;
  }
};
exports.createProfessor = async (professor) => {
  const query = `
    insert into professors (professor_id, name, surname, salary, hire_date)
    values ($1, $2, $3, $4, $5)`;
  try {
    await db.query(query, [
      professor.professor_id,
      professor.name,
      professor.surname,
      professor.salary,
      professor.hire_date,
    ]);
    return professor;
  } catch (err) {
    console.error("Error creating professor:", err);
    throw err;
  }
};
exports.getProfessorById = async (professorId) => {
  const query = "select * from professors where professor_id = $1";
  try {
    const result = await db.query(query, [professorId]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  } catch (err) {
    console.error("Error retrieving professor by ID:", err);
  }
};
exports.fetchProfessors = async () => {
  const query = "select * from professors";
  try {
    const result = await db.query(query);
    return result.rows;
  } catch (err) {
    console.error("Error retrieving all professors:", err);
  }
};
exports.deleteProfessor = async (professorId) => {
  const query = `
    delete from professors where professor_id = $1
  `;

  try {
    await db.query(query, [professorId]);
    return null;
  } catch (err) {
    console.error("Error deleting professor:", err);
    throw err;
  }
};
exports.createCourse = async (course) => {
  const query = `
    insert into courses (course_id, name, description, professor_id) values ($1, $2, $3, $4)`;
  try {
    await db.query(query, [
      course.course_id,
      course.name,
      course.description,
      course.professor_id,
    ]);
    return course;
  } catch (err) {
    console.error("Error inserting course:", err);
    throw err;
  }
};
exports.getCourseById = async (courseId) => {
  const query = "select * from courses where course_id = $1";
  try {
    const result = await db.query(query, [courseId]);
    if (result.rows.length === 0) {
      return null;
    }
    return result.rows[0];
  } catch (err) {
    console.error("Error retrieving course by ID:", err);
  }
};
exports.fetchCourses = async () => {
  const query = "select * from courses";
  try {
    const result = await db.query(query);
    return result.rows;
  } catch (err) {
    console.error("Error retrieving all courses:", err);
  }
};
exports.deleteCourse = async (courseId) => {
  const query = `
    delete from courses where course_id = $1
  `;

  try {
    await db.query(query, [courseId]);
    return null;
  } catch (err) {
    console.error("Error deleting course:", err);
    throw err;
  }
};
exports.assignProfessorToCourse = async (ass) => {
  const query = `update courses set professor_id = $1 where course_id = $2`;
  try {
    const result = await db.query(query, [ass.professor_id, ass.course_id]);
    return result.rowCount;
  } catch (err) {
    console.error("Error assigning professor to course", err);
    throw err;
  }
};
exports.checkStudEnrolledInProfCourse = async (
  studentId,
  professorId,
  courseId
) => {
  const query = `
    select sc.student_id
    from courses c
    inner join students_courses sc on sc.course_id = c.course_id 
    where sc.student_id = $1 and c.course_id = $2 and c.professor_id = $3
  `;

  try {
    const result = await db.query(query, [studentId, courseId, professorId]);
    return result.rowCount > 0;
  } catch (err) {
    console.error("Error executing query:", err);
    throw new Error(`Error executing query: ${err.message}`);
  }
};
exports.assignResultToStudent = async (ass) => {
  const query = `
    update students_courses 
    set result = $1 
    where student_id = $2 AND course_id = $3
  `;

  try {
    const result = await db.query(query, [
      ass.result,
      ass.student_id,
      ass.course_id,
    ]);
    return result.rowCount;
  } catch (err) {
    console.error("Error executing query:", err);
    throw new Error(`Error assigning result to student: ${err.message}`);
  }
};
exports.getStudentResults = async (studentId) => {
  const studentResults = [];
  const query = `
    select c.course_id,
           c.name,
           sc.result
    from students_courses sc
    inner join courses c on sc.course_id = c.course_id
    where sc.student_id = $1 and sc.result is not null`;

  try {
    const res = await db.query(query, [studentId]);
    for (let row of res.rows) {
      studentResults.push({
        courseId: row.course_id,
        courseName: row.name,
        result: row.result,
      });
    }
    return studentResults;
  } catch (err) {
    console.error("Error executing query:", err);
    throw err;
  }
};
