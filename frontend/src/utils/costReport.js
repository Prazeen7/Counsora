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
const amount = (value, currency = "NPR") => value === null || value === undefined ? "Conversion unavailable" : `${currency} ${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;

export function CostReportDocument({ result }) {
    const children = [
        h(View, { style: styles.header }, h(Text, { style: styles.title }, "Study Abroad Cost Report"), h(Text, { style: { marginTop: 8 } }, `${result.country.name} | ${new Date().toLocaleDateString("en-US")}`)),
        h(Text, null, result.isComplete ? "Complete estimate - all amounts provided" : "Partial estimate - missing amounts are excluded from totals"),
        result.forex?.rates?.length > 0 ? h(Text, { style: styles.note }, `Today's ${result.forex.source || "NRB"} rate for ${result.forex.currency}: ${result.forex.rates.map((rate) => `${rate.currency?.iso3 || rate.currency?.ISO3 || rate.currency?.name} - NPR ${Number(rate.sell).toFixed(2)}/${rate.currency?.unit || 1}`).join(" | ")}`) : null,
        h(Text, { style: styles.section }, "Cost summary"),
    ];
    result.stages.forEach((stage) => {
        children.push(h(View, { key: `summary-${stage.key}`, style: styles.row, wrap: false }, h(Text, { style: styles.label }, stage.title), h(Text, { style: styles.amount }, amount(stage.subtotalNpr ?? stage.subtotal, "NPR"))));
    });
    result.stages.forEach((stage) => {
        const rows = [h(Text, { key: `${stage.key}-heading`, style: styles.section }, stage.title)];
        stage.items.forEach((item) => rows.push(h(View, { key: item.key, style: styles.row, wrap: false }, h(View, { style: styles.label }, h(Text, null, item.label), h(Text, { style: styles.note }, item.source === "user" ? "User entered" : item.source === "missing" ? "Amount needed" : "Suggested amount")), h(View, { style: styles.amount }, h(Text, null, item.convertedNpr !== null && item.currency?.toLowerCase() !== "npr" ? `${amount(item.convertedNpr, "NPR")} (${amount(item.amount, item.currency)})` : amount(item.amount, item.currency))))));
        rows.push(h(View, { key: `${stage.key}-subtotal`, style: styles.row, wrap: false }, h(Text, { style: styles.label }, "Subtotal"), h(Text, { style: styles.amount }, amount(stage.subtotalNpr ?? stage.subtotal, "NPR"))));
        children.push(h(View, { key: stage.key }, ...rows));
    });
    children.push(h(View, { style: { marginTop: 12 } }, h(Text, { style: styles.section }, "TOTAL ESTIMATED COST"), h(Text, { style: styles.total }, `${result.isComplete ? "TOTAL ESTIMATED FUNDING" : "PARTIAL ESTIMATED FUNDING"}: ${amount(Number(result.totalNpr ?? result.total ?? 0), "NPR")}`), !result.isComplete ? h(Text, { style: styles.note }, `Still needed: ${result.stages.flatMap((stage) => stage.items).filter((item) => item.amount === null).map((item) => item.label).join(", ")}.`) : null, h(Text, { style: styles.note }, `Today's ${result.forex?.source || "NRB"} rates were used for available conversions (${result.forex?.date || "date unavailable"}). Planning estimates include blocked funds, deposits and travel cash. Confirm fees before payment.`)));
    children.push(h(Text, { style: styles.footer, fixed: true, render: ({ pageNumber, totalPages }) => `Counsora | ${pageNumber} / ${totalPages}` }));
    return h(Document, { title: result.title, author: "Counsora" }, h(Page, { size: "A4", style: styles.page }, ...children));
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
