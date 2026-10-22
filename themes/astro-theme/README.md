# Catram Astro Theme

The shared Astro theme for the Catram static sites. It lives in this repository
rather than in a submodule or a separate package.

## Layouts and components

- `src/layouts/BaseLayout.astro`: the document shell, metadata, CDN assets and
  shared page structure.
- `src/components/Navbar.astro`: the site-wide navigation, with an optional
  active item.
- `src/components/PageHeader.astro`: the title and optional lead paragraph.
- `src/components/Footer.astro`: the shared footer.
- `src/components/Favicons.astro`: the favicon and web-manifest links.
- `src/data/cdnlibs.js`: pinned CDN stylesheets and scripts.
- `src/styles/main.css`: theme styles bundled by Astro.

## Using the theme

Each site imports it through the `@theme` alias configured by
`astro.config.js`:

```astro
---
import BaseLayout from "@theme/layouts/BaseLayout.astro";
---
```
