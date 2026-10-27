export function InsurerLogo({ id }: { id: string }) {
  if (id === "aetna") {
    return (
      <svg width="64" height="28" viewBox="0 0 64 28" aria-hidden="true">
        <rect width="64" height="28" rx="6" fill="#7B2D8E" />
        <text x="32" y="19" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="14" fontWeight="700">
          Aetna
        </text>
      </svg>
    );
  }
  if (id === "bcbs") {
    return (
      <svg width="68" height="32" viewBox="0 0 68 32" aria-hidden="true">
        <rect width="32" height="32" rx="4" fill="#0033A0" />
        <path d="M13 5h6v7h7v6h-7v9h-6v-9H6v-6h7V5z" fill="white" />
        <path d="M38 3h24v13c0 8-7 13-12 15-5-2-12-7-12-15V3z" fill="#00A9CE" />
      </svg>
    );
  }
  if (id === "cigna") {
    return (
      <svg width="72" height="28" viewBox="0 0 72 28" aria-hidden="true">
        <rect width="72" height="28" rx="6" fill="#00A651" />
        <circle cx="14" cy="18" r="3" fill="white" />
        <circle cx="10" cy="13" r="2.3" fill="white" />
        <circle cx="18" cy="13" r="2.3" fill="white" />
        <circle cx="14" cy="9" r="2.1" fill="white" />
        <text x="44" y="18" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="13" fontWeight="700">
          Cigna
        </text>
      </svg>
    );
  }
  if (id === "uhc") {
    return (
      <svg width="48" height="28" viewBox="0 0 48 28" aria-hidden="true">
        <rect width="48" height="28" rx="6" fill="#002677" />
        <text x="24" y="19" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="13" fontWeight="700">
          UHC
        </text>
      </svg>
    );
  }
  return (
    <svg width="78" height="28" viewBox="0 0 78 28" aria-hidden="true">
      <rect width="78" height="28" rx="6" fill="#111111" />
      <circle cx="16" cy="14" r="7" fill="#F5C518" />
      <text x="48" y="18" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="700">
        oscar
      </text>
    </svg>
  );
}
