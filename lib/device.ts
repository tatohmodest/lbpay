export function isMobileClient() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(pointer: coarse)").matches ||
    window.innerWidth < 768 ||
    /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
  );
}
