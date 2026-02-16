import { Asset } from 'expo-asset';
import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import { decodeJpeg } from '@tensorflow/tfjs-react-native';
import { readAsStringAsync } from 'expo-file-system/legacy';
import { loadTensorflowModel } from 'react-native-fast-tflite';

// --- Configuration ---
const MODEL_NAME = 'best_float16.tflite';
const MODEL_INPUT_SIZE = 640; // YOLOv8 standard input size
const CONFIDENCE_THRESHOLD = 0.15; // Filter detections below this confidence

// Class labels for Tilapia disease detection 
const CLASS_LABELS = [
  'Bacterial Aeromonas Disease',
  'Healthy-Fish',
  'Streptococcus',
  'Tilapia Lake Virus',
];

let tfliteModel = null;
let modelIsLoading = false;
let modelInputShape = null; // Will store [height, width] of model input

// --- Model Initialization ---
/**
 * Initialize the YOLOv8 detection model
 * @returns {Promise<boolean>} true if successful, false otherwise
 */
export async function initializeDetectionModel() {
  if (tfliteModel) {
    return true;
  }
  modelIsLoading = true;
  try {
    await tf.ready();
    const tfliteAsset = await Asset.fromModule(require('../assets/best_float16.tflite')).downloadAsync();
    const assetUri = tfliteAsset.localUri || tfliteAsset.uri;
    tfliteModel = await loadTensorflowModel({ url: assetUri });
    console.log('[yoloDetector] YOLOv8 detection model loaded successfully');
    console.log(`[yoloDetector] Model Inputs: ${JSON.stringify(tfliteModel.inputs)}`);
    console.log(`[yoloDetector] Model Outputs: ${JSON.stringify(tfliteModel.outputs)}`);
    modelIsLoading = false;
    return true;
  } catch (error) {
    console.error('[yoloDetector] Error loading detection model:', error);
    modelIsLoading = false;
    return false;
  }
}

// --- Image Preprocessing ---
/**
 * Preprocess image for YOLO detection
 * Resizes to model input size, normalizes to [0, 1], and batches
 * @param {string} uri - File URI of the image
 * @returns {Promise<object>} Object containing tensor and original dimensions
 */
export async function preprocessImageForDetection(uri) {
  let imageTensor = null;
  let resized = null;
  let normalized = null;
  let batched = null;

  try {
    // Load image from file
    const base64 = await readAsStringAsync(uri, { encoding: 'base64' });
    const imageBuffer = Buffer.from(base64, 'base64');
    imageTensor = decodeJpeg(imageBuffer);

    // Get original image dimensions
    const [originalHeight, originalWidth] = imageTensor.shape;
    console.log(`[yoloDetector] Original image size: ${originalWidth}x${originalHeight}`);

    // Convert to float32
    const floatTensor = imageTensor.cast('float32');

    // Resize to model input size (640x640 for YOLOv8n)
    resized = tf.image.resizeBilinear(floatTensor, [MODEL_INPUT_SIZE, MODEL_INPUT_SIZE]);

    // Normalize to [0, 1] range
    normalized = resized.div(255.0);

    // Add batch dimension [1, 640, 640, 3]
    batched = normalized.expandDims(0);

    // Clean up intermediate tensors
    tf.dispose([imageTensor, floatTensor, resized, normalized]);

    console.log(`[yoloDetector] Preprocessed tensor shape: ${batched.shape}`);

    return {
      tensor: batched,
      originalWidth,
      originalHeight,
    };
  } catch (error) {
    console.error('[yoloDetector] Error preprocessing image:', error);
    tf.dispose([imageTensor, resized, normalized, batched]);
    throw error;
  }
}

// --- YOLO Output Parsing ---
/**
 * Parse YOLOv8 detection model output (transposed format)
 * YOLOv8n outputs: [8+num_classes, 8400] where data is transposed:
 *   - output[0:8400] = all x coordinates
 *   - output[8400:16800] = all y coordinates
 *   - output[16800:25200] = all widths
 *   - output[25200:33600] = all heights
 *   - output[33600:] = class probabilities (num_classes * 8400 values)
 * 
 * @param {Float32Array} output - Raw model output (transposed)
 * @param {number} originalWidth - Original image width
 * @param {number} originalHeight - Original image height
 * @param {number} threshold - Confidence threshold for filtering
 * @returns {Array} Array of detection objects with bounding boxes
 */
