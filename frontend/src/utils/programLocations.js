const clean = value => typeof value === "string" && !/^(n\/a|unknown|not specified)$/i.test(value.trim()) ? value.trim() : "";

export function resolveProgramLocations(program, institution) {
    const unique = values => [...new Map(values.filter(Boolean).map(value => [value.toLowerCase(), value])).values()];
    const campuses = Array.isArray(program?.campuses) ? program.campuses : [program?.campuses];
    const specific = unique(campuses.map(clean));
    if (specific.length) return specific;
    return unique((institution?.campuses || []).map(campus => typeof campus === "string"
        ? clean(campus) : clean(campus?.city) || clean(campus?.name) || clean(campus?.address)));
}
