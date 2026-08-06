export function formatDate(value) {
  if (!value) {
    return "--";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function getPromotionState(promotion) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startDate = promotion.startDate
    ? new Date(`${promotion.startDate}T00:00:00`)
    : null;
  const endDate = promotion.endDate
    ? new Date(`${promotion.endDate}T00:00:00`)
    : null;

  if (!promotion.isActive) {
    if (promotion.status === "draft") {
      return { label: "Draft", className: "is-draft" };
    }

    if (promotion.status === "expired") {
      return { label: "Expired", className: "is-expired" };
    }

    return { label: "Inactive", className: "is-inactive" };
  }

  if (startDate && today < startDate) {
    return { label: "Scheduled", className: "is-scheduled" };
  }

  if (endDate && today > endDate) {
    return { label: "Expired", className: "is-expired" };
  }

  return { label: "Active", className: "is-active" };
}

export function canManagePromotion(promotion) {
  const state = getPromotionState(promotion);

  return state.label === "Active" || state.label === "Scheduled";
}

export function isCurrentlyActivePromotion(promotion) {
  return getPromotionState(promotion).label === "Active";
}

export function getPromotionCode(promotion) {
  return promotion?.promotionCode || String(promotion?.id || "");
}

export function hasSamePromotionId(firstId, secondId) {
  return String(firstId) === String(secondId);
}

export function getPromotionSortTime(promotion) {
  const timestamp = promotion.updatedAt || promotion.createdAt || "";
  const parsedTime = new Date(timestamp.replace(" ", "T")).getTime();

  return Number.isNaN(parsedTime) ? 0 : parsedTime;
}

export function sortPromotions(promotions) {
  return [...promotions].sort((firstPromotion, secondPromotion) => {
    if (firstPromotion.isActive !== secondPromotion.isActive) {
      return firstPromotion.isActive ? -1 : 1;
    }

    return getPromotionSortTime(secondPromotion) -
      getPromotionSortTime(firstPromotion);
  });
}
