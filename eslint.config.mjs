import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import json from "@eslint/json";
import markdown from "@eslint/markdown";
import { defineConfig } from "eslint/config";

export default defineConfig([
    {
        files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
        plugins: { js },
        extends: ["js/recommended"],
    },
    {
        files: ["**/*.{js,mjs,cjs,ts,mts,cts}"],
        languageOptions: { globals: globals.node },
    },
    {
        // Scripts served to the browser, not run in the Worker or in Node.
        files: ["shared/js/**/*.js"],
        languageOptions: { globals: globals.browser },
    },
    tseslint.configs.recommended,
    {
        files: ["**/*.json"],
        plugins: { json },
        language: "json/json",
        extends: ["json/recommended"],
    },
    {
        files: ["**/*.jsonc"],
        plugins: { json },
        language: "json/jsonc",
        extends: ["json/recommended"],
    },
    {
        files: ["**/*.json5"],
        plugins: { json },
        language: "json/json5",
        extends: ["json/recommended"],
    },
    {
        files: ["**/*.md"],
        plugins: { markdown },
        language: "markdown/gfm",
        extends: ["markdown/recommended"],
    },
    {
        ignores: [
            "dist/",
            // Hugo templates, which carry the suffix of what they render.
            "**/layouts/**",
            // The theme is a submodule with its own tooling.
            "themes/",
            // The pre-refactor per-site repos, kept until they are removed.
            "ca.catram.org/",
            "ontology.catram.org/",
            "www.catram.org/",
            "astro-theme/",
            "hugo-theme/",
            "package-lock.json",
            "tsconfig.json",
            "worker-configuration.d.ts",
        ],
    },
]);
