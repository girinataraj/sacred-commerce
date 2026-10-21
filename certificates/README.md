# Public server trust anchor

This PEM contains a public Supabase CA certificate, not credentials or a private key. It is packaged outside public/ for a separately configured server database connection. Its inclusion does not mean hosted connectivity is verified.

For independently approved backend setup, validate the provider's current CA and intended hostname. Retain strict certificate-chain and hostname checks; never disable TLS validation. No application runtime database is needed in self-contained demo mode.
