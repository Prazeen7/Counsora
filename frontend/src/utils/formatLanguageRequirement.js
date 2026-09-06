export function formatLanguageRequirement(label, scores = []) {
    if (!scores.length) return label;

    const bands = scores.map((score) => {
        const [name, value] = score.split(":");
        return { name: name.trim().toLowerCase(), value: value?.trim() };
    });
    const completeGroup = [
        ["listening", "reading", "writing", "speaking"],
        ["literacy", "comprehension", "conversation", "production"],
    ].some((group) => group.every((name) => bands.some((band) => band.name === name)));
    const firstValue = bands[0].value;
    const allEqual = bands.every(({ value }) =>
        value !== undefined && value !== "" && Number.isFinite(Number(value)) && Number(value) === Number(firstValue)
    );

    // Only abbreviate a complete set of bands with an overall score.
    if (completeGroup && allEqual && /\s\d+(?:\.\d+)?$/.test(label)) {
        return `${label}/${firstValue}`;
    }
    return `${label} (${scores.join(", ")})`;
}
