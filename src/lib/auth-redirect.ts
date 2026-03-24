export function getAuthRedirectUrl() {
  if (typeof window === "undefined") return undefined;
  return `${window.location.origin}/`;
}
