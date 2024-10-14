SELECT 'CREATE DATABASE university'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'university')\gexec

SELECT 'CREATE DATABASE university_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'university_test')\gexec


\c university;

CREATE TABLE students(
   student_id  varchar(10) NOT NULL,
   name        varchar (50) NOT NULL,
   surname     varchar (50) NOT NULL,
   birth_date  date,
   enrollment_date  date,
   PRIMARY KEY (student_id)
);

CREATE TABLE professors(
   professor_id  varchar(10) NOT NULL,
   name        varchar (50) NOT NULL,
   surname      varchar (50) NOT NULL,
   salary     float check(salary>0),
   hire_date  date,
   PRIMARY KEY (professor_id)
);

CREATE TABLE courses(
   course_id   varchar(10) NOT NULL,
   name        varchar (50) NOT NULL,
   description text,
   professor_id varchar(10),
   PRIMARY KEY (course_id),
   FOREIGN KEY (professor_id) REFERENCES professors(professor_id) ON DELETE CASCADE
);

CREATE TABLE students_courses(
   student_id  varchar(10) NOT NULL,
   course_id   varchar(10) NOT NULL,
   result int CHECK (((result >= 0) AND (result <= 30))),
   PRIMARY KEY (student_id, course_id),
   FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
   FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);

CREATE TABLE users (
    username VARCHAR(255),
    hashpassword VARCHAR(255) NOT NULL,
    salt VARCHAR(255) NOT NULL,
    type VARCHAR(50) CHECK (type IN ('admin','student', 'professor')) NOT null,
    PRIMARY KEY (username)
);

INSERT INTO users (username, hashpassword, salt, "type")
VALUES ('admin', '4b0b373f240e6e79e99787b71c9b27de73baeb244cd81f73e409878c52024f78', 'qwertyuiop', 'admin');

INSERT INTO users (username, hashpassword, salt, "type")
VALUES ('P123456', '171219afcb393c1b2b2f91b8367039942d1867083c00cba0454af7c1f45d62c7', 'asdfghjkl', 'professor');

INSERT INTO users (username, hashpassword, salt, "type")
VALUES ('S123456', 'fcd02ebe745d3b9b28c6048986dd73a3ad6637593b2e0d8179b674c1e9f0a59b', 'zxcvbnm', 'student');

\c university_test;

CREATE TABLE students(
   student_id  varchar(10) NOT NULL,
   name        varchar (50) NOT NULL,
   surname     varchar (50) NOT NULL,
   birth_date  date,
   enrollment_date  date,
   PRIMARY KEY (student_id)
);

CREATE TABLE professors(
   professor_id  varchar(10) NOT NULL,
   name        varchar (50) NOT NULL,
   surname      varchar (50) NOT NULL,
   salary     float check(salary>0),
   hire_date  date,
   PRIMARY KEY (professor_id)
);

CREATE TABLE courses(
   course_id   varchar(10) NOT NULL,
   name        varchar (50) NOT NULL,
   description text,
   professor_id varchar(10),
   PRIMARY KEY (course_id),
   FOREIGN KEY (professor_id) REFERENCES professors(professor_id) ON DELETE CASCADE
);

CREATE TABLE students_courses(
   student_id  varchar(10) NOT NULL,
   course_id   varchar(10) NOT NULL,
   result int CHECK (((result >= 0) AND (result <= 30))),
   PRIMARY KEY (student_id, course_id),
   FOREIGN KEY (student_id) REFERENCES students(student_id) ON DELETE CASCADE,
   FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE CASCADE
);

CREATE TABLE users (
    username VARCHAR(255),
    hashpassword VARCHAR(255) NOT NULL,
    salt VARCHAR(255) NOT NULL,
    type VARCHAR(50) CHECK (type IN ('admin','student', 'professor')) NOT null,
    PRIMARY KEY (username)
);
