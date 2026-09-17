#!/bin/sh
# Builds every site under sites/ into dist/<domain>/, the asset root the
# Worker serves from. Each directory name is the hostname it is served on.
set -eu

root=$(cd "$(dirname "$0")" && pwd)

# Keep Hugo's cache inside the project so CI and sandboxed builds do not
# depend on a writable home directory.
export HUGO_CACHEDIR="${HUGO_CACHEDIR:-$root/.hugo_cache}"
rm -rf "$root/dist"

for site in "$root"/sites/*/; do
  domain=$(basename "$site")
  echo "==> building $domain"
  hugo \
    --source "$site" \
    --themesDir "$root/themes" \
    --destination "$root/dist/$domain" \
    --gc --minify --cleanDestinationDir

  # Favicons, the web manifest and the theme script are the same for every
  # host and are kept once, in shared/. Every site serves them from its own
  # root, so the Worker needs no special case for them.
  cp -R "$root/shared/." "$root/dist/$domain/"

  # wrangler deploys whatever is in dist/, so fail here rather than ship a
  # site that silently built nothing.
  if [ ! -s "$root/dist/$domain/index.html" ]; then
    echo "error: $domain produced no index.html" >&2
    exit 1
  fi
done
