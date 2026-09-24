import { useCallback, useEffect, useRef, useState } from "react";
import { getProgramsByInstitution } from "../services/programService";

const PAGE_SIZE = 12;

export default function useInstitutionPrograms(institutionId, filters, includeInactive = false) {
    const [pageState, setPageState] = useState(null);
    const [summaryState, setSummaryState] = useState(null);
    const [revision, setRevision] = useState(0);
    const [summaryRevision, setSummaryRevision] = useState(0);
    const request = useRef(null);
    const queryKey = JSON.stringify(filters);
    const summaryKey = JSON.stringify([institutionId, includeInactive, revision]);
    const pageKey = JSON.stringify([summaryKey, queryKey]);
    // Key results by request so old cards disappear immediately when filters change.
    const page = pageState?.key === pageKey ? pageState : {
        programs: [], pagination: { total: 0, hasMore: false }, loading: true, error: "",
    };
    const summary = summaryState?.key === summaryKey ? summaryState.data : null;
    const summaryError = summaryState?.key === summaryKey ? summaryState.error : "";
    const reload = useCallback(() => setRevision(value => value + 1), []);
    const updateProgram = useCallback(updatedProgram => {
        setPageState(previous => previous?.key === pageKey ? {
            ...previous,
            programs: previous.programs.map(program => program._id === updatedProgram._id
                ? { ...program, ...updatedProgram } : program),
        } : previous);
        // Refresh counts and institution metadata without resetting loaded pages.
        setSummaryRevision(value => value + 1);
    }, [pageKey]);
    const removeProgram = useCallback(programId => {
        const state = request.current;
        if (state?.key !== pageKey || pageState?.key !== pageKey) return;
        if (!pageState.programs.some(program => program._id === programId)) return;
        // Cancel an overlapping load so a stale response cannot restore the deleted card.
        state.controller.abort();
        request.current = { ...state, controller: new AbortController(), busy: false,
            offset: Math.max(0, state.offset - 1) };
        setPageState(previous => previous?.key === pageKey ? {
            ...previous,
            loading: false,
            programs: previous.programs.filter(program => program._id !== programId),
            pagination: { ...previous.pagination, total: Math.max(0, previous.pagination.total - 1) },
        } : previous);
        setSummaryRevision(value => value + 1);
    }, [pageKey, pageState]);

    useEffect(() => {
        const controller = new AbortController();
        if (institutionId) getProgramsByInstitution(institutionId, { includeInactive, summary: true, signal: controller.signal })
            .then(data => { if (!controller.signal.aborted) setSummaryState({ key: summaryKey, data, error: "" }); }).catch(err => {
                if (!controller.signal.aborted) setSummaryState(previous => ({ key: summaryKey,
                    data: previous?.key === summaryKey ? previous.data : null,
                    error: err.message || "Could not load program details." }));
            });
        return () => controller.abort();
    }, [institutionId, includeInactive, summaryKey, summaryRevision]);

    const fetchPage = useCallback(async (state) => {
        if (state.busy || state.controller.signal.aborted) return;
        state.busy = true;
        setPageState(previous => ({
            ...(previous?.key === pageKey ? previous : { programs: [], pagination: { total: 0, hasMore: false } }),
            key: pageKey, loading: true, error: "",
        }));
        try {
            const data = await getProgramsByInstitution(institutionId, {
                ...JSON.parse(queryKey), includeInactive,
                limit: PAGE_SIZE, offset: state.offset, signal: state.controller.signal,
            });
            if (request.current !== state || state.controller.signal.aborted) return;
            const firstPage = state.offset === 0;
            setPageState(previous => ({ key: pageKey, loading: false, error: "", pagination: data.pagination,
                programs: firstPage ? data.programs : [
                    ...previous.programs, ...data.programs.filter(program => !previous.programs.some(item => item._id === program._id)),
                ],
            }));
            state.offset += data.programs.length;
            state.hasMore = data.pagination.hasMore;
        } catch (err) {
            if (!state.controller.signal.aborted && request.current === state) setPageState(previous => ({
                ...previous, loading: false, error: err.message || "Could not load programs.",
            }));
        } finally {
            state.busy = false;
        }
    }, [institutionId, includeInactive, queryKey, pageKey]);

    useEffect(() => {
        const state = { key: pageKey, controller: new AbortController(), offset: 0, busy: false, hasMore: true };
        request.current = state;
        // Debounce search and filter changes; abort superseded requests.
        const timer = setTimeout(() => { if (institutionId) fetchPage(state); }, 250);
        return () => {
            clearTimeout(timer);
            state.controller.abort();
            if (request.current?.key === state.key) request.current.controller.abort();
        };
    }, [institutionId, fetchPage, pageKey]);

    const loadMore = useCallback(() => {
        if (request.current?.hasMore) fetchPage(request.current);
    }, [fetchPage]);

    return { ...page, summary, error: page.error || summaryError,
        summaryError, loadMore, reload, updateProgram, removeProgram, retry: summaryError ? reload : loadMore };
}
