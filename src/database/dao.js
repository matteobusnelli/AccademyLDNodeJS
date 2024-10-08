"use strict";
const db = require("./postgres");

//function that returns the user in base of its id
exports.FetchUserFromDB = (id) => {
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
  const sqlStatement =
    "select exists (select 1 from students where student_id = $1)";
  try {
    const result = await db.query(sqlStatement, [studentId]);
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
    return "";
  } catch (err) {
    console.error("Error inserting student:", err);
    throw err;
  }
};
