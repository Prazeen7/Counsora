export function resolveCostInputs(items, values) {
    const byKey = new Map(items.map(item => [item.key, item]));
    const resolved = {}, visiting = new Set();
    const read = key => {
        if (Object.hasOwn(resolved, key)) return resolved[key];
        const item = byKey.get(key);
        if (!item || visiting.has(key)) return null;
        visiting.add(key);
        const input = values[key] !== undefined && values[key] !== '' ? Number(values[key]) : item.defaultAmount;
        let value = Number.isFinite(input) && input >= 0 ? input : null;
        if (item.calculation) {
            const f = item.calculation;
            value = read(f.baseKey);
            if (f.type === 'percentage') {
                const rate = f.rateKey ? read(f.rateKey) : f.rate;
                value = value === null || rate === null ? null : Math.round((value * rate / 100 + Number.EPSILON) * 100) / 100;
            }
            if (f.type === 'emi') {
                const rate = f.rateKey ? read(f.rateKey) : f.rate;
                const months = read(f.termKey);
                if (value === null || rate === null || !Number.isInteger(months) || months < 1 || months > 600) value = null;
                else {
                    const monthlyRate = rate / 1200;
                    value = Math.round((monthlyRate === 0 ? value / months : value * monthlyRate / -Math.expm1(-months * Math.log1p(monthlyRate))) * 100) / 100;
                }
            }
        }
        visiting.delete(key);
        return (resolved[key] = value);
    };
    items.forEach(item => read(item.key));
    return resolved;
}

export const costFieldUnit = item => item.unit === 'percent' ? '%' : item.unit === 'months' ? 'months' : item.currency || 'NPR';
export const costFieldAmount = (item, money) => item.unit === 'percent' ? `${item.amount}%` : item.unit === 'months' ? `${item.amount} months` : money(item.amount, item.currency);
export const linkedCharge = (item, items) => items.find(charge => charge.calculation?.type === 'percentage' && charge.calculation.rateKey === item.key);
export const formCostItems = items => items.filter(item => item.calculation?.type !== 'emi' && !(item.calculation?.type === 'percentage' && item.calculation.rateKey));
export const reportCostItems = items => items.filter(item => !linkedCharge(item, items) && !['bank_loan_amount_npr', 'disbursement_amount_npr', 'interest_rate', 'loan_term_months'].includes(item.key) && item.calculation?.type !== 'emi');
export function loanRepaymentItems(stages) {
    const items = stages.flatMap(stage => stage.items);
    return items.filter(item => item.calculation?.type === 'emi' && items.some(base => base.key === item.calculation.baseKey && base.amount > 0));
}
export function reportCostLabel(item, items, money) {
    if (item.calculation?.type !== 'percentage' || !item.calculation.rateKey) return item.label;
    const rate = items.find(rate => rate.key === item.calculation.rateKey);
    return `${rate?.label.replace(/\s*\(%\)$/, '') || item.label}: ${rate?.amount ?? '—'}% (${item.amount === null ? 'Amount needed' : money(item.amount, item.currency)})`;
}
