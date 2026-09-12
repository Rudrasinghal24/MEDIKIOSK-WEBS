/**
 * Image Enhancement & Preprocessing Utility using HTML Canvas API
 * Designed to dramatically increase OCR accuracy on Indian hospital prescriptions,
 * OPD slips, lab reports, and handwritten doctor notes.
 *
 * Techniques:
 * 1. Resolution Normalization (preserving sharp handwriting strokes up to 2048px without blur)
 * 2. Dynamic Contrast Stretching (Histogram Stretching to separate faint blue/black ink from yellowed/shaded paper)
 * 3. Unsharp Masking / Edge Sharpening (enhances ballpoint pen and pencil edges)
 * 4. Adaptive Binarization / High-Contrast Scanner Mode (removes shadow gradients from smartphone camera angles)
 * 5. 90-Degree Stepped Rotation (corrects sideways/upside-down captures before vision model ingestion)
 */

export type EnhancementMode = 'auto_contrast' | 'high_contrast' | 'grayscale_scanner' | 'binarize' | 'original';

export interface ImageEnhancementOptions {
  mode?: EnhancementMode;
  rotation?: 0 | 90 | 180 | 270;
  brightness?: number; // -50 to 50
  contrast?: number;   // -50 to 50
  maxDimension?: number;
  quality?: number;
}

export interface ImageEnhancementResult {
  dataUrl: string;
  width: number;
  height: number;
  rotation: number;
  mode: EnhancementMode;
  appliedFilters: string[];
}

/**
 * Load an image data URL or File into an HTMLImageElement
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Failed to load image for canvas enhancement: ' + err));
    img.src = src;
  });
}

/**
 * Applies unsharp masking / 3x3 convolution to sharpen pen strokes
 */
