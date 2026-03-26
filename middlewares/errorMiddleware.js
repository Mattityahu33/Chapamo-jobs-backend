const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
      error: {
          message: err.message || 'Something went wrong!',
          ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
      }
  });
};

const notFound = (req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
};

export { errorHandler, notFound };



