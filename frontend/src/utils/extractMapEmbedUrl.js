export function extractMapEmbedUrl(value) {
    const text = value.trim();
    if (!/<iframe\b/i.test(text)) return text;
    const iframe = text.match(/<iframe\b[^>]*>/i)?.[0];
    const source = iframe?.match(/\s+src\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const url = (source?.[1] ?? source?.[2] ?? source?.[3] ?? "").replace(/&amp;/gi, "&");
    return /^https:\/\//i.test(url) ? url : "";
}
