const key = "verificationFlow";
const completedPrefix = "counsora:verified:";

function completedKey(email) {
    return completedPrefix + email.trim().toLowerCase();
}

export function markEmailVerified(email) {
    try {
        if (email) localStorage.setItem(completedKey(email), String(Date.now()));
    } catch { /* Storage may be blocked; successful verification must still redirect. */ }
}

export function wasEmailVerified(email) {
    try {
        return Boolean(email && localStorage.getItem(completedKey(email)));
    } catch { return false; }
}

export function watchEmailVerified(email, onVerified) {
    const check = () => { if (wasEmailVerified(email)) onVerified(); };
    const onStorage = (event) => {
        if (email && event.key === completedKey(email)) check();
    };
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", check);
    check();
    return () => {
        window.removeEventListener("storage", onStorage);
        window.removeEventListener("focus", check);
    };
}

export function startVerificationFlow() {
    const id = crypto.randomUUID();
    sessionStorage.setItem(key, id);
    return id;
}

export function isVerificationFlowActive(id) {
    return Boolean(id && sessionStorage.getItem(key) === id);
}

export function endVerificationFlow() {
    sessionStorage.removeItem(key);
}
