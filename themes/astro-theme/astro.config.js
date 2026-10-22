import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";

const theme = fileURLToPath(new URL("./src", import.meta.url));
const repository = fileURLToPath(new URL("../..", import.meta.url));

/**
 * Creates the Astro config shared by every Catram site. The local theme is
 * exposed as `@theme` so sites do not need brittle relative imports.
 *
 * @returns {import("astro/config").AstroUserConfig}
 */
export function defineSiteConfig() {
    return defineConfig({
        vite: {
            resolve: {
                alias: { "@theme": theme },
            },
            server: {
                fs: { allow: [repository] },
            },
        },
    });
}
