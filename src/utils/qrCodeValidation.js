import jsQR from "jsqr";
import { validateImageUpload } from "./imageUploadValidation";

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const imageUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(imageUrl);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error("Unable to load the selected image."));
    };

    image.src = imageUrl;
  });
}

function drawImageToCanvas(image) {
  const width = image.naturalWidth || image.width;
  const height = image.naturalHeight || image.height;
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d", { willReadFrequently: true });

  if (!context || !width || !height) {
    throw new Error("Unable to prepare the selected image for QR validation.");
  }

  canvas.width = width;
  canvas.height = height;
  context.drawImage(image, 0, 0, width, height);

  return context.getImageData(0, 0, width, height);
}

export async function validateQrCodeImageUpload(file, options = {}) {
  const {
    fileLabel = "Image",
    allowedMimeTypes,
    allowedExtensions,
  } = options;

  const imageValidationMessage = validateImageUpload(file, {
    fileLabel,
    allowedMimeTypes,
    allowedExtensions,
  });

  if (imageValidationMessage) {
    return {
      error: imageValidationMessage,
      rawValue: "",
    };
  }

  try {
    const image = await loadImageFromFile(file);
    const imageData = drawImageToCanvas(image);
    const result = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "attemptBoth",
    });

    if (!result?.data) {
      return {
        error: `${fileLabel} must contain a readable QR code.`,
        rawValue: "",
      };
    }

    return {
      error: "",
      rawValue: result.data,
    };
  } catch {
    return {
      error: `We couldn't read that ${fileLabel.toLowerCase()} as a QR code image. Please upload a clear JPG, PNG, or SVG QR code.`,
      rawValue: "",
    };
  }
}
