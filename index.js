require('dotenv').config();

const express = require('express');
const {loadModel} = require("./services/loadModel");
const tf = require('@tensorflow/tfjs');
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

  // Endpoint for prediction
app.post('/predict', async (req, res) => {
    try {
        // Load model and preprocessor
        const { model, preprocessor } = await loadModel();

        // Assuming req.body contains the necessary input data
        const { data, goal, current_weight_kg, days_to_achieve_goal } = req.body;
        const category = data.category || data.Category;

        // Prepare the row for prediction
        const row = {
            'Caloric Density': data['Caloric Density'],
            'Protein (g)': data['Protein (g)'],
            'Carbohydrates (g)': data['Carbohydrates (g)'],
            'Fats (g)': data['Fats (g)'],
            'Category': category
        };


        // Logic to recommend based on category (Diet or Bulking)
        let total_calories_to_achieve_goal, daily_caloric_difference;

        if (category === 'Diet') {
            total_calories_to_achieve_goal = goal * 7700;
            daily_caloric_difference = -total_calories_to_achieve_goal / days_to_achieve_goal;
        } else if (category === 'Bulking') {
            total_calories_to_achieve_goal = goal * 7700;
            daily_caloric_difference = total_calories_to_achieve_goal / days_to_achieve_goal;
        } else {
            return res.status(400).json({ error: 'Invalid category' });
        }

        // Prepare recommendations based on model predictions
        const recommendations = [];
        for (let idx = 0; idx < data.length; idx++) {
            const row = data[idx];

            // Transform data using preprocessor
            const transformed = preprocessor.transform([row]);

            // Predict using the model
            const prediction = model.predict(transformed);

            // Decide based on category and model prediction
            if ((category === 'Diet' && prediction[0][1] > prediction[0][0]) ||
                (category === 'Bulking' && prediction[0][0] > prediction[0][1])) {
                if ((category === 'Diet' && row['Calories (kcal)'] <= daily_caloric_difference) ||
                    (category === 'Bulking' && row['Calories (kcal)'] >= daily_caloric_difference)) {
                    recommendations.push(row);
                }
            }
        }

        // Send recommendations as JSON response
        res.json({ recommendations });
    } catch (error) {
        res.status(500).json({ error: error.message });
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
