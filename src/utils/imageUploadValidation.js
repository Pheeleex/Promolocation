const MAX_IMAGE_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const IMAGE_FILE_EXTENSION_PATTERN =
  /\.(avif|bmp|gif|heic|heif|ico|jpe?g|png|svg|tiff?|webp)$/i;

function buildExtensionPattern(extensions) {
  const normalizedExtensions = extensions
    .map((extension) => extension.replace(/^\./, "").trim().toLowerCase())
    .filter(Boolean);

  return new RegExp(`\\.(${normalizedExtensions.join("|")})$`, "i");
}

export function validateImageUpload(file, options = {}) {
  if (!file) {
    return null;
  }

  const {
    allowedMimeTypes,
    allowedExtensions,
    fileLabel = "Image",
  } = options;

  const hasImageMimeType =
    typeof file.type === "string" && file.type.toLowerCase().startsWith("image/");
  const defaultHasImageExtension =
    typeof file.name === "string" && IMAGE_FILE_EXTENSION_PATTERN.test(file.name);
  const normalizedMimeType = typeof file.type === "string" ? file.type.toLowerCase() : "";
  const normalizedFileName = typeof file.name === "string" ? file.name : "";
  const extensionPattern =
    Array.isArray(allowedExtensions) && allowedExtensions.length > 0
      ? buildExtensionPattern(allowedExtensions)
      : IMAGE_FILE_EXTENSION_PATTERN;
  const hasAllowedExtension = extensionPattern.test(normalizedFileName);
  const hasAllowedMimeType =
    Array.isArray(allowedMimeTypes) && allowedMimeTypes.length > 0
      ? allowedMimeTypes.some((mimeType) => mimeType.toLowerCase() === normalizedMimeType)
      : hasImageMimeType;

  if (Array.isArray(allowedMimeTypes) && allowedMimeTypes.length > 0) {
    if (!hasAllowedMimeType && !hasAllowedExtension) {
      const extensionList = allowedExtensions?.join(", ");
      return extensionList
        ? `Only ${extensionList} files are allowed for ${fileLabel.toLowerCase()}.`
        : `Only supported image files are allowed for ${fileLabel.toLowerCase()}.`;
    }
  } else if (!hasImageMimeType && !defaultHasImageExtension) {
    return "Only image files are allowed.";
  }

  if (file.size > MAX_IMAGE_FILE_SIZE_BYTES) {
    return `${fileLabel} must be 5MB or smaller.`;
  }

  return null;
}
