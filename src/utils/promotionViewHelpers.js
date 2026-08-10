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
    if (promotion.status === "scheduled") {
      return { label: "Scheduled", className: "is-scheduled" };
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

function parsePromotionDate(value) {
  if (!value) {
    return null;
  }

  const date = new Date(`${value}T00:00:00`);

  return Number.isNaN(date.getTime()) ? null : date;
}

function getPromotionWindow(promotion) {
  return {
    endDate: parsePromotionDate(promotion?.endDate),
    startDate: parsePromotionDate(promotion?.startDate),
  };
}

export function promotionWindowsOverlap(firstPromotion, secondPromotion) {
  const firstWindow = getPromotionWindow(firstPromotion);
  const secondWindow = getPromotionWindow(secondPromotion);

  if (
    !firstWindow.startDate ||
    !firstWindow.endDate ||
    !secondWindow.startDate ||
    !secondWindow.endDate
  ) {
    return false;
  }

  return (
    firstWindow.startDate <= secondWindow.endDate &&
    firstWindow.endDate >= secondWindow.startDate
  );
}

export function canPromotionReserveActiveWindow(promotion) {
  const status = String(promotion?.status || "").toLowerCase();

  return status === "active" || status === "scheduled";
}

export function findPromotionScheduleConflict(
  targetPromotion,
  promotions = [],
) {
  if (!canPromotionReserveActiveWindow(targetPromotion)) {
    return null;
  }

  return (
    promotions.find((promotion) => {
      if (hasSamePromotionId(promotion.id, targetPromotion.id)) {
        return false;
      }

      return (
        canPromotionReserveActiveWindow(promotion) &&
        promotionWindowsOverlap(targetPromotion, promotion)
      );
    }) || null
  );
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
