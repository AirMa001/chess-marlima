const { error } = require("console");

const responseHelper = {
  success: (res, data, statusCode = 200) => {
    res.status(statusCode).json({
      status: 'success',
      message: 'Success',
      data: data,
    });
  },
  error: (res, message, statusCode = 500) => {
    res.status(statusCode).json({
      error: true,
      errorCode: statusCode,
      status: 'error',
      message: message,
    });
  },
};

module.exports = responseHelper;
