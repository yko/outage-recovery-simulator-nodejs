const express = require('express');
const yaml = require('js-yaml');
const fs = require('node:fs');
const winston = require('winston');
const { format, transports } = require('winston');
const { combine, timestamp, label, printf } = format;
// Create an Express app instance
const app = express();
const routes = require('./app/routes');

// Custom Winston log format
const myFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} - ${level} - ${message}`;
});

// Configure Winston logger
const logger = winston.createLogger({
  format: combine(
    timestamp({ format: 'YYYY-MM-DDTHH:mm:ssZ' }),
    myFormat
  ),
  transports: [
    new transports.File({ filename: 'app.log', level: 'info' }), // Log info and above to app.log
    new transports.Console() // Log to the console
  ]
});

// Load YAML configuration file
const config = yaml.load(fs.readFileSync('config.yaml', 'utf8'));
app.set('config', config);


// Middleware to log requests and responses.  This will log to winston
// based on the response code.
app.use((req, res, next) => {
  req.log_error = '';
  //Event listener that runs when the response is finished
  res.on('finish', () => {
    const message = `${req.method} ${req.path} ${res.statusCode} - ${req.log_error}`;
    res.statusCode < 499 ? logger.info(message) : logger.error(message);
  });
  next(); // Proceed to the next middleware
});

// Middleware to parse JSON request bodies
app.use(express.json());

// Mount the routes
app.use('/', routes);

// Error handling middleware
app.use((err, req, res, next) => {
  const lines = err.stack.split('\n');

  // Filter stack trace to remove node_modules lines for better readability
  const filteredStack = lines.filter(line => !line.includes('node_modules')).join("\n");

  req.log_error = filteredStack;

  // Check if headers have already been sent; if so, it's too late to send a custom response
  if (res.headersSent) {
    return next(err); // Re-throw the error to let the server handle it (e.g., crash reporting)
  }

  // Send a generic 500 error response
  res.status(500).json({ error: 'An internal server error occurred' });
});

// Export the Express app for use in other modules
module.exports = app;