function parseYOLOOutput(output, originalWidth, originalHeight, threshold = CONFIDENCE_THRESHOLD, outputShape) {
  const detections = [];

  console.log('[yoloDetector] ===== PARSING YOLO OUTPUT =====');
  console.log(`[yoloDetector] Output length: ${output.length}`);
  console.log(`[yoloDetector] Original image: ${originalWidth}x${originalHeight}`);
  console.log(`[yoloDetector] Confidence threshold: ${threshold}`);
  console.log(`[yoloDetector] Classes: ${CLASS_LABELS.join(', ')}`);

  // Model outputs in transposed format: [8+num_classes, 8400]
  const numAnchors = 8400;
  const numClasses = CLASS_LABELS.length;
  const totalValues = numAnchors * (4 + numClasses);
  
  console.log(`[yoloDetector] Expected output: ${totalValues} (8400 anchors * ${4 + numClasses})`);
  console.log(`[yoloDetector] Actual output: ${output.length}`);

  // Check if output matches expected size
  if (output.length !== totalValues) {
    console.warn(`[yoloDetector] WARNING: Output size mismatch! Expected ${totalValues}, got ${output.length}`);
  }

  // Determine layout based on shape
  // Standard YOLOv8 TFLite export is [1, 8400, 4+classes] (Channels Last)
  // Legacy/ONNX export might be [1, 4+classes, 8400] (Channels First)
  let layout = 'channels_first'; // Default to old behavior if unknown
  if (outputShape && outputShape.length >= 2) {
    const lastDim = outputShape[outputShape.length - 1];
    const secondLastDim = outputShape[outputShape.length - 2];
    if (secondLastDim === numAnchors && lastDim === (4 + numClasses)) {
      layout = 'channels_last'; // [8400, 8]
    }
  }
  console.log(`[yoloDetector] Output Layout: ${layout} (Shape: ${outputShape ? outputShape.join('x') : 'unknown'})`);

  const bboxes = [];
  let candidatesProcessed = 0;
  let skippedCounter = 0;

  // Process each anchor
  for (let i = 0; i < numAnchors; i++) {
    candidatesProcessed++;

    let centerX, centerY, width, height;
    let classId = 0;
    let maxClassProb = 0;

    if (layout === 'channels_last') {
      // [8400, 8] format: [x, y, w, h, c0, c1...] per anchor
      // Data is interleaved
      const offset = i * (4 + numClasses);
      centerX = output[offset + 0];
      centerY = output[offset + 1];
      width = output[offset + 2];
      height = output[offset + 3];

      for (let c = 0; c < numClasses; c++) {
        const classProb = output[offset + 4 + c];
        if (classProb > maxClassProb) {
          maxClassProb = classProb;
          classId = c;
        }
      }
    } else {
      // [8, 8400] format: [all_x, all_y, all_w, all_h, all_c0...]
      // Data is planar (transposed)
      centerX = output[0 * numAnchors + i];
      centerY = output[1 * numAnchors + i];
      width = output[2 * numAnchors + i];
      height = output[3 * numAnchors + i];

      for (let c = 0; c < numClasses; c++) {
        const classProb = output[(4 + c) * numAnchors + i];
        if (classProb > maxClassProb) {
          maxClassProb = classProb;
          classId = c;
        }
      }
    }

    // Skip if confidence is too low
    if (maxClassProb < threshold) {
      skippedCounter++;
      continue;
    }

    // Model outputs coordinates already in normalized 0-1 space
    // Center coordinates and dimensions are already in 0-1 range
    const x = centerX - width / 2;
    const y = centerY - height / 2;

    // Clamp to image boundaries and keep normalized to 0-1
    const detection = {
      x: Math.max(0, Math.min(1, x)),
      y: Math.max(0, Math.min(1, y)),
      width: Math.max(0, Math.min(1 - x, width)),
      height: Math.max(0, Math.min(1 - y, height)),
      confidence: maxClassProb,
      classId,
      className: CLASS_LABELS[classId] || `Class ${classId}`,
    };

    bboxes.push(detection);

    console.log(
      `[yoloDetector] ✓ Detection #${bboxes.length}: ${detection.className} | ` +
      `RawCenter:(${centerX.toFixed(2)}, ${centerY.toFixed(2)}) | ` +
      `RawSize:(${width.toFixed(2)}x${height.toFixed(2)}) | ` +
      `ClassProb:${maxClassProb.toFixed(4)} | Conf:${(detection.confidence * 100).toFixed(2)}%`
    );
    
    // Detailed coordinate calculation logging
    console.log(
      `[yoloDetector] Coordinate Calculation:\n` +
      `  Raw Center: (${centerX.toFixed(4)}, ${centerY.toFixed(4)})\n` +
      `  Raw Size: (${width.toFixed(4)}, ${height.toFixed(4)})\n` +
      `  Calculated top-left before clamp: (${x.toFixed(4)}, ${y.toFixed(4)})\n` +
      `  Calculated box: x=${x.toFixed(4)}, y=${y.toFixed(4)}, w=${width.toFixed(4)}, h=${height.toFixed(4)}\n` +
      `  After clamping: x=${detection.x.toFixed(4)}, y=${detection.y.toFixed(4)}, w=${detection.width.toFixed(4)}, h=${detection.height.toFixed(4)}\n` +
      `  In pixels (${originalWidth}x${originalHeight}): x=${(detection.x * originalWidth).toFixed(1)}px, y=${(detection.y * originalHeight).toFixed(1)}px, w=${(detection.width * originalWidth).toFixed(1)}px, h=${(detection.height * originalHeight).toFixed(1)}px`
    );
  }

  console.log(`[yoloDetector] Processed ${candidatesProcessed} candidates, ${skippedCounter} skipped (low conf)`);
  console.log(`[yoloDetector] Detections before NMS: ${bboxes.length}`);

  // Non-Maximum Suppression (NMS) to remove duplicate detections
  const nmsResult = nmsDetections(bboxes);
  
  console.log(`[yoloDetector] Detections after NMS: ${nmsResult.length}`);
  console.log('[yoloDetector] ===== END PARSING =====');
  
  return nmsResult;
}

