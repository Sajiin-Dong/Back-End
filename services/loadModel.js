const tf = require('@tensorflow/tfjs-node');
const fetch = require('node-fetch');

const modelUrl = 'https://storage.googleapis.com/test_model_emel/model.json'; // model dalam .h5 https://storage.googleapis.com/test_model_emel/Sajiin_Dong_model.h5
const preprocessorUrl = 'https://storage.googleapis.com/test_model_emel/Sajiin_Dong_model_preprocessor.pkl';

async function loadModel() {
  try {
    const model = await tf.loadLayersModel(modelUrl);

    const response = await fetch(preprocessorUrl);
    const preprocessor = await response.arrayBuffer();

    return { model, preprocessor };
  } catch (error) {
    throw new Error('Error loading model or preprocessor:', error);
  }
}

module.exports = {
  loadModel
};
