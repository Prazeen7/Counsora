import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

// Keep old requests from overwriting a newer search or page selection.
export default function useAdminList(endpoint, query, revision) {
    const requestKey = `${endpoint}?${query}#${revision}`;
    const [result, setResult] = useState(null);
    useEffect(() => {
        const controller = new AbortController();
        apiRequest(`${endpoint}?${query}`, { signal: controller.signal })
            .then(data => {
                const rows = endpoint === "/country/all" ? data?.countries : data?.users;
                if (!Array.isArray(rows) || !Number.isInteger(data?.total)) {
                    throw new Error("The server returned an outdated list format. Restart the backend to load the latest pagination and search changes, then retry.");
                }
                if (!controller.signal.aborted) setResult({ requestKey, data });
            })
            .catch(error => { if (!controller.signal.aborted) setResult({ requestKey, error: error.message }); });
        return () => controller.abort();
    }, [endpoint, query, requestKey]);
    const current = result?.requestKey === requestKey;
    return { data: current ? result.data : null, loading: !current, error: current ? result.error : "" };
}
