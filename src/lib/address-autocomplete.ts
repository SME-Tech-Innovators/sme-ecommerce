export type ParsedCheckoutAddress = {
  line1: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  label: string;
};

export type AzureMapsAddress = {
  streetNumber?: string;
  streetName?: string;
  addressLine?: string;
  formattedAddress?: string;
  municipality?: string;
  municipalitySubdivision?: string;
  locality?: string;
  countrySubdivision?: string;
  countrySubdivisionName?: string;
  postalCode?: string;
  countryCode?: string;
  freeformAddress?: string;
  adminDistricts?: Array<{ name?: string; shortName?: string }>;
  countryRegion?: { ISO?: string; name?: string };
};

export function parseAzureMapsAddress(
  address: AzureMapsAddress,
): ParsedCheckoutAddress {
  const line1 =
    address.addressLine?.trim() ||
    [address.streetNumber, address.streetName].filter(Boolean).join(" ").trim() ||
    address.formattedAddress?.split(",")[0]?.trim() ||
    address.freeformAddress?.split(",")[0]?.trim() ||
    "";
  const city = (
    address.locality ||
    address.municipality ||
    address.municipalitySubdivision ||
    ""
  ).trim();
  const province = (
    address.adminDistricts?.[0]?.name ||
    address.countrySubdivisionName ||
    address.countrySubdivision ||
    ""
  ).trim();
  const postalCode = (address.postalCode || "").trim();
  const country = (
    address.countryRegion?.ISO ||
    address.countryCode ||
    "ZA"
  )
    .trim()
    .toUpperCase();
  const label =
    address.formattedAddress?.trim() ||
    address.freeformAddress?.trim() ||
    [line1, city, province, postalCode].filter(Boolean).join(", ");

  return { line1, city, province, postalCode, country, label };
}

export function setFormFieldValue(
  form: HTMLFormElement,
  name: string,
  value: string,
) {
  if (!value) return;
  const el = form.elements.namedItem(name);
  if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) {
    el.value = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }
}
