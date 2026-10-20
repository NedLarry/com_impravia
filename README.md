# Impravia website

React + TypeScript, built with Vite. Only Node.js is required.

## Run it

```bash
npm install          # first time only
npm run dev          # site at http://localhost:5173, admin at http://localhost:5173/admin/
npm run build        # production files in dist/, ready to upload to any static host
npm run preview      # serve the built dist/ locally to check it
```

## Adding products and subsidiaries

Each entry is its own folder:

```
content/
  products/
    e-loans/
      product.json      ← the details
      screenshot.jpg    ← optional; 1440 × 900 works best
  subsidiaries/
    diadem-consults/
      subsidiary.json
      screenshot.jpg
```

The folder name is the entry's link name (e.g. `/#products/e-loans`).

There are two ways to add or edit an entry; both check your input and save
into this structure:

1. **Admin page** — run `npm run dev` and open **/admin/**. Add, edit,
   reorder and delete entries; capture a screenshot straight from the
   website address or upload one. Saving updates the site immediately.
   The admin page only exists while `npm run dev` is running and is never
   part of the built site.
2. **Terminal** — `npm run add` (or `npm run add product` /
   `npm run add subsidiary`) asks for each field in turn and can capture the
   screenshot too.

Screenshot capture uses a headless browser. If it reports a missing browser,
run `npx playwright install chromium` once.

### Rules and checks

The fields, which are required and their length limits are defined once in
`src/content/schema.ts`. Every entry is checked against it:

- when saving from the admin page or `npm run add`,
- by `npm run content:check`, at any time,
- by `npm run build`, which **stops** if any entry is invalid and lists
  exactly what to fix. It also warns about links to `localhost`, which only
  work on your own computer.

To add a new field (say, "launch date"), add it to the schema in
`src/content/schema.ts`, to the form in `src/content/fields.ts`, and show it
in `src/components/Products.tsx` or `Subsidiaries.tsx`.

## Where everything else lives

| To change…                        | Edit                                   |
| --------------------------------- | -------------------------------------- |
| Page text and section headings    | `src/content/site.ts`                  |
| Company details, email, motto     | `src/content/brand.ts`                 |
| The logo                          | replace files in `public/brand/` (same names), or repoint paths in `src/content/brand.ts` |
| Colours, fonts, spacing           | tokens at the top of `src/styles/global.css` |
| A section's layout                | `src/components/<Section>.tsx`         |
| Section order / add or remove one | `src/App.tsx`                          |

The Approach section explains the current Penrose-triangle mark. If the logo
changes, rewrite its copy in `site.ts` or remove `<Approach />` from `App.tsx`.

## Contact form

There is no backend yet. Submitting opens the visitor's email app with the
enquiry filled in. Replace `submitEnquiry()` in `src/components/Contact.tsx`
with a real endpoint when one is chosen.
