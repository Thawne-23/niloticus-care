// Mock TensorFlow.js implementation for testing in Expo Go
const tf = {
  ready: () => Promise.resolve(),
  tensor: () => ({ dispose: () => {} }),
  zeros: () => ({ dispose: () => {} }),
  dispose: () => {},
  tidy: (fn) => fn(),
  util: {
    // Return a Uint8Array so `.buffer` exists
    encodeString: (_str, _enc) => new Uint8Array([0])
  },
  tfliteTFLiteModel: async () => ({
    predict: () => ({
      data: () => [0.1, 0.8, 0.05, 0.05], // Mock prediction scores
      dispose: () => {}
    })
  })
};

export { tf };

// Mock decodeJpeg
export const decodeJpeg = () => ({
  toFloat: () => ({
    div: () => ({
      expandDims: () => ({})
    })
  })
});

// Mock FileSystem and ImageManipulator
const FileSystem = {
  bundleDirectory: 'mock-directory',
};

const ImageManipulator = {
  SaveFormat: { JPEG: 'jpeg', PNG: 'png' },
  manipulateAsync: async () => ({
    base64: 'mock-base64-string',
  })
};

// Export mocks
export { FileSystem, ImageManipulator };

// Model configuration
const MODEL_PATH = FileSystem.bundleDirectory
  ? FileSystem.bundleDirectory + 'assets/best.tflite'
  : 'assets/best.tflite';

const CLASS_NAMES = [
  'Bacterial Aeromonas Disease',
  'Healthy-Fish',
  'Streptococcus',
  'Tilapia Lake Virus',
];

const IMAGE_SIZE = 224; // Model input size (224x224)

let tfliteModel = null;

/**
 * Loads and caches the TFLite model
 */
export async function loadModel() {
  if (tfliteModel) return tfliteModel;
  
  try {
    await tf.ready();
    
    // Load the TFLite model
    tfliteModel = await tf.tfliteTFLiteModel(MODEL_PATH);
    
    // Warm up the model with a dummy input
    const warmupTensor = tf.zeros([1, IMAGE_SIZE, IMAGE_SIZE, 3]);
    const warmupOutput = tfliteModel.predict(warmupTensor);
    warmupTensor.dispose();
    warmupOutput.dispose();
    
    return tfliteModel;
  } catch (error) {
    console.error('Error loading TFLite model:', error);
    throw new Error('Failed to load TFLite model');
  }
}

/**
 * Preprocesses the image for the model
 * @param {string} uri - Image URI from expo-image-picker
 * @returns {Promise<tf.Tensor>} Preprocessed image tensor
 */
async function preprocessImage(uri) {
  try {
    // Resize image using expo-image-manipulator
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: IMAGE_SIZE, height: IMAGE_SIZE } }],
      { compress: 1, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );

    // Convert base64 to tensor
    const imgB64 = manipResult.base64;
    const imgBuffer = tf.util.encodeString(imgB64, 'base64').buffer;
    const raw = new Uint8Array(imgBuffer);
    let imageTensor = decodeJpeg(raw);
    
    // Convert to float32 and normalize to [0, 1]
    return tf.tidy(() => {
      const floatTensor = imageTensor.toFloat();
      const normalized = floatTensor.div(255.0);
      return normalized.expandDims(0); // Add batch dimension [1,224,224,3]
    });
  } catch (error) {
    console.error('Image preprocessing failed:', error);
    throw new Error('Failed to preprocess image');
  }
}

/**
 * Classifies an image using the TFLite model
 * @param {string} uri - Image URI from expo-image-picker
 * @returns {Promise<{className: string, confidence: number}>} Prediction result
 */
export async function classifyImage(uri) {
  let model;
  let imageTensor;
  
  try {
    // Load the model if not already loaded
    model = await loadModel();
    
    // Preprocess the image
    imageTensor = await preprocessImage(uri);
    
    // Run inference
    const outputTensor = model.predict(imageTensor);
    const output = await outputTensor.data();
    
    // Get the predicted class and confidence
    const maxIndex = output.indexOf(Math.max(...output));
    const confidence = output[maxIndex];
    const className = CLASS_NAMES[maxIndex] || 'Unknown';
    
    return { className, confidence };
  } catch (error) {
    console.error('Classification error:', error);
    throw new Error('Failed to classify image');
  } finally {
    // Clean up tensors
    if (imageTensor) {
      tf.dispose(imageTensor);
    }
  }
}

// Initialize the model when this module is imported
loadModel().catch(console.error);
