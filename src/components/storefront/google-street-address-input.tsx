"use client";

import { Autocomplete, useLoadScript } from "@react-google-maps/api";
import { useRef, type InputHTMLAttributes } from "react";
import {
  parseGooglePlace,
  setFormFieldValue,
} from "@/lib/google-place-address";

const PLACES_LIBRARIES: "places"[] = ["places"];

function getGoogleMapsApiKey(): string {
  return process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";
}

type GoogleStreetAddressInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "name"
> & {
  name?: string;
};

export function GoogleStreetAddressInput({
  name = "address",
  className,
  ...inputProps
}: GoogleStreetAddressInputProps) {
  const apiKey = getGoogleMapsApiKey();
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const { isLoaded } = useLoadScript({
    googleMapsApiKey: apiKey,
    libraries: PLACES_LIBRARIES,
  });

  function applyPlace() {
    const place = autocompleteRef.current?.getPlace();
    const input = wrapRef.current?.querySelector("input");
    const form = input?.form;
    if (!place || !form) return;

    const parsed = parseGooglePlace(place);
    if (parsed.line1 && input) {
      input.value = parsed.line1;
    }
    setFormFieldValue(form, "address", parsed.line1);
    setFormFieldValue(form, "city", parsed.city);
    setFormFieldValue(form, "region", parsed.province);
    setFormFieldValue(form, "postalCode", parsed.postalCode);
    setFormFieldValue(form, "country", parsed.country);
  }

  const input = (
    <input
      {...inputProps}
      required
      name={name}
      autoComplete="off"
      className={className}
      placeholder={
        inputProps.placeholder ?? "Start typing your street address"
      }
    />
  );

  if (!apiKey || !isLoaded) {
    return input;
  }

  return (
    <div ref={wrapRef}>
    <Autocomplete
      onLoad={(autocomplete) => {
        autocompleteRef.current = autocomplete;
      }}
      onPlaceChanged={applyPlace}
      options={{
        componentRestrictions: { country: "za" },
        fields: ["address_components", "formatted_address", "name"],
        types: ["address"],
      }}
    >
      {input}
    </Autocomplete>
    </div>
  );
}
