export function assetPath(relativePath) {
  if (/^(?:https?:)?\/\//i.test(relativePath) || /^data:|^blob:/i.test(relativePath)) {
    return relativePath;
  }

  const cleanPath = relativePath.replace(/^\/+/, "");

  return `${import.meta.env.BASE_URL}${cleanPath}`;
}
