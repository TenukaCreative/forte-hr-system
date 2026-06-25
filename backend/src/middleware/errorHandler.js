// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;

  // Always log to server console so errors are visible in
  // Azure logs regardless of environment
  console.error(`[${new Date().toISOString()}] ${status} - ${err.message}`);
  if (process.env.NODE_ENV !== 'production') console.error(err.stack);

  res.status(status).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

module.exports = errorHandler;
