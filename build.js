#!/usr/bin/env node
import { spawn } from "node:child_process";
import {
    access,
    cp,
    mkdir,
    readFile,
    readdir,
    rm,
    writeFile,
} from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { buildRewrites } from "./sites/ontology.catram.org/src/lib/rewrites.js";

const root = fileURLToPath(new URL(".", import.meta.url));
const astro = fileURLToPath(
    new URL("./node_modules/astro/bin/astro.mjs", import.meta.url),
);
const dist = join(root, "dist");
const sitesDirectory = join(root, "sites");

/**
 * @param {string} path
 * @returns {Promise<boolean>}
 */
async function exists(path) {
    try {
        await access(path);
        return true;
    } catch {
        return false;
    }
}

/**
 * @param {string} domain
 * @returns {Promise<void>}
 */
function build(domain) {
    return new Promise((resolve, reject) => {
        const child = spawn(
            process.execPath,
            [
                astro,
                "build",
                "--root",
                join(sitesDirectory, domain),
                "--outDir",
                join(dist, domain),
            ],
            { cwd: root, stdio: "inherit" },
        );

        child.on("error", reject);
        child.on("exit", (code, signal) => {
            if (code === 0) {
                resolve();
            } else {
                reject(
                    new Error(
                        `astro build failed for ${domain} (${code ?? signal})`,
                    ),
                );
            }
        });
    });
}

const entries = await readdir(sitesDirectory, { withFileTypes: true });
const domains = entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

if (domains.length === 0) {
    throw new Error("No sites found under sites/");
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

let built = 0;

for (const domain of domains) {
    const site = join(sitesDirectory, domain);

    if (!(await exists(join(site, "astro.config.mjs")))) {
        continue;
    }

    console.log(`==> building ${domain}`);
    await build(domain);

    const output = join(dist, domain);

    // Favicons, the web manifest and the theme script are identical for every
    // host. Each site serves them from its own root, so the Worker needs no
    // special case for them.
    await cp(join(root, "shared"), output, { recursive: true });

    if (!(await exists(join(output, "index.html")))) {
        throw new Error(`${domain} produced no index.html`);
    }

    built += 1;
}

if (built === 0) {
    throw new Error("No sites with an astro.config.mjs were found");
}

const ontology = join(dist, "ontology.catram.org");
if (await exists(ontology)) {
    const ontologies = JSON.parse(
        await readFile(
            join(
                sitesDirectory,
                "ontology.catram.org",
                "src",
                "data",
                "ontology.json",
            ),
            "utf8",
        ),
    );

    await writeFile(
        join(ontology, "_rewrites.json"),
        `${JSON.stringify(buildRewrites(ontologies), null, 2)}\n`,
    );
}
