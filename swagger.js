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
        url: 'http://localhost:5000', // Change this to your server URL
      },
    ],
  },
  apis: ['./controllers/*.js', './routes/*.js'], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

function setupSwagger(app) {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

module.exports = setupSwagger;
