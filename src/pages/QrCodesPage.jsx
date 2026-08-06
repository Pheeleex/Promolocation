import React from "react";
import { useMemo, useState } from "react";
import AppLayout from "../components/AppLayout";
import DataTable from "../components/DataTable";
import { SelectInput, TextInput } from "../components/FormControls";
import SearchBar from "../components/SearchBar";
import { useQrCodes } from "../hooks/use-promotions";

const EMPTY_FILTERS = {
  brand: "",
  promoterId: "",
  promotionCode: "",
};

const GROUP_OPTIONS = [
  { label: "Date Added", value: "dateAdded" },
  { label: "Promotion", value: "promotion" },
  { label: "Brand", value: "brand" },
  { label: "Promoter", value: "promoter" },
];

function formatDate(value) {
  if (!value) {
    return "--";
  }

  const date = new Date(String(value).replace(" ", "T"));

  if (Number.isNaN(date.getTime())) {
    return value.slice(0, 10) || "--";
  }

  return new Intl.DateTimeFormat(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function getGroupValue(record, groupBy) {
  if (groupBy === "dateAdded") {
    return formatDate(record.createdAt);
  }

  if (groupBy === "brand") {
    return record.brandName || "No brand";
  }

  if (groupBy === "promoter") {
    return record.promoterId || "No promoter";
  }

  return record.promotionName || record.promotionCode || "No promotion";
}

function getPromotionStatusClass(record) {
  if (record.promotionActive) {
    return "is-active";
  }

  if (record.promotionStatus === "draft") {
    return "is-draft";
  }

  if (record.promotionStatus === "expired") {
    return "is-expired";
  }

  return "is-inactive";
}

function sortQrCodes(records, groupBy) {
  return [...records].sort((firstRecord, secondRecord) => {
    if (groupBy === "dateAdded") {
      const firstTime = new Date(String(firstRecord.createdAt || 0).replace(" ", "T")).getTime();
      const secondTime = new Date(String(secondRecord.createdAt || 0).replace(" ", "T")).getTime();

      if (firstTime !== secondTime) {
        return secondTime - firstTime;
      }
    }

    const groupCompare = getGroupValue(firstRecord, groupBy).localeCompare(
      getGroupValue(secondRecord, groupBy),
      undefined,
      { numeric: true, sensitivity: "base" },
    );

    if (groupCompare !== 0) {
      return groupCompare;
    }

    return [
      ["promotionCode", "promotionCode"],
      ["brandName", "brandName"],
      ["promoterId", "promoterId"],
      ["code", "code"],
    ].reduce((result, [firstKey, secondKey]) => {
      if (result !== 0) {
        return result;
      }

      return String(firstRecord[firstKey] || "").localeCompare(
        String(secondRecord[secondKey] || ""),
        undefined,
        { numeric: true, sensitivity: "base" },
      );
    }, 0);
  });
}

function recordMatchesSearch(record, searchTerm) {
  const normalizedSearch = searchTerm.trim().toLowerCase();

  if (!normalizedSearch) {
    return true;
  }

  return [
    record.code,
    record.fileName,
    record.promotionCode,
    record.promotionName,
    record.promoType,
    record.promotionStatus,
    record.brandName,
    record.promoterId,
    record.promoterName,
    record.promoterEmail,
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalizedSearch));
}

export default function QrCodesPage() {
  const [draftFilters, setDraftFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [groupBy, setGroupBy] = useState("dateAdded");
  const [searchTerm, setSearchTerm] = useState("");
  const {
    data: qrCodes = [],
    error,
    isError,
    isFetching,
    isLoading,
  } = useQrCodes({
    brand: appliedFilters.brand,
    promoterId: appliedFilters.promoterId,
    promotionCode: appliedFilters.promotionCode,
  });
  const hasActiveFilters = Object.values(appliedFilters).some(Boolean);
  const visibleQrCodes = useMemo(
    () =>
      sortQrCodes(
        qrCodes.filter((record) => recordMatchesSearch(record, searchTerm)),
        groupBy,
      ),
    [groupBy, qrCodes, searchTerm],
  );

  const updateFilter = (field, value) => {
    setDraftFilters((currentFilters) => ({
      ...currentFilters,
      [field]: value,
    }));
  };

  const applyFilters = (event) => {
    event.preventDefault();
    setAppliedFilters({
      brand: draftFilters.brand.trim(),
      promoterId: draftFilters.promoterId.trim(),
      promotionCode: draftFilters.promotionCode.trim(),
    });
  };

  const clearFilters = () => {
    setDraftFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setSearchTerm("");
  };

  return (
    <AppLayout activeNav="qr-codes">
      <div className="main-card promotions-card qr-repository-card">
        <div className="card-header promotions-header qr-repository-header">
          <div>
            <p className="brands-admin-eyebrow">QR Repository</p>
            <h2>QR Codes</h2>
            <p>
              Browse uploaded QR codes across promotions, brands, and promoters.
            </p>
          </div>
          <span className="brands-admin-count">
            {visibleQrCodes.length} of {qrCodes.length} QR codes
          </span>
        </div>

        <form className="qr-repository-toolbar" onSubmit={applyFilters} noValidate>
          <SearchBar
            ariaLabel="Search QR codes"
            onChange={setSearchTerm}
            placeholder="Search QR codes"
            value={searchTerm}
          />

          <SelectInput
            id="qrRepositoryGroupBy"
            label="Order by"
            value={groupBy}
            onChange={(event) => setGroupBy(event.target.value)}
          >
            {GROUP_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </SelectInput>

          <TextInput
            id="qrRepositoryPromotionCode"
            label="Promotion Code"
            value={draftFilters.promotionCode}
            onChange={(event) => updateFilter("promotionCode", event.target.value)}
            placeholder="e.g. 598612"
          />

          <TextInput
            id="qrRepositoryBrand"
            label="Brand"
            value={draftFilters.brand}
            onChange={(event) => updateFilter("brand", event.target.value)}
            placeholder="e.g. Luckystrike"
          />

          <TextInput
            id="qrRepositoryPromoterId"
            label="Promoter ID"
            value={draftFilters.promoterId}
            onChange={(event) =>
              updateFilter("promoterId", event.target.value.toUpperCase())
            }
            placeholder="e.g. PROMO"
            maxLength={5}
          />

          <div className="qr-repository-actions">
            <button
              type="button"
              className="brand-admin-secondary-btn"
              onClick={clearFilters}
              disabled={!hasActiveFilters && !searchTerm}
            >
              Clear
            </button>
            <button
              type="submit"
              className="brand-admin-primary-btn"
              disabled={isFetching}
            >
              {isFetching ? "Applying..." : "Apply Filters"}
            </button>
          </div>
        </form>

        <DataTable
          columns={[
            {
              header: GROUP_OPTIONS.find((option) => option.value === groupBy)?.label,
              key: "group",
              render: (record) => (
                <div className="qr-repository-group-cell">
                  <strong>{getGroupValue(record, groupBy)}</strong>
                  <span>
                    {groupBy === "dateAdded"
                      ? record.updatedAt
                        ? `Updated ${formatDate(record.updatedAt)}`
                        : "Date added"
                      : record.promotionCode || record.promoType || "--"}
                  </span>
                </div>
              ),
            },
            {
              header: "QR Code",
              key: "code",
              render: (record) => (
                <div className="qr-repository-code-cell">
                  <span className="promotion-code-pill">{record.code || "--"}</span>
                  <span>{record.fileName || "No filename"}</span>
                </div>
              ),
            },
            {
              header: "Brand",
              key: "brand",
              render: (record) => record.brandName || "--",
            },
            {
              header: "Promoter",
              key: "promoter",
              render: (record) => (
                <div className="qr-repository-code-cell">
                  <strong>{record.promoterId || "--"}</strong>
                  <span>{record.promoterEmail || record.promoterName || ""}</span>
                </div>
              ),
            },
            {
              header: "Promotion",
              key: "promotion",
              render: (record) => (
                <div className="qr-repository-code-cell">
                  <strong>{record.promotionName || "--"}</strong>
                  <span>{record.promotionCode || record.promoType || ""}</span>
                </div>
              ),
            },
            {
              header: "Status",
              key: "status",
              render: (record) => (
                <span className={`promotion-status ${getPromotionStatusClass(record)}`}>
                  {record.promotionActive
                    ? "Active"
                    : record.promotionStatus || "Inactive"}
                </span>
              ),
            },
            {
              header: "File",
              key: "file",
              render: (record) =>
                record.imageUrl ? (
                  <a
                    className="promotion-brand-qr-link"
                    href={record.imageUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View QR
                  </a>
                ) : (
                  "--"
                ),
            },
            ...(groupBy === "dateAdded"
              ? []
              : [
                  {
                    header: "Date Added",
                    key: "created",
                    render: (record) => formatDate(record.createdAt),
                  },
                ]),
          ]}
          dependencies={[groupBy, searchTerm, visibleQrCodes.length]}
          emptyMessage={
            hasActiveFilters || searchTerm
              ? "No QR codes match these filters."
              : "No QR codes uploaded yet."
          }
          error={error}
          errorMessage="Unable to load QR codes right now."
          getRowKey={(record, index) => `${record.id}-${index}`}
          isError={isError}
          isLoading={isLoading}
          items={visibleQrCodes}
          loadingMessage="Loading QR codes..."
          pageSize={20}
          tableClassName="data-table qr-repository-table"
        />
      </div>
    </AppLayout>
  );
}
