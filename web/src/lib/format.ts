export function formatKr(value: number | null | undefined): string {
  if (value == null) return "—";
  return (
    Math.round(value)
      .toString()
      .replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " kr"
  );
}
