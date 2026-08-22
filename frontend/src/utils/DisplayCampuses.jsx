export const getDisplayCampuses = (institution, programs = []) => {
    // Prefer institution-level campuses
    if (institution?.campuses?.length > 0) {
        return institution.campuses;
    }

    const campuses = [];

    const normalize = (name) =>
        name
            .trim()
            .toLowerCase()
            .replace(/\s+/g, " ");

    for (const program of programs) {
        if (!Array.isArray(program.campuses)) continue;

        for (const rawName of program.campuses) {
            if (!rawName || typeof rawName !== "string") continue;

            const name = rawName.trim();
            const normalizedName = normalize(name);

            // Check if this location is already represented
            const alreadyExists = campuses.some((campus) => {
                const existingName = normalize(campus.name);

                return (
                    existingName.includes(normalizedName) ||
                    normalizedName.includes(existingName)
                );
            });

            if (!alreadyExists) {
                campuses.push({
                    name,
                    address: "",
                    city: "",
                    contactNumber: "",
                    email: "",
                    mapEmbedUrl: `https://www.google.com/maps?q=${encodeURIComponent(
                        name
                    )}&output=embed`,
                });
            }
        }
    }

    return campuses;
};