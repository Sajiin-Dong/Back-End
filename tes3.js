require('dotenv').config();

const express = require('express');
const loadModel = require("./services/loadModel");
const InputError = require('./exceptions/InputError');

(async () => {
  const app = express();
  const port = 3000;
  const host = '0.0.0.0';

  // Middleware to parse JSON
  app.use(express.json());

  // Load model and attach it to the app instance
  const model = await loadModel();
  app.locals.model = model;
  
  // Route to check if model is loaded
  app.get('/model', (req, res) => {
    if (app.locals.model) {
      res.json({
        status: 'success',
        message: 'Model successfully loaded and ready to use.'
      });
    } else {
      res.status(500).json({
        status: 'fail',
        message: 'Model not loaded yet. Please try again later.'
      });
    }
  });

  // Route to handle predictions
  app.post('/predict', async (req, res, next) => {
    try {
      const { data, goal, current_weight_kg, days_to_achieve_goal, category } = req.body;

      if (!data || !goal || !current_weight_kg || !days_to_achieve_goal || !category) {
        throw new InputError('Missing required fields.');
      }

      // Assuming 'data' is an array of objects similar to your input format
      const recommendations = await app.locals.model.recommend(data, goal, current_weight_kg, days_to_achieve_goal, category);

      res.json({
        status: 'success',
        data: recommendations
      });
    } catch (error) {
      next(error);
    }
  });


  // Error handling middleware
  app.use((err, req, res, next) => {
    if (err instanceof InputError) {
      res.status(err.output.statusCode).json({
        status: 'fail',
        message: `${err.message} Silakan input dengan benar.`,
      });
    } else if (err) {
      res.status(err.status || 500).json({
        status: 'fail',
        message: err.message || 'Internal Server Error',
      });
    } else {
      next();
    }
  });

  app.listen(port, host, () => {
    console.log(`Server started at: http://${host}:${port}`);
  });
})();
