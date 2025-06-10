import winston from 'winston';
import pool from '../config/database.js';

// Configure Winston logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'military-asset-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// API logging middleware
export const logAPICall = async (req, res, next) => {
  const startTime = Date.now();
  
  // Capture original res.json to log response
  const originalJson = res.json;
  let responseBody = null;
  
  res.json = function(body) {
    responseBody = body;
    return originalJson.call(this, body);
  };

  // Continue with request
  res.on('finish', async () => {
    const duration = Date.now() - startTime;
    
    try {
      // Log to database
      const logQuery = `
        INSERT INTO api_logs (user_id, endpoint, method, request_body, response_status, ip_address, user_agent)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
      
      await pool.query(logQuery, [
        req.user?.id || null,
        req.originalUrl,
        req.method,
        req.method !== 'GET' ? JSON.stringify(req.body) : null,
        res.statusCode,
        req.ip || req.connection.remoteAddress,
        req.get('User-Agent')
      ]);

      // Log to Winston
      logger.info('API Call', {
        userId: req.user?.id,
        method: req.method,
        endpoint: req.originalUrl,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip
      });

    } catch (error) {
      logger.error('Failed to log API call', error);
    }
  });

  next();
};

export default logger;