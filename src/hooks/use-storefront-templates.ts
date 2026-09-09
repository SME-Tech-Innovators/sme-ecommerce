"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  getStorefrontTemplateVersion,
  getStorefrontTemplates,
} from "@/apis/storefront-templates";
import { getStoredAuthSession } from "@/lib/auth-login-storage";
import { templateDefaultConfigToStorefrontConfig } from "@/lib/storefront-template-config-mapper";
import type { StorefrontConfig } from "@/types/storefront";
import type { StorefrontTemplateListItem } from "@/types/storefront-template-api";

export function storefrontTemplatesQueryKey(accessToken?: string) {
  return ["storefront-templates", accessToken ?? "anonymous"] as const;
}

export function storefrontTemplateVersionQueryKey(
  templateId: string,
  version: number,
  accessToken?: string,
) {
  return [
    "storefront-template-version",
    templateId,
    version,
    accessToken ?? "anonymous",
  ] as const;
}

function requireAccessToken(): string {
  const token = getStoredAuthSession()?.accessToken;
  if (!token) {
    throw new Error("Sign in to load storefront templates.");
  }
  return token;
}

export function useStorefrontTemplates(enabled = true) {
  const accessToken = getStoredAuthSession()?.accessToken;
  return useQuery({
    queryKey: storefrontTemplatesQueryKey(accessToken),
    enabled: enabled && Boolean(accessToken),
    queryFn: async (): Promise<StorefrontTemplateListItem[]> => {
      const result = await getStorefrontTemplates(requireAccessToken());
      if (!result.ok) {
        throw new Error(result.errorMessage);
      }
      return result.data;
    },
  });
}

export function useStorefrontTemplatePreviewConfig(
  templateId: string | undefined,
  version: number | undefined,
  enabled = true,
) {
  const accessToken = getStoredAuthSession()?.accessToken;
  return useQuery({
    queryKey: storefrontTemplateVersionQueryKey(
      templateId ?? "",
      version ?? 0,
      accessToken,
    ),
    enabled:
      enabled && Boolean(accessToken) && Boolean(templateId) && Boolean(version),
    queryFn: async (): Promise<StorefrontConfig> => {
      const result = await getStorefrontTemplateVersion(
        templateId!,
        version!,
        requireAccessToken(),
      );
      if (!result.ok) {
        throw new Error(result.errorMessage);
      }
      return templateDefaultConfigToStorefrontConfig(
        result.data.defaultConfig,
        result.data.templateId,
      );
    },
  });
}

/** Preview config from list `defaultConfig` when present, else version API. */
export function useTemplatePreviewConfig(
  entry: StorefrontTemplateListItem | null | undefined,
  enabled = true,
) {
  const fromList = useMemo(() => {
    if (!entry?.defaultConfig) return null;
    return templateDefaultConfigToStorefrontConfig(entry.defaultConfig, entry.id);
  }, [entry]);

  const versionQuery = useStorefrontTemplatePreviewConfig(
    entry?.id,
    entry?.latestVersion,
    enabled && Boolean(entry) && !fromList,
  );

  return {
    data: fromList ?? versionQuery.data ?? null,
    isLoading: Boolean(entry) && enabled && !fromList && versionQuery.isLoading,
    isError: !fromList && versionQuery.isError,
    error: versionQuery.error,
    refetch: versionQuery.refetch,
  };
}
