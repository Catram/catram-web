# Catram Web

Every Catram static site, built with Hugo and served from a single Cloudflare
Worker that picks the site from the request's `Host` header.

## Layout

```text
sites/<hostname>/    one Hugo site per hostname (content, layouts, data, static)
themes/hugo-theme/   the shared Hugo theme, a submodule of Catram/hugo-theme
src/index.ts         the Worker: Host -> site directory, rewrites, 404s
build.sh             builds every site into dist/<hostname>/
```

`dist/` is the Worker's asset root: each site lands in a directory named after
the hostname it is served on, and the Worker prefixes every request path with
that directory before handing it to the `ASSETS` binding. Nothing is served
from the bare `/<hostname>/...` paths, because the Worker runs first.

## Hosts

| Host                  | Served from                 |
| --------------------- | --------------------------- |
| `catram.org`          | `sites/catram.org`          |
| `www.catram.org`      | 301 to `catram.org`         |
| `ca.catram.org`       | `sites/ca.catram.org`       |
| `ontology.catram.org` | `sites/ontology.catram.org` |

Under `wrangler dev`, a bare `localhost` serves the portal and any site is
reachable at `<hostname>.localhost:8787`, e.g. `ca.catram.org.localhost:8787`.

## Commands

```sh
npm run cf-typegen  # regenerate worker-configuration.d.ts from wrangler.toml
npm run build       # build every site into dist/
npm test            # build, then run the Worker tests
npm run dev         # build, then wrangler dev
npm run deploy      # build, then wrangler deploy
npx eslint .        # lint
npx tsc --noEmit    # type check
```

The theme is a git submodule, so a fresh clone needs it first:

```sh
git clone --recurse-submodules <this repo>
# or, in an existing clone
git submodule update --init
```

npm blocks dependency install scripts by default, and `workerd`, `esbuild`
and `sharp` all need theirs to unpack a native binary, so `package.json`
carries name-only `allowScripts` entries for them. Keep them unpinned:
`pkg@version` entries go stale on the next Dependabot bump, and the install
then skips the script with only a warning.

Hugo (extended) must be on `PATH`. Run `npm run cf-typegen` after changing
`wrangler.toml`, and commit the regenerated `worker-configuration.d.ts`.

CI installs Hugo with `peaceiris/actions-hugo` and runs `npm run build` in
both the test and the deploy job, because `wrangler deploy` ships whatever
`dist/` holds. `build.sh` fails if a site renders no `index.html`, so an
empty build cannot reach production.

`Catram/hugo-theme` is private, so both checkout steps pass
`submodules: recursive` together with an `HUGO_THEME_SSH_KEY` secret — a
deploy key for the theme repo. Without it the checkout cannot fetch the
theme and every build fails.

## Adding a site

1. Create `sites/<hostname>/` with a `hugo.toml` that sets
   `theme = "hugo-theme"` and its own `baseURL`.
2. Add the hostname to `SITES` in `src/index.ts` and to `routes` in
   `wrangler.jsonc`.

## Path rewrites

A site can serve one path's content under another — what the `200` rules in a
Cloudflare Pages `_redirects` file used to do — by emitting a `_rewrites.json`
map of source path to target path at its root. `sites/ontology.catram.org`
generates one from `data/ontology.yaml`, so `/recipes` and `/recipes/1.0`
serve the ontology XML directly. The Worker loads the map once per isolate.
