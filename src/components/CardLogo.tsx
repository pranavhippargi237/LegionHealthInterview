export function CardLogo({ id }: { id: "visa" | "mastercard" | "amex" }) {
  if (id === "visa") {
    return (
      <svg width="48" height="32" viewBox="0 0 48 32" aria-hidden="true">
        <rect width="48" height="32" rx="4" fill="#1A1F71" />
        <text x="24" y="21" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="13" fontWeight="700" fontStyle="italic">
          VISA
        </text>
      </svg>
    );
  }
  if (id === "mastercard") {
    return (
      <svg width="48" height="32" viewBox="0 0 48 32" aria-hidden="true">
        <rect width="48" height="32" rx="4" fill="white" stroke="#E2E8F0" />
        <circle cx="20" cy="16" r="8" fill="#EB001B" />
        <circle cx="28" cy="16" r="8" fill="#F79E1B" />
        <path d="M24 9.8a8 8 0 0 1 0 12.4 8 8 0 0 1 0-12.4z" fill="#FF5F00" />
      </svg>
    );
  }
  return (
    <svg width="48" height="32" viewBox="0 0 48 32" aria-hidden="true">
      <rect width="48" height="32" rx="4" fill="#2E77BC" />
      <text x="24" y="19" textAnchor="middle" fill="white" fontFamily="Arial, sans-serif" fontSize="9" fontWeight="700">
        AMEX
      </text>
    </svg>
  );
}
