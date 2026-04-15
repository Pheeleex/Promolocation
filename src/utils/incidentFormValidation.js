function formatFieldLabels(fieldLabels) {
  if (!fieldLabels.length) {
    return "";
  }

  if (fieldLabels.length === 1) {
    return fieldLabels[0];
  }

  if (fieldLabels.length === 2) {
    return `${fieldLabels[0]} and ${fieldLabels[1]}`;
  }

  return `${fieldLabels.slice(0, -1).join(", ")}, and ${fieldLabels[fieldLabels.length - 1]}`;
}

export function getMissingIncidentFieldLabels({
  title,
  description,
  image,
  imageRequired = false,
}) {
  const missingFields = [];

  if (!title?.trim()) {
    missingFields.push("Incident Title");
  }

  if (!description?.trim()) {
    missingFields.push("Detailed Description");
  }

  if (imageRequired && !image) {
    missingFields.push("Proof / Image");
  }

  return missingFields;
}

export function getMissingIncidentFieldsAlertConfig(fieldLabels) {
  if (!fieldLabels.length) {
    return null;
  }

  if (fieldLabels.length === 1) {
    return {
      title: `Missing ${fieldLabels[0]}`,
      text: `Please provide ${fieldLabels[0].toLowerCase()}.`,
    };
  }

  return {
    title: "Missing Information",
    text: `Please provide ${formatFieldLabels(fieldLabels)}.`,
  };
}
