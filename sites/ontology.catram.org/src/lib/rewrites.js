/**
 * @param {{ id: string, versions: Array<{ version: string, file: string }>, latest_version: string }} ontology
 * @returns {{ version: string, file: string }}
 */
export function latestVersion(ontology) {
    const latest = ontology.versions.find(
        (version) => version.version === ontology.latest_version,
    );

    if (!latest) {
        throw new Error(
            `ontology ${ontology.id}: latest_version ` +
                `${ontology.latest_version} is not listed in versions`,
        );
    }

    return latest;
}

/**
 * Builds the source-to-asset map the Worker applies for ontology aliases.
 *
 * @param {Array<{
 *   id: string,
 *   versions: Array<{ version: string, file: string }>,
 *   latest_version: string,
 * }>} ontologies
 * @returns {Record<string, string>}
 */
export function buildRewrites(ontologies) {
    const rewrites = {};

    for (const ontology of ontologies) {
        for (const version of ontology.versions) {
            rewrites[`/${ontology.id}/${version.version}`] =
                `/${version.file}`;
        }

        const latest = latestVersion(ontology);
        rewrites[`/${ontology.id}`] = `/${latest.file}`;
    }

    return rewrites;
}
