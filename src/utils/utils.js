"use strict";
exports.isValidDateFormat = (dateString) => {
  const dateFormat = /^\d{4}-\d{2}-\d{2}$/;
  return dateFormat.test(dateString);
};
