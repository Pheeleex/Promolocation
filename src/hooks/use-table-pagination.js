import { useEffect, useMemo, useState } from "react";

export const DEFAULT_TABLE_PAGE_SIZE = 10;

export function useTablePagination(items, dependencies = [], pageSize = DEFAULT_TABLE_PAGE_SIZE) {
  const [currentPage, setCurrentPage] = useState(0);
  const itemCount = items.length;
  const totalPages = Math.max(1, Math.ceil(itemCount / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages - 1);

  const paginatedItems = useMemo(
    () =>
      items.slice(
        safeCurrentPage * pageSize,
        safeCurrentPage * pageSize + pageSize,
      ),
    [items, pageSize, safeCurrentPage],
  );

  useEffect(() => {
    setCurrentPage(0);
  }, dependencies);

  useEffect(() => {
    if (safeCurrentPage !== currentPage) {
      setCurrentPage(safeCurrentPage);
    }
  }, [currentPage, safeCurrentPage]);

  return {
    currentPage: safeCurrentPage,
    paginatedItems,
    pageSize,
    setCurrentPage,
    totalPages,
  };
}
