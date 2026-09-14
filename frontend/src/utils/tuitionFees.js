export function tuitionFeeText(fee) {
    if (typeof fee === 'string') return fee;
    if (fee?.display_text != null) return fee.display_text;
    return [fee?.credits, fee?.annual_fee_eur].filter(value => value != null && value !== '').join(': ');
}

export function tuitionFeesText(fees) {
    return Array.isArray(fees) ? fees.map(tuitionFeeText).join('\n') : fees || '';
}

export function tuitionFeesFromText(text, previousFees = []) {
    if (text === tuitionFeesText(previousFees)) return previousFees;
    return text === '' ? [] : [{ display_text: text, credits: null, annual_fee_eur: null }];
}