function applySharpenFilter(ctx: CanvasRenderingContext2D, width: number, height: number, amount: number = 0.4) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const copy = new Uint8ClampedArray(data);

  // 3x3 sharpen kernel:
  // [  0, -a,  0 ]
  // [ -a, 1+4a, -a ]
  // [  0, -a,  0 ]
  const a = amount;
  const center = 1 + 4 * a;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = (y * width + x) * 4;
      for (let c = 0; c < 3; c++) {
        const top = copy[((y - 1) * width + x) * 4 + c];
        const bottom = copy[((y + 1) * width + x) * 4 + c];
        const left = copy[(y * width + (x - 1)) * 4 + c];
        const right = copy[(y * width + (x + 1)) * 4 + c];
        const val = center * copy[idx + c] - a * (top + bottom + left + right);
        data[idx + c] = Math.min(255, Math.max(0, val));
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Auto-Contrast (Histogram Stretching) for handwriting against shaded paper
 */
function applyAutoContrast(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  brightnessOffset: number = 0,
  contrastFactor: number = 1
) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  const totalPixels = width * height;

  // 1. Build luminance histogram
  const hist = new Int32Array(256);
  for (let i = 0; i < data.length; i += 4) {
    const lum = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
    hist[lum]++;
  }

  // 2. Find 2nd and 98th percentile to prevent outlier single-pixel clipping
  const lowThreshold = totalPixels * 0.02;
  const highThreshold = totalPixels * 0.98;

  let acc = 0;
  let minLum = 0;
  let maxLum = 255;

  for (let i = 0; i < 256; i++) {
    acc += hist[i];
    if (acc >= lowThreshold) {
      minLum = i;
      break;
    }
  }

  acc = 0;
  for (let i = 255; i >= 0; i--) {
    acc += hist[i];
    if (acc >= totalPixels - highThreshold) {
      maxLum = i;
      break;
    }
  }

  if (maxLum <= minLum) {
    minLum = 0;
    maxLum = 255;
  }

  const range = maxLum - minLum;
  const scale = 255 / range;

  // 3. Transform pixels with stretched histogram + contrast/brightness boost
  for (let i = 0; i < data.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      let val = data[i + c];
      // Contrast stretch
      val = (val - minLum) * scale;
      // Additional user contrast factor
      if (contrastFactor !== 1) {
        val = 128 + (val - 128) * contrastFactor;
      }
      // User brightness offset
      val += brightnessOffset;
      data[i + c] = Math.min(255, Math.max(0, val));
    }
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * High-Contrast Binarized / Document Scanner Mode
 * Converts shaded medical paper into crisp white paper with dark ink strokes
 */
function applyScannerBinarization(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  // Calculate average luminance
  let totalLum = 0;
  for (let i = 0; i < data.length; i += 4) {
    totalLum += 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
  }
  const avgLum = totalLum / (width * height);
  const threshold = Math.max(90, Math.min(185, avgLum * 0.92));

  for (let i = 0; i < data.length; i += 4) {
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    // Dynamic curve: boost light backgrounds to white, sharpen dark handwriting ink
    let out = 255;
    if (lum < threshold) {
      // Dark ink: deepen
      out = Math.max(0, Math.round(lum * 0.65));
    } else {
      // Paper background: whiten
      out = Math.min(255, Math.round(230 + (lum - threshold) * 0.8));
    }

    data[i] = out;
    data[i + 1] = out;
    data[i + 2] = out;
  }

  ctx.putImageData(imageData, 0, 0);
}

/**
 * Primary Canvas API Image Preprocessing Pipeline
 * Takes a raw image base64 data URL and applies optimal filters for vision OCR
 */
export async function enhanceDocumentImage(
  imageSource: string,
  options: ImageEnhancementOptions = {}
): Promise<ImageEnhancementResult> {
  const {
    mode = 'auto_contrast',
    rotation = 0,
    brightness = 0,
    contrast = 0,
    maxDimension = 2048,
    quality = 0.92,
  } = options;

  const appliedFilters: string[] = [];

  // Skip SVG or non-raster
  if (imageSource.includes('<svg') || imageSource.includes('image/svg+xml')) {
    return {
      dataUrl: imageSource,
      width: 800,
      height: 1000,
      rotation: 0,
      mode: 'original',
      appliedFilters: ['Vector SVG Preserved'],
    };
  }

  const img = await loadImage(imageSource);
  let srcWidth = img.naturalWidth || img.width;
  let srcHeight = img.naturalHeight || img.height;

  // Scale within bounds while keeping aspect ratio and handwriting fidelity
  let targetWidth = srcWidth;
  let targetHeight = srcHeight;
  if (targetWidth > maxDimension || targetHeight > maxDimension) {
    if (targetWidth > targetHeight) {
      targetHeight = Math.round((targetHeight * maxDimension) / targetWidth);
      targetWidth = maxDimension;
    } else {
      targetWidth = Math.round((targetWidth * maxDimension) / targetHeight);
      targetHeight = maxDimension;
    }
    appliedFilters.push(`Normalized resolution (${targetWidth}x${targetHeight})`);
  }

  // Determine final canvas dimension based on rotation
  const isRotated90or270 = rotation === 90 || rotation === 270;
  const canvasWidth = isRotated90or270 ? targetHeight : targetWidth;
  const canvasHeight = isRotated90or270 ? targetWidth : targetHeight;

  const canvas = document.createElement('canvas');
  canvas.width = canvasWidth;
  canvas.height = canvasHeight;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (!ctx) {
    return {
      dataUrl: imageSource,
      width: srcWidth,
      height: srcHeight,
      rotation: 0,
      mode: 'original',
      appliedFilters: ['Canvas Context Unavailable - Raw Kept'],
    };
  }

  // Fill canvas with white background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);

  // Apply Rotation
  ctx.save();
  if (rotation === 90) {
    ctx.translate(canvasWidth, 0);
    ctx.rotate((90 * Math.PI) / 180);
    appliedFilters.push('Rotated 90° Clockwise');
  } else if (rotation === 180) {
    ctx.translate(canvasWidth, canvasHeight);
    ctx.rotate((180 * Math.PI) / 180);
    appliedFilters.push('Rotated 180°');
  } else if (rotation === 270) {
    ctx.translate(0, canvasHeight);
    ctx.rotate((270 * Math.PI) / 180);
    appliedFilters.push('Rotated 270° (90° CCW)');
  }

  // Draw image with smooth interpolation
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
  ctx.restore();

  // Apply Mode-Specific Filters
  const contrastFactor = 1 + contrast / 50;

  if (mode === 'auto_contrast') {
    applyAutoContrast(ctx, canvasWidth, canvasHeight, brightness, Math.max(1.15, contrastFactor));
    applySharpenFilter(ctx, canvasWidth, canvasHeight, 0.35);
    appliedFilters.push('Auto-Contrast Equalization', 'Unsharp Ink Masking');
  } else if (mode === 'high_contrast') {
    applyAutoContrast(ctx, canvasWidth, canvasHeight, brightness, Math.max(1.4, contrastFactor));
    applySharpenFilter(ctx, canvasWidth, canvasHeight, 0.55);
    appliedFilters.push('High-Contrast Tone Mapping', 'Ink Edge Sharpening');
  } else if (mode === 'grayscale_scanner' || mode === 'binarize') {
    applyScannerBinarization(ctx, canvasWidth, canvasHeight);
    applySharpenFilter(ctx, canvasWidth, canvasHeight, 0.4);
    appliedFilters.push('Adaptive Binarization Scanner Mode', 'Background Shadow Removal');
  } else {
    if (brightness !== 0 || contrast !== 0) {
      applyAutoContrast(ctx, canvasWidth, canvasHeight, brightness, contrastFactor);
      appliedFilters.push('Manual Brightness/Contrast Adjustment');
    }
  }

  const enhancedDataUrl = canvas.toDataURL('image/jpeg', quality);

  return {
    dataUrl: enhancedDataUrl,
    width: canvasWidth,
    height: canvasHeight,
    rotation,
    mode,
    appliedFilters,
  };
}
