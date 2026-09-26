import Loading from '../../components/Loading';
import { useEffect, useState } from "react";
import { Alert, Dialog, DialogTitle, DialogContent, DialogActions, Accordion, AccordionDetails, AccordionSummary, Box, Button, Container, Divider, Paper, Stack, Tab, Tabs, Typography, useMediaQuery, useTheme } from "@mui/material";
import { ArrowBack, ArrowForward, ExpandMore, OpenInNew } from "@mui/icons-material";
import { useCountry } from '../../context/CountryContext';
import { getStudyGuides, deleteStudyGuide } from '../../services/studyGuideService';
import StudyGuideEditor from '../../components/admin/StudyGuideEditor';

function GuideText({ text }) {
  return String(text || '').split(/\n\s*\n/).filter(Boolean).map((paragraph, index) => {
    const lines = paragraph.split('\n');
    return lines.every(line => line.startsWith('- '))
      ? <Box component="ul" key={index} sx={{ pl: 2.5, my: 1.5, '& li': { mb: 1.25, pl: 0.5 }, '& li::marker': { color: 'primary.main' } }}>{lines.map((line, i) => <li key={i}><Typography sx={{ lineHeight: 1.75, fontWeight: 400 }}>{line.slice(2)}</Typography></li>)}</Box>
      : <Typography key={index} sx={{ mb: 2, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', lineHeight: 1.75 }}>{paragraph}</Typography>;
  });
}

export default function StudyGuide({ isAdmin = false }) {
  const { selectedCountry } = useCountry();
  if (!selectedCountry) return <Container sx={{ py: 4 }}><Alert severity="info">Select a country from the navigation menu to view its study guide.</Alert></Container>;
  return <GuideContent key={selectedCountry._id} country={selectedCountry} isAdmin={isAdmin} />;
}

const Detail = ({ title, children }) => <Accordion disableGutters elevation={0} sx={{ my: 2, border: '1px solid', borderColor: 'divider', borderRadius: '12px !important', '&:before': { display: 'none' } }}>
  <AccordionSummary expandIcon={<ExpandMore />}><Typography component="h3" sx={{ fontSize: '1.1rem', fontWeight: 400, color: 'text.primary' }}>{title}</Typography></AccordionSummary>
  <AccordionDetails sx={{ px: { xs: 2, md: 3 }, pt: 1, pb: 3, '& > :last-child': { mb: 0 } }}>{children}</AccordionDetails>
</Accordion>;

function GuideContent({ country, isAdmin }) {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up("md"));
  const [activeTopic, setActiveTopic] = useState(0);
  const [topics, setTopics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const [editor, setEditor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  useEffect(() => {
    let active = true;
    getStudyGuides(country._id).then(data => {
      if (active) { setTopics(data.guides); setActiveTopic(0); setError(''); }
    }).catch(err => { if (active) setError(err.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [country._id, version]);
  const remove = async () => {
    setDeleteBusy(true); setDeleteError('');
    try {
      await deleteStudyGuide(deleting._id);
      setActiveTopic(0); setDeleting(null);
      setLoading(true);
      try {
        const { guides } = await getStudyGuides(country._id);
        setTopics(guides); setError('');
      } catch {
        setError('Topic deleted, but the updated order could not be loaded. Retry to refresh the guide.');
      } finally { setLoading(false); }
    } catch (err) { setDeleteError(err.message); }
    finally { setDeleteBusy(false); }
  };
  const topic = topics[activeTopic];
  const sources = (topic?.sources || []).filter(source => {
    try { const url = new URL(source.url); return ['http:', 'https:'].includes(url.protocol) && !url.username && !url.password; }
    catch { return false; }
  });
  const selectTopic = (index) => {
    setActiveTopic(index);
    document.getElementById("guide-navigation")?.scrollIntoView({ block: "nearest" });
    document.getElementById("guide-tab-" + index)?.focus({ preventScroll: true });
  };

  return <Box sx={{ minHeight: "100vh", bgcolor: "#f8fafc", py: { xs: 3, md: 5 } }}>
    <Container maxWidth="lg">
      <Box sx={{ mb: { xs: 3, md: 4 } }}>
        <Typography variant="overline" color="primary" fontWeight={400} sx={{ letterSpacing: 1.5 }}>STUDY IN {country.name.toUpperCase()}</Typography>
        <Typography component="h1" fontWeight={400} sx={{ fontSize: { xs: "2rem", md: "2.75rem" }, color: "#1e293b", mt: 0.5 }}>Study Guide</Typography>
        <Typography color="text.secondary" sx={{ mt: 1, maxWidth: 620, lineHeight: 1.7 }}>From planning your finances to life after graduation. Choose a topic and explore it at your own pace.</Typography>
        {isAdmin && <Button variant="outlined" sx={{ mt: 2 }} onClick={() => setEditor({ record: null })} disabled={loading || Boolean(error)}>Add topic</Button>}
      </Box>
      {loading ? <Box sx={{ py: 5, textAlign: 'center' }}><Loading centered aria-label="Loading study guide" /></Box> : error ? <Alert severity="error" action={<Button onClick={() => { setLoading(true); setVersion(value => value + 1); }}>Retry</Button>}>{error}</Alert> : !topic ? <Paper variant="outlined" sx={{ p: 4, borderRadius: 3 }}><Typography>No study guide has been added for {country.name} yet.</Typography>{isAdmin && <Typography color="text.secondary" sx={{ mt: 1 }}>Add the first topic to make this guide available to counselors.</Typography>}</Paper> : <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "250px minmax(0, 1fr)" }, gap: { xs: 2, md: 4 }, alignItems: "start" }}>
        <Paper id="guide-navigation" component="nav" aria-label="Study guide topics" variant="outlined" sx={{ borderRadius: 3, p: { xs: 1, md: 2 }, position: { md: "sticky" }, top: { md: 88 }, minWidth: 0 }}>
          <Typography variant="overline" color="text.secondary" sx={{ display: { xs: "none", md: "block" }, px: 1, mb: 1 }}>IN THIS GUIDE</Typography>
          <Tabs value={activeTopic} onChange={(_, value) => setActiveTopic(value)} orientation={desktop ? "vertical" : "horizontal"} aria-label="Choose a study guide topic" variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile
            sx={{ "& .MuiTabs-list": { flexDirection: { xs: "row", md: "column" }, gap: 0.75 }, "& .MuiTabs-indicator": { display: "none" }, "& .MuiTab-root": { minHeight: 48, textTransform: "none", alignItems: "flex-start", textAlign: "left", borderRadius: 2, px: 2, fontWeight: 400, maxWidth: "none", "&.Mui-selected": { bgcolor: "#eef2ff", color: "#4338ca" }, "&.Mui-focusVisible": { outline: "2px solid #4338ca", outlineOffset: -2 } } }}>
            {topics.map((item, index) => <Tab key={item.label} id={"guide-tab-" + index} aria-controls={"guide-panel-" + index} label={(index + 1) + ". " + item.label} />)}
          </Tabs>
        </Paper>
        <Paper variant="outlined" sx={{ minWidth: 0, borderRadius: 3, overflow: "hidden" }}>
          <Box role="tabpanel" id={"guide-panel-" + activeTopic} aria-labelledby={"guide-tab-" + activeTopic} tabIndex={0} sx={{ p: { xs: 2.5, md: 4 } }}>
            <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ mb: 1.5 }}>
              <Typography variant="overline" color="primary" fontWeight={400}>{topic.category}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ alignSelf: "center", whiteSpace: "nowrap" }}>Topic {activeTopic + 1} of {topics.length}</Typography>
            </Stack>
            <Typography component="h2" fontWeight={400} sx={{ fontSize: { xs: "1.6rem", md: "2rem" } }}>{topic.title}</Typography>
            {isAdmin && <Stack direction="row" spacing={1} sx={{ mt: 1 }}><Button onClick={() => setEditor({ record: topic })}>Edit topic</Button><Button color="error" onClick={() => { setDeleteError(''); setDeleting(topic); }}>Delete topic</Button></Stack>}
            <Typography color="text.secondary" sx={{ mt: 1, lineHeight: 1.7 }}>{topic.description}</Typography>
            <Divider sx={{ my: 3 }} />
            <Box key={activeTopic} sx={{ maxWidth: '68ch', color: 'text.secondary' }}><GuideText text={topic.introduction} />{topic.sections.map((section, index) => <Detail key={index} title={section.title}><GuideText text={section.content} /></Detail>)}</Box>
            {sources.length > 0 && <Box sx={{ mt: 3 }}>
              <Divider sx={{ mb: 2 }} />
              <Typography component="h3" variant="h6" fontWeight={400}>Sources</Typography>
              <Box component="ul" sx={{ pl: 2.5, '& li': { my: 1.5 } }}>
                {sources.map((source, index) => <li key={index}>
                  <Typography component="a" href={source.url} target="_blank" rel="noopener noreferrer" aria-label={`${source.title} (opens in a new tab)`} sx={{ color: 'primary.main', overflowWrap: 'anywhere', lineHeight: 1.7, textUnderlineOffset: '3px', '&:hover': { textDecorationThickness: '2px' } }}>{source.title}<OpenInNew aria-hidden="true" sx={{ fontSize: 14, ml: 0.75, verticalAlign: 'middle' }} /></Typography>
                </li>)}
              </Box>
            </Box>}
          </Box>
          <Divider />
          <Stack direction="row" justifyContent="space-between" spacing={1} sx={{ px: { xs: 2, md: 4 }, py: 2, bgcolor: "#fcfcfd" }}>
            <Button disabled={activeTopic === 0} startIcon={<ArrowBack />} onClick={() => selectTopic(activeTopic - 1)}>Previous</Button>
            {activeTopic < topics.length - 1 ? <Button endIcon={<ArrowForward />} onClick={() => selectTopic(activeTopic + 1)} sx={{ textTransform: "none" }}>Next: {topics[activeTopic + 1].label}</Button> : <Button onClick={() => selectTopic(0)} sx={{ textTransform: "none" }}>Back to first topic</Button>}
          </Stack>
        </Paper>
      </Box>}
      {editor && <StudyGuideEditor record={editor.record} country={country} defaultOrder={Math.max(0, ...topics.map(item => item.order)) + 1} onClose={() => setEditor(null)} onSaved={async saved => {
        setEditor(null);
        setLoading(true);
        try {
          const { guides } = await getStudyGuides(country._id);
          setTopics(guides); setActiveTopic(Math.max(0, guides.findIndex(item => item._id === saved._id))); setError('');
        } catch {
          setError('Topic saved, but the updated order could not be loaded. Retry to refresh the guide.');
        } finally { setLoading(false); }
      }} />}
      <Dialog open={Boolean(deleting)} onClose={deleteBusy ? undefined : () => setDeleting(null)}>
        <DialogTitle>Delete topic?</DialogTitle>
        <DialogContent>{deleteError && <Alert severity="error">{deleteError}</Alert>}Delete “{deleting?.label}” from the {country.name} study guide?</DialogContent>
        <DialogActions><Button disabled={deleteBusy} onClick={() => setDeleting(null)}>Cancel</Button><Button color="error" disabled={deleteBusy} onClick={remove}>{deleteBusy ? 'Deleting…' : 'Delete'}</Button></DialogActions>
      </Dialog>
    </Container>
  </Box>;
}
