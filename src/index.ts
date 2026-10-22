/**
 * One Worker for every Catram static site.
 *
 * `build.js` writes each Astro site to `dist/<hostname>/`, and this handler
 * picks the directory from the request's Host header before handing the
 * request to the static-asset binding.
 */

/** Hostnames served directly, mapped to their directory under `dist/`. */
const SITES: Record<string, string> = {
    "catram.org": "catram.org",
    "ca.catram.org": "ca.catram.org",
    "ontology.catram.org": "ontology.catram.org",
};

/** Hostnames that redirect to their canonical host instead of being served. */
const ALIASES: Record<string, string> = {
    "www.catram.org": "catram.org",
};

/** Extensions the asset server does not have a useful content type for. */
const CONTENT_TYPES: Record<string, string> = {
    ".crt": "application/x-x509-ca-cert",
    ".crl": "application/pkix-crl",
};

const DEFAULT_SITE = SITES["catram.org"];
const rewrites = new Map<string, Promise<Record<string, string>>>();

function siteOf(url: URL): string | undefined {
    const hostname = url.hostname.toLowerCase();

    if (hostname in SITES) {
        return SITES[hostname];
    }

    // `wrangler dev`: reach a site as e.g. ca.catram.org.localhost:8787, and
    // fall back to the portal for a bare localhost.
    if (hostname === "localhost" || hostname === "127.0.0.1") {
        return DEFAULT_SITE;
    }

    if (!hostname.endsWith(".localhost")) {
        return undefined;
    }

    const local = hostname.slice(0, -".localhost".length);
    return local in SITES ? SITES[local] : undefined;
}

async function loadRewrites(
    site: string,
    env: Env,
    origin: string,
): Promise<Record<string, string>> {
    const cached = rewrites.get(site);
    if (cached) {
        return cached;
    }

    const promise = env.ASSETS.fetch(new URL(`/${site}/_rewrites.json`, origin))
        .then((response) =>
            response.ok ? response.json<Record<string, string>>() : {},
        )
        .catch(() => ({}));

    rewrites.set(site, promise);
    return promise;
}

function asset(
    site: string,
    path: string,
    env: Env,
    origin: string,
): Promise<Response> {
    return env.ASSETS.fetch(new URL(`${site}${path}`, origin));
}

export default {
    async fetch(request: Request, env: Env): Promise<Response> {
        const url = new URL(request.url);

        const alias = ALIASES[url.hostname.toLowerCase()];
        if (alias) {
            url.hostname = alias;
            return Response.redirect(url.toString(), 301);
        }

        const site = siteOf(url);
        if (!site) {
            return new Response("Unknown host.\n", {
                status: 404,
                headers: { "content-type": "text/plain; charset=utf-8" },
            });
        }

        // A rewrite serves another path's asset under the requested URL.
        const path =
            (await loadRewrites(site, env, url.origin))[url.pathname] ??
            url.pathname;

        let response = await asset(site, path, env, url.origin);

        if (response.status === 404) {
            const notFound = await asset(site, "/404.html", env, url.origin);
            return new Response(notFound.body, {
                status: 404,
                headers: notFound.headers,
            });
        }

        const type = CONTENT_TYPES[path.slice(path.lastIndexOf("."))];
        if (type) {
            response = new Response(response.body, response);
            response.headers.set("content-type", type);
        }

        return response;
    },
} satisfies ExportedHandler<Env>;