// --- Non-Maximum Suppression ---
/**
 * Apply Non-Maximum Suppression to remove duplicate/overlapping detections
 * @param {Array} boxes - Array of detection boxes
 * @param {number} iouThreshold - Intersection over Union threshold (default 0.4)
 * @returns {Array} Filtered detections
 */
function nmsDetections(boxes, iouThreshold = 0.4) {
  if (boxes.length === 0) return [];

  // Sort by confidence descending
  boxes.sort((a, b) => b.confidence - a.confidence);

  const keep = [boxes[0]];
  const indices = [0];

  for (let i = 1; i < boxes.length; i++) {
    let keep_box = true;

    for (const keepIdx of indices) {
      const iou = calculateIoU(boxes[i], boxes[keepIdx]);
      if (iou > iouThreshold) {
        keep_box = false;
        break;
      }
    }

    if (keep_box) {
      keep.push(boxes[i]);
      indices.push(i);
    }
  }

  return keep;
}

// --- IoU Calculation ---
/**
 * Calculate Intersection over Union between two boxes
 * @param {object} box1 - First bounding box
 * @param {object} box2 - Second bounding box
 * @returns {number} IoU value between 0 and 1
 */
function calculateIoU(box1, box2) {
  const x1_min = box1.x;
  const y1_min = box1.y;
  const x1_max = box1.x + box1.width;
  const y1_max = box1.y + box1.height;

  const x2_min = box2.x;
  const y2_min = box2.y;
  const x2_max = box2.x + box2.width;
  const y2_max = box2.y + box2.height;

  const intersectionX = Math.max(0, Math.min(x1_max, x2_max) - Math.max(x1_min, x2_min));
  const intersectionY = Math.max(0, Math.min(y1_max, y2_max) - Math.max(y1_min, y2_min));
  const intersectionArea = intersectionX * intersectionY;

  const box1Area = box1.width * box1.height;
  const box2Area = box2.width * box2.height;
  const unionArea = box1Area + box2Area - intersectionArea;

  return intersectionArea / unionArea;
}

// --- Detection Execution ---
/**
 * Run YOLO detection on an image
 * @param {string} uri - File URI of the image
 * @param {number} threshold - Confidence threshold for filtering (optional)
 * @returns {Promise<object>} Detection results with bounding boxes and metadata
 */
