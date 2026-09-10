const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');

const normalizeUrl = (value) => {
    const url = new URL(value);
    return url.hostname.toLowerCase().replace(/^www\./, '') + url.pathname.replace(/\/+$/, '') + url.search;
};

function readCompletedCrawl(root, website) {
    if (!website || !fs.existsSync(root)) return null;
    let requested;
    try { requested = normalizeUrl(website); } catch { return null; }
    const folders = fs.readdirSync(root, { withFileTypes: true }).filter((entry) => entry.isDirectory());
    for (const entry of folders) {
        const folder = path.join(root, entry.name);
        const candidates = [folder, ...fs.readdirSync(folder, { withFileTypes: true }).filter((child) => child.isDirectory()).map((child) => path.join(folder, child.name))];
        for (const candidate of candidates) {
            try {
                const metadata = JSON.parse(fs.readFileSync(path.join(candidate, 'metadata.json'), 'utf8'));
                if (![metadata.url, metadata.finalUrl].filter(Boolean).some((url) => normalizeUrl(url) === requested)) continue;
                const checkpoint = JSON.parse(fs.readFileSync(path.join(candidate, 'crawl-checkpoint.json'), 'utf8'));
                if (!checkpoint.completedSteps?.includes('stage5_data_extraction')) continue;
                // Older crawls incorrectly excluded certificate qualifications.
                const expanded = JSON.parse(fs.readFileSync(path.join(candidate, 'program-links-expanded.json'), 'utf8'));
                const programRoot = path.join(candidate, 'programs');
                const programFolders = fs.readdirSync(programRoot);
                const missingCertificates = (expanded.programDetailUrls || []).filter((url) => /certificat/i.test(url)).some((url) => {
                    const suffix = '-' + createHash('md5').update(url).digest('hex').slice(0, 8);
                    const folder = programFolders.find((name) => name.endsWith(suffix));
                    if (!folder) return true;
                    try {
                        const record = JSON.parse(fs.readFileSync(path.join(programRoot, folder, 'structured-data.json'), 'utf8'));
                        return !record || typeof record !== 'object';
                    } catch { return true; }
                });
                if (missingCertificates) continue;
                const data = JSON.parse(fs.readFileSync(path.join(candidate, 'all-programs-structured.json'), 'utf8'));
                if (Array.isArray(data) && data.length) return data;
            } catch { /* Ignore incomplete or unreadable crawl folders. */ }
        }
    }
    return null;
}

module.exports = { readCompletedCrawl };
