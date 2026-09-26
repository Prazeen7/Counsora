import Loading from '../Loading';
import { useEffect, useRef } from "react";
import { Box, Button, Typography } from "@mui/material";

export default function ProgramLoadMore({ loading, error, hasMore, loadMore, retry }) {
    const sentinel = useRef(null);
    useEffect(() => {
        if (loading || error || !hasMore || !sentinel.current) return;
        const observer = new IntersectionObserver(entries => {
            if (entries.some(entry => entry.isIntersecting)) loadMore();
        }, { rootMargin: "300px" });
        observer.observe(sentinel.current);
        return () => observer.disconnect();
    }, [loading, error, hasMore, loadMore]);
    return <Box ref={sentinel} sx={{ py: 3, textAlign: "center" }} aria-live="polite">
        {loading ? <Loading size={26} aria-label="Loading programs" /> : error ? <>
            <Typography color="error">{error}</Typography>
            <Button onClick={retry || loadMore}>Retry</Button>
        </> : hasMore ? <Button onClick={loadMore}>Load more programs</Button> : null}
    </Box>;
}
