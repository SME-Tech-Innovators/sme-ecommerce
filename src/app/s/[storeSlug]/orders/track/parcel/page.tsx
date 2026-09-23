import { PublicParcelTrackClient } from "@/app/s/[storeSlug]/orders/track/parcel/public-parcel-track-client";

type PageProps = {
  params: Promise<{ storeSlug: string }>;
};

export default async function PublicParcelTrackPage({ params }: PageProps) {
  const { storeSlug } = await params;
  return <PublicParcelTrackClient storeSlug={storeSlug} />;
}
