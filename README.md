# Catram Web

Static sites for Catram, generated with [Astro](https://astro.build/) and
served by a single Cloudflare Worker. Astro 7 requires Node.js 22.23.4 or
newer.

Each hostname is its own small Astro project under `sites/`. They share the
local theme in `themes/astro-theme/`, which replaces the old Hugo theme
submodule.

## Layout

```text
build.js                     build every site into dist/<hostname>/
sites/<hostname>/            one Astro project per hostname
  astro.config.mjs           uses the shared theme alias
  public/                    files served from the host's root
  src/data/                  JSON data used by the page
  src/pages/                 index.astro and 404.astro
  src/site.js                site title, description and author
themes/astro-theme/          shared layouts, components, CSS and CDN data
shared/                      favicons, manifest, robots.txt and theme-mode.js
src/index.ts                 Worker that maps Host to dist/<hostname>/
```

## Commands

```sh
npm install
npm run build
npm test
npm run dev
```

- `npm run build` builds every site into `dist/`.
- `npm test` runs the Worker tests against the built `dist/`, so build first.
- `npm run dev` serves `dist/` through `wrangler dev`.

Astro's dev server can run one site at a time:

```sh
npm run dev:catram
npm run dev:ca
npm run dev:ontology
```

## Adding a site

1. Create `sites/<hostname>/` with an `astro.config.mjs` that returns
   `defineSiteConfig()` from the shared theme.
2. Add `src/site.js` and `src/pages/index.astro`.
3. Add a `404.astro` page using the theme's `BaseLayout` and `NotFound`
   component.
4. Add the hostname to `SITES` in `src/index.ts` and to the routes in
   `wrangler.toml`.

`build.js` discovers every directory under `sites/` that has an
`astro.config.mjs`, so no central site list needs updating for the build.

## Shared assets

`shared/` is copied into every generated site root after Astro builds it.
That keeps favicons, the manifest, `robots.txt`, and `js/theme-mode.js`
identical across hosts while the Worker serves them from each host's own root.

## Deployment

`npm run build` writes `dist/<hostname>/`. `wrangler.toml` points the asset
binding at `dist/`, and the Worker selects the directory from the request's
`Host` header before serving the asset.
