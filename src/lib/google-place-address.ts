export type ParsedGoogleAddress = {
  line1: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
};

function component(
  place: google.maps.places.PlaceResult,
  type: string,
  useShort = false,
): string {
  const match = place.address_components?.find((part) =>
    part.types.includes(type),
  );
  if (!match) return "";
  return (useShort ? match.short_name : match.long_name).trim();
}

export function parseGooglePlace(
  place: google.maps.places.PlaceResult,
): ParsedGoogleAddress {
  const streetNumber = component(place, "street_number");
  const route = component(place, "route");
  const line1 =
    [streetNumber, route].filter(Boolean).join(" ").trim() ||
    place.name?.trim() ||
    place.formatted_address?.split(",")[0]?.trim() ||
    "";

  const city =
    component(place, "locality") ||
    component(place, "sublocality_level_1") ||
    component(place, "postal_town") ||
    component(place, "administrative_area_level_2");

  return {
    line1,
    city,
    province: component(place, "administrative_area_level_1"),
    postalCode: component(place, "postal_code"),
    country: component(place, "country", true) || "ZA",
  };
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
