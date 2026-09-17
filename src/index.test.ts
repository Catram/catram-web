import { SELF } from "cloudflare:test";
import { describe, it, expect } from "vitest";

const get = (url: string) => SELF.fetch(url, { redirect: "manual" });

describe("site routing", () => {
    it.each([
        ["https://catram.org/", "Catram Front Page"],
        ["https://ca.catram.org/", "Catram CAs"],
        ["https://ontology.catram.org/", "Catram Ontologies"],
    ])("serves %s from its own directory", async (url, title) => {
        const res = await get(url);

        expect(res.status).toBe(200);
        expect(await res.text()).toContain(title);
    });

    it("redirects www to the apex domain", async () => {
        const res = await get("https://www.catram.org/some/page");

        expect(res.status).toBe(301);
        expect(res.headers.get("location")).toBe(
            "https://catram.org/some/page",
        );
    });

    it("answers an unknown host without serving an asset", async () => {
        const res = await get("https://example.invalid/");

        expect(res.status).toBe(404);
        expect(res.headers.get("content-type")).toBe(
            "text/plain; charset=utf-8",
        );
    });

    it.each([
        ["http://localhost:8787/", "Catram Front Page"],
        ["http://ca.catram.org.localhost:8787/", "Catram CAs"],
    ])("serves local dev host %s from its site", async (url, title) => {
        const res = await get(url);

        expect(res.status).toBe(200);
        expect(await res.text()).toContain(title);
    });

    it("does not serve a site under its directory name", async () => {
        const res = await get("https://catram.org/ca.catram.org/index.html");

        expect(res.status).toBe(404);
    });
});

describe("shared assets", () => {
    it.each([
        "https://catram.org/favicon.ico",
        "https://ca.catram.org/favicon.ico",
        "https://ontology.catram.org/apple-touch-icon-180x180.png",
        "https://ca.catram.org/js/theme-mode.js",
        "https://catram.org/manifest.json",
        "https://ontology.catram.org/robots.txt",
    ])("serves %s from the host's own root", async (url) => {
        expect((await get(url)).status).toBe(200);
    });

    it("serves a shared file identically whichever host asks", async () => {
        const [a, b] = await Promise.all([
            get("https://catram.org/manifest.json"),
            get("https://ca.catram.org/manifest.json"),
        ]);

        expect(await a.text()).toBe(await b.text());
    });

    it("does not serve a site's own file to another site", async () => {
        expect((await get("https://catram.org/tw6r9ptdo.txt")).status).toBe(
            200,
        );
        expect((await get("https://ca.catram.org/tw6r9ptdo.txt")).status).toBe(
            404,
        );
    });
});

describe("ontology rewrites", () => {
    it.each(["/recipes", "/recipes/1.0"])(
        "serves the ontology file at %s",
        async (path) => {
            const res = await get(`https://ontology.catram.org${path}`);

            expect(res.status).toBe(200);
            expect(await res.text()).toContain("<Ontology");
        },
    );
});

describe("certificate authority files", () => {
    it("labels certificates", async () => {
        const res = await get("https://ca.catram.org/ca/root_ca.crt");

        expect(res.status).toBe(200);
        expect(res.headers.get("content-type")).toBe(
            "application/x-x509-ca-cert",
        );
    });

    it("labels revocation lists", async () => {
        const res = await get("https://ca.catram.org/ca/root_ca.crl");

        expect(res.status).toBe(200);
        expect(res.headers.get("content-type")).toBe("application/pkix-crl");
    });
});

describe("not found", () => {
    it("serves the site's own 404 page", async () => {
        const res = await get("https://ca.catram.org/nope");

        expect(res.status).toBe(404);
        expect(await res.text()).toContain("Back to home");
    });
});