export async function detectObjectsYOLO(uri, threshold = CONFIDENCE_THRESHOLD) {
  if (!tfliteModel) {
    const loaded = await initializeDetectionModel();
    if (!loaded) {
      throw new Error('YOLO detection model not initialized. Cannot detect.');
    }
  }

  let preprocessed = null;

  try {
    console.log('[yoloDetector] ========== DETECTION START ==========');
    console.log(`[yoloDetector] Input URI: ${uri}`);
    console.log(`[yoloDetector] Threshold: ${threshold}`);

    // Preprocess image
    preprocessed = await preprocessImageForDetection(uri);
    const inputTensor = preprocessed.tensor;
    const inputData = inputTensor.dataSync();
    const typedInput = new Float32Array(inputData);

    console.log(`[yoloDetector] Input tensor shape: ${inputTensor.shape}`);
    
    // Calculate min/max safely without spreading large arrays
    let inputMin = inputData[0];
    let inputMax = inputData[0];
    let inputSum = 0;
    for (let i = 0; i < inputData.length; i++) {
      if (inputData[i] < inputMin) inputMin = inputData[i];
      if (inputData[i] > inputMax) inputMax = inputData[i];
      inputSum += inputData[i];
    }
    console.log(`[yoloDetector] Input tensor min: ${inputMin}, max: ${inputMax}`);
    console.log(`[yoloDetector] Input tensor mean: ${(inputSum / inputData.length).toFixed(4)}`);

    // Verify input size against model metadata if available
    if (tfliteModel.inputs && tfliteModel.inputs.length > 0) {
      const inputShape = tfliteModel.inputs[0].shape;
      const expectedSize = inputShape.reduce((a, b) => a * b, 1);
      if (inputData.length !== expectedSize) {
        console.warn(`[yoloDetector] WARNING: Input size mismatch! Model expects ${expectedSize} elements (shape: ${inputShape.join('x')}), but prepared ${inputData.length}. Check MODEL_INPUT_SIZE.`);
      }
    }

    // Run inference
    console.log('[yoloDetector] Running inference...');
    const startTime = Date.now();
    let output;
    try {
      output = tfliteModel.runSync([typedInput]);
    } catch (e) {
      console.error('[yoloDetector] Fatal error in tfliteModel.runSync:', e);
      // Log model state for debugging
      console.log('[yoloDetector] Model state:', tfliteModel);
      throw e;
    }
    const inferenceTime = Date.now() - startTime;
    console.log(`[yoloDetector] Inference completed in ${inferenceTime}ms`);

    const outputData = output[0];
    const outputShape = tfliteModel.outputs?.[0]?.shape;
    console.log(`[yoloDetector] Raw output shape: ${outputData.length}`);
    
    // Calculate output min/max safely
    let outputMin = outputData[0];
    let outputMax = outputData[0];
    let outputSum = 0;
    for (let i = 0; i < Math.min(outputData.length, 10000); i++) {
      if (outputData[i] < outputMin) outputMin = outputData[i];
      if (outputData[i] > outputMax) outputMax = outputData[i];
      outputSum += outputData[i];
    }
    console.log(`[yoloDetector] Output min: ${outputMin}, max: ${outputMax}`);
    console.log(`[yoloDetector] Output mean: ${(outputSum / Math.min(outputData.length, 10000)).toFixed(4)}`);
    
    // Debug: Log first 50 raw values to understand structure
    console.log('[yoloDetector] First 50 raw output values:');
    let debugStr = '';
    for (let i = 0; i < Math.min(50, outputData.length); i++) {
      debugStr += `${outputData[i].toFixed(4)}, `;
    }
    console.log(debugStr);
    
    // Debug: Sample values at different positions to understand stride
    console.log('[yoloDetector] Sample values at different strides:');
    for (let stride = 1; stride <= 10; stride++) {
      let sampleStr = `Stride ${stride}: `;
      for (let i = 0; i < Math.min(10, Math.floor(outputData.length / stride)); i++) {
        sampleStr += `${outputData[i * stride].toFixed(4)}, `;
      }
      console.log(sampleStr);
    }

    // Parse detections
    const detections = parseYOLOOutput(
      outputData,
      preprocessed.originalWidth,
      preprocessed.originalHeight,
      threshold,
      outputShape
    );

    console.log(`[yoloDetector] ========== DETECTION SUMMARY ==========`);
    console.log(`[yoloDetector] Total detections: ${detections.length}`);
    console.log(`[yoloDetector] Original image: ${preprocessed.originalWidth}x${preprocessed.originalHeight}`);

    detections.forEach((det, idx) => {
      console.log(
        `[yoloDetector] Detection #${idx + 1}: ${det.className} | ` +
        `Norm Pos:(${det.x.toFixed(3)}, ${det.y.toFixed(3)}) | ` +
        `Norm Size:(${det.width.toFixed(3)}x${det.height.toFixed(3)}) | ` +
        `Conf:${(det.confidence * 100).toFixed(2)}%`
      );
    });

    return {
      detections,
      originalWidth: preprocessed.originalWidth,
      originalHeight: preprocessed.originalHeight,
      modelInputSize: MODEL_INPUT_SIZE,
      threshold,
    };
  } catch (error) {
    console.error('[yoloDetector] Error during detection:', error);
    throw error;
  } finally {
    if (preprocessed?.tensor) {
      tf.dispose(preprocessed.tensor);
    }
    console.log(`[yoloDetector] Memory: ${tf.memory().numTensors} tensors currently active.`);
  }
}

// --- Utility: Get detection with highest confidence ---
/**
 * Get the detection with the highest confidence score
 * Useful for backward compatibility with classification UI
 * @param {Array} detections - Array of detection objects
 * @returns {object|null} Highest confidence detection or null
 */
export function getTopDetection(detections) {
  if (!detections || detections.length === 0) return null;
  return detections.reduce((prev, current) =>
    prev.confidence > current.confidence ? prev : current
  );
}

/**
 * Group detections by class
 * Useful for displaying grouped results
 * @param {Array} detections - Array of detection objects
 * @returns {object} Object with className keys mapping to arrays of detections
 */
export function groupDetectionsByClass(detections) {
  return detections.reduce((acc, det) => {
    if (!acc[det.className]) {
      acc[det.className] = [];
    }
    acc[det.className].push(det);
    return acc;
  }, {});
}
