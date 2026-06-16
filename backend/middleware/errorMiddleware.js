const errorHandler = (err, req, res, next) => {
    // If the status code is already set (e.g., 400), keep it. Otherwise, default to 500.
    const statusCode = res.statusCode ? res.statusCode : 500;

    res.status(statusCode);

    res.json({
        message: err.message,
        // Only show the stack trace if the app is in development mode
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = { errorHandler };