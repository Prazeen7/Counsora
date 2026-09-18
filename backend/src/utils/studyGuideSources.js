function isSourceUrl(value) {
    if (typeof value !== 'string' || value.length > 2048 || !/^https?:\/\//i.test(value)) return false;
    try {
        const url = new URL(value);
        return ['http:', 'https:'].includes(url.protocol) && Boolean(url.hostname) && !url.username && !url.password;
    } catch { return false; }
}

function normalizeSources(sources) {
    if (!Array.isArray(sources) || sources.length > 20) throw new Error('Provide up to 20 sources.');
    return sources.map(source => {
        if (!source || typeof source !== 'object' || Array.isArray(source) ||
            Object.keys(source).some(key => !['title', 'url'].includes(key)) ||
            typeof source.title !== 'string' || !source.title.trim() || source.title.trim().length > 300 ||
            typeof source.url !== 'string' || !isSourceUrl(source.url.trim())) {
            throw new Error('Each source needs a title and a valid HTTP or HTTPS URL.');
        }
        return { title: source.title.trim(), url: source.url.trim() };
    });
}

module.exports = { isSourceUrl, normalizeSources };
