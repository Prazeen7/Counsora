const tls = require("node:tls");

// Node normally trusts its bundled CA set, while browsers also trust certificates
// installed in the operating system. Include both sets so HTTPS uploads work behind
// trusted corporate proxies and antivirus HTTPS inspection without disabling TLS.
if (
    typeof tls.getCACertificates === "function" &&
    typeof tls.setDefaultCACertificates === "function"
) {
    const trustedCertificates = [
        ...tls.getCACertificates("default"),
        ...tls.getCACertificates("system"),
    ];

    tls.setDefaultCACertificates([...new Set(trustedCertificates)]);
}

