const fs = require('fs');
const path = require('path');

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
                const data = JSON.parse(fs.readFileSync(path.join(candidate, 'all-programs-structured.json'), 'utf8'));
                if (Array.isArray(data) && data.length) return data;
            } catch { /* Ignore incomplete or unreadable crawl folders. */ }
        }
    }
    return null;
}

module.exports = { readCompletedCrawl };
