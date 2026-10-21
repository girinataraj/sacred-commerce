import 'server-only';
export function simulatePayment(mode:'SUCCESS'|'DECLINE') {
  return mode==='SUCCESS'?{outcome:'SUCCEEDED' as const,reasonCode:'SIMULATED_SUCCESS'}:{outcome:'DECLINED' as const,reasonCode:'SIMULATED_DECLINE'};
}
