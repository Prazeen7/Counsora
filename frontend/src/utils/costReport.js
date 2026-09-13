import { createElement as h } from "react";
import { pdf, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
    page: { padding: 36, paddingBottom: 55, fontFamily: "Helvetica", fontSize: 10, lineHeight: 1.4, color: "#1e293b" },
    header: { backgroundColor: "#4f46e5", color: "white", padding: 18, marginBottom: 18 },
    title: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 5 },
    section: { fontSize: 12, fontFamily: "Helvetica-Bold", color: "#4f46e5", marginTop: 14, marginBottom: 7 },
    row: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e2e8f0", padding: 8 },
    label: { width: "72%", paddingRight: 12 },
    amount: { width: "28%", textAlign: "right" },
    note: { color: "#64748b", fontSize: 8, marginTop: 3 },
    total: { backgroundColor: "#eef2ff", padding: 12, fontFamily: "Helvetica-Bold", marginTop: 16, fontSize: 13 },
    footer: { position: "absolute", bottom: 24, left: 36, right: 36, textAlign: "center", color: "#64748b", fontSize: 8 },
});
const amount = (value) => value === null ? "Input required" : `NPR ${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

export function CostReportDocument({ result }) {
    return h(Document, { title: result.title, author: "Counsora" },
        h(Page, { size: "A4", style: styles.page },
            h(View, { style: styles.header },
                h(Text, { style: styles.title }, "Study Abroad Cost Report"),
                h(Text, { style: { marginTop: 8 } }, `${result.country.name} | ${new Date().toLocaleDateString("en-US")}`)),
            h(Text, null, result.isComplete ? "Complete estimate - all amounts provided" : "Partial estimate - missing amounts are excluded from totals"),
            h(Text, { style: styles.section }, "Cost summary"),
            ...result.stages.map((stage) => h(View, { key: `summary-${stage.key}`, style: styles.row, wrap: false },
                h(Text, { style: styles.label }, stage.title), h(Text, { style: styles.amount }, amount(stage.subtotal)))),
            ...result.stages.map((stage) => h(View, { key: stage.key, wrap: stage.items.length > 6 },
                h(Text, { style: styles.section, minPresenceAhead: 110 }, stage.title),
                ...stage.items.map((item) => h(View, { key: item.key, style: styles.row, wrap: false },
                    h(View, { style: styles.label }, h(Text, null, item.label),
                        item.note && h(Text, { style: styles.note }, item.note),
                        h(Text, { style: styles.note }, item.source === "user" ? "User entered" : item.source === "missing" ? "Amount needed" : "Suggested amount")),
                    h(Text, { style: styles.amount }, amount(item.amount)))),
                h(View, { style: styles.row, wrap: false }, h(Text, { style: styles.label }, "Subtotal"), h(Text, { style: styles.amount }, amount(stage.subtotal))))),
            h(View, { wrap: false },
                h(Text, { style: styles.total }, `${result.isComplete ? "TOTAL ESTIMATED FUNDING" : "PARTIAL ESTIMATED FUNDING"}: ${amount(result.total)}`),
                !result.isComplete && h(Text, { style: styles.note }, `Still needed: ${result.stages.flatMap((stage) => stage.items).filter((item) => item.amount === null).map((item) => item.label).join(", ")}.`),
                h(Text, { style: styles.note }, "Planning estimates include blocked funds, deposits and travel cash. Confirm fees before payment. EUR references are descriptive; no live currency conversion is applied.")),
            h(Text, { style: styles.footer, fixed: true, render: ({ pageNumber, totalPages }) => `Counsora | ${pageNumber} / ${totalPages}` })));
}

export async function downloadCostReport(result) {
    const blob = await pdf(h(CostReportDocument, { result })).toBlob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${result.country.code}-cost-estimate.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
