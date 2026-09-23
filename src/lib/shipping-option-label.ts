import type { ShippingOption } from "@/types/shipping";

/** Human-readable label; fixes legacy API rows where service_level was serialized as a map string. */
export function shippingOptionLabel(option: ShippingOption): string {
  const raw = option.label?.trim() ?? "";
  if (!raw) return "Delivery";
  if (raw.startsWith("{code=") || raw.startsWith("{code:")) {
    const nameMatch = /name=([^,}]+)/.exec(raw);
    if (nameMatch?.[1]) {
      const codeMatch = /code=([^,}]+)/.exec(raw);
      const name = nameMatch[1].trim();
      const code = codeMatch?.[1]?.trim();
      return code && code !== name ? `${name} (${code})` : name;
    }
    return "Courier delivery";
  }
  return raw;
}
