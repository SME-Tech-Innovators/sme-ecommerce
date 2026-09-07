import { NextResponse } from "next/server";
import {
  parseAzureMapsAddress,
  type AzureMapsAddress,
} from "@/lib/address-autocomplete";

export const runtime = "nodejs";

type AzureSearchV1Response = {
  results?: Array<{ address?: AzureMapsAddress }>;
  error?: { message?: string; code?: string };
};

type AzureAutocompleteResponse = {
  features?: Array<{
    properties?: { address?: AzureMapsAddress; name?: string };
  }>;
  error?: { message?: string; code?: string };
};

function toSuggestions(
  addresses: Array<AzureMapsAddress | undefined>,
  fallbackLabels: Array<string | undefined> = [],
) {
  return addresses
    .map((address, index) => {
      const parsed = parseAzureMapsAddress(address ?? {});
      const fallback = fallbackLabels[index];
      if (!parsed.line1 && fallback) {
        parsed.line1 = fallback;
        parsed.label = parsed.label || fallback;
      }
      return parsed;
    })
    .filter((item) => item.line1.length > 0 || item.label.length > 0)
    .map((item) => ({
      ...item,
      line1: item.line1 || item.label.split(",")[0]?.trim() || item.label,
    }));
}

function azureErrorMessage(status: number, body: string): string {
  try {
    const parsed = JSON.parse(body) as {
      error?: { message?: string };
      message?: string;
    };
    return parsed.error?.message || parsed.message || `Azure Maps HTTP ${status}`;
  } catch {
    return body.slice(0, 240) || `Azure Maps HTTP ${status}`;
  }
}

async function azureGet(
  url: URL,
  key: string,
): Promise<{ ok: true; json: unknown } | { ok: false; status: number; message: string }> {
  try {
    const res = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
        "subscription-key": key,
      },
      cache: "no-store",
    });
    const text = await res.text();
    if (!res.ok) {
      return { ok: false, status: res.status, message: azureErrorMessage(res.status, text) };
    }
    return { ok: true, json: text ? JSON.parse(text) : {} };
  } catch (err) {
    return {
      ok: false,
      status: 502,
      message: err instanceof Error ? err.message : "Could not reach Azure Maps.",
    };
  }
}

export async function GET(request: Request) {
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 3) {
    return NextResponse.json({ suggestions: [] });
  }

  const key = process.env.AZURE_MAPS_SUBSCRIPTION_KEY?.trim();
  if (!key) {
    return NextResponse.json(
      { suggestions: [], message: "Address suggestions are unavailable." },
      { status: 503 },
    );
  }

  const autocomplete = new URL("https://atlas.microsoft.com/geocode:autocomplete");
  autocomplete.searchParams.set("api-version", "2025-01-01");
  autocomplete.searchParams.set("subscription-key", key);
  autocomplete.searchParams.set("query", q);
  autocomplete.searchParams.set("countryRegion", "ZA");
  autocomplete.searchParams.set("top", "6");
  autocomplete.searchParams.set("resultTypeGroups", "Address");
  autocomplete.searchParams.set("coordinates", "24.7,-28.5");

  const first = await azureGet(autocomplete, key);
  if (first.ok) {
    const payload = first.json as AzureAutocompleteResponse;
    const features = payload.features ?? [];
    return NextResponse.json({
      suggestions: toSuggestions(
        features.map((feature) => feature.properties?.address),
        features.map((feature) => feature.properties?.name),
      ),
    });
  }

  const legacy = new URL("https://atlas.microsoft.com/search/address/json");
  legacy.searchParams.set("api-version", "1.0");
  legacy.searchParams.set("subscription-key", key);
  legacy.searchParams.set("query", q);
  legacy.searchParams.set("typeahead", "true");
  legacy.searchParams.set("countrySet", "ZA");
  legacy.searchParams.set("limit", "6");

  const second = await azureGet(legacy, key);
  if (second.ok) {
    const payload = second.json as AzureSearchV1Response;
    return NextResponse.json({
      suggestions: toSuggestions((payload.results ?? []).map((row) => row.address)),
    });
  }

  return NextResponse.json(
    {
      suggestions: [],
      message: first.message || second.message,
      azureStatus: first.status,
    },
    { status: 502 },
  );
}
