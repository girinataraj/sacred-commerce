// SQL-only synthetic identities for disposable integration databases.
// These are not Supabase Auth login accounts or credentials.
export const testActors = [
  { id: '7eb42b00-73aa-4111-8000-000000000001', role: 'CUSTOMER' },
  { id: '7eb42b00-73aa-4111-8000-000000000002', role: 'CUSTOMER' },
  { id: '7eb42b00-73aa-4111-8000-000000000003', role: 'ADMIN' },
] as const;
