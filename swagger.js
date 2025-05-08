const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: '1.0.0',
      description: 'User authentication API documentation',
    },
    servers: [
      {
        url: 'http://localhost:5000', // Your server URL
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT', // Specifies that the token is a JWT
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'token'
        }
      },
    },
    security: [
      {
        bearerAuth: [], // Applies Bearer auth globally (optional, can be overridden per route)
        cookieAuth: [] // Applies Cookie auth globally (optional, can be overridden per route)
      },
    ],
  },
  apis: ['./controllers/*.js', './routes/*.js'], // Paths to files with Swagger comments
};

const swaggerSpec = swaggerJsdoc(options);

// Export for use in your app
module.exports = {
  swaggerUi,
  swaggerSpec,
};