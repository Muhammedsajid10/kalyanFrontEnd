# Recent Changes — Frontend

**Date:** 2026-04-28  
**Feature:** Server-Side Pagination across all catalog and inventory pages

---

## Overview

All major data listing pages have been migrated from **client-side filtering** to **server-side pagination**. The frontend now sends `?page=X&limit=10&search=Y` query parameters to the backend and renders only the current page of results. This significantly improves performance as the dataset grows.

---

## Pages Updated

### 1. `src/pages/Products.jsx`
- **Removed:** Client-side `.filter()` and `.slice()` operations.
- **Added:** `fetchProducts(page, search)` — calls `GET /product/all?page=X&limit=10&search=Y`.
- **Added:** Debounced search input (400ms via `useRef`) — resets to page 1 on new search.
- **Added:** Full numbered pagination bar UI (Prev / 1 2 … 5 / Next) with "Showing X–Y of Z products".
- **Added:** Smart delete — if last item on page is deleted, moves back to previous page.
- **Changed:** `fetchCategories` replaced with `GET /category/all?page=1&limit=1000` to load **all** categories for the Add/Edit form dropdown.
- **Added:** Custom lazy-loading category dropdown (replaced native `<select>`):
  - Fixed height trigger (max 50px)
  - Scrollable list (max-height 200px)
  - Search box with 400ms debounce
  - Loads 20 categories per page, fetches next page on scroll near bottom
  - Stale-closure fix: `catPageRef`, `catHasMoreRef`, `catLoadingRef`, `catSearchRef` used inside scroll handler

### 2. `src/pages/Products.css`
- **Added:** Pagination bar styles (`.pagination-bar`, `.pagination-controls`, `.page-btn`, `.page-btn.active`, `.page-ellipsis`, `.pagination-info`).
- **Added:** Custom category dropdown styles (`.cat-dropdown`, `.cat-trigger`, `.cat-list-wrapper`, `.cat-search-box`, `.cat-list`, `.cat-option`, `.cat-loading-more`).

---

### 3. `src/pages/Categories.jsx`
- **Full rewrite** — same server-side pagination pattern as Products.
- Calls `GET /category/all?page=X&limit=10&search=Y`.
- Returns `{ category, total, totalPages }` from backend.
- Debounced search (400ms), pagination bar, smart page-back on delete.

---

### 4. `src/pages/StocksReport.jsx`
- **Changed:** Upgraded existing basic Prev/Next buttons to the full numbered pagination bar.
- **Added:** `totalCount` state — used for "Showing X–Y of N records" label.
- **Fixed:** Page now resets to 1 when search or filter (type / franchise) changes.
- **Fixed:** Separated filter `useEffect` from page `useEffect` to avoid double-fetching.

---

### 5. `src/pages/SubProducts.jsx`
- **Removed:** Single `fetchData()` that fetched all sub-products at once.
- **Added:** `fetchItems(page, search)` — calls `GET /subproduct/all?page=X&limit=10&search=Y`.
- **Added:** `fetchStatic()` — loads products (`limit=1000`) and franchises once on mount for form dropdowns.
- **Added:** Debounced search, pagination bar, smart page-back on delete.

---

### 6. `src/pages/StockManagement.jsx`
- **Removed:** Client-side `filteredItems` array.
- **Added:** `fetchItems(page, search)` — calls `GET /subproduct/all?page=X&limit=10&search=Y`.
- **Added:** Debounced search, pagination bar.
- **Changed:** After Stock In / Stock Out success → refreshes current page instead of all data.

### 6. `src/pages/StockManagement.css`
- **Added:** `@import './Products.css'` — inherits all shared pagination and table styles.

---

## Shared Pagination UI Pattern

All pages use the same pagination bar structure:

```
Showing 1–10 of 87 items       [‹] [1] [2] [3] […] [9] [›]
```

- Page numbers dynamically generated with ellipsis for large page counts
- Active page highlighted
- Prev/Next buttons disabled at boundaries
- Pagination bar hidden when 0 results

---

## Key Technical Decisions

| Decision | Reason |
|---|---|
| `useRef` for debounce timer | Avoids re-renders on timer change |
| `useRef` for cat scroll state (`catPageRef`, etc.) | Fixes stale closure bug in `onScroll` handler |
| `limit=1000` for dropdown fetches | Form dropdowns need all options; paginated data would truncate them |
| Page resets to 1 on search/filter change | Prevents landing on a non-existent page after narrowing results |
