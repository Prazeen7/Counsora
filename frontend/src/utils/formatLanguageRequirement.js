export function hasLanguageScore(score) {
    return ["overall", "minimum_band", "listening", "reading", "writing", "speaking", "literacy", "comprehension", "conversation", "production"]
        .some((key) => score?.[key] !== undefined && score[key] !== null && score[key] !== "");
}

export function formatLanguageRequirement(label, scores = []) {
    if (!scores.length) return label;

    const bands = scores.map((score) => {
        const [name, value] = score.split(":");
        return { name: name.trim().toLowerCase(), value: value?.trim() };
    });
    const minimum = bands.find((band) => band.name === "minimum" && band.value !== undefined && band.value !== "");
    if (minimum) return `${label} (Minimum: ${minimum.value})`;
    const completeGroup = [
        ["listening", "reading", "writing", "speaking"],
        ["literacy", "comprehension", "conversation", "production"],
    ].some((group) => group.every((name) => bands.some((band) => band.name === name)));
    const firstValue = bands[0].value;
    const allEqual = bands.every(({ value }) =>
        value !== undefined && value !== "" && Number.isFinite(Number(value)) && Number(value) === Number(firstValue)
    );

    if (completeGroup && allEqual) {
        return `${label} (Minimum: ${firstValue})`;
    }
    return `${label} (${scores.join(", ")})`;
}
