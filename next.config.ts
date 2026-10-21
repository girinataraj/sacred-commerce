import type { NextConfig } from 'next';

const config: NextConfig = {
  poweredByHeader: false,
  devIndicators: false,
  // pg reads sslrootcert from DATABASE_URL at runtime; keep the public CA in
  // server function artifacts even though its path is supplied through env.
  outputFileTracingIncludes: {
    '/*': ['./certificates/supabase-prod-root-2021.crt'],
  },
};
export default config;
