# Architecture rules

- Normalize legacy combined delivery text in a browser-safe order details helper so saved web orders display separate map, payment and comment fields without rewriting historical records.
- Preserve the existing standalone React/Vite application and its routing; archive revisions must not migrate frameworks.
- Keep shared pagination and cart arithmetic in browser-safe helpers so both public lists and quantity updates follow the same rules.
- Read public promotions through the existing API, report query failures, and notify open tabs after successful promotion mutations so the public view does not silently remain stale.
- Keep storefront hours in one shared provider backed by the public hours API, save events and short polling so all shopping surfaces and the footer agree across tabs and devices.
- Validate working hours again in the existing order API before writing orders so a stale or bypassed browser cannot place a closed-hours order.
- Use shared visual loading indicators with accessible labels instead of visible loading text across public and admin states.

- Keep appearance in one app-wide provider keyed by authenticated user; mirror the resolved theme to profile rows and retain system mode in user metadata so admin and storefront never compete for document theme.

- Resolve visible cart rows through the shared helper; never remove stored cart rows merely because the menu is loading or failed to load, and ignore obsolete user-load results.

- Persist POS sale names, timestamps, duration and item snapshots through the existing admin-verified API and a service-only transactional SQL function; the browser never writes sales directly.
- Keep sale date and duration formatting in one browser-safe helper shared by history and receipts.
- Treat supabase/setup.sql as the canonical rerunnable POS schema; preserve historical sales while adding fields and synchronize deployment instructions with API changes.

- Validate all POS quantity changes against the latest Redux product stock through a shared browser-safe helper; keep warning side effects outside reducers and recheck before completing a sale.
- Keep receipt print rules scoped to the receipt and use real optional seller/contact fields only; never infer customer details from a reference photo.

- Keep the products category filter in URL search parameters while preserving unrelated parameters so shared links and refresh retain the selected category.
- Share sale-product eligibility through the stock helper so the picker excludes unavailable or depleted products without altering historical receipt snapshots.
- Keep receipt item cells on one line with bounded overflow and show units beside unit prices so narrow thermal paper never wraps item rows.
