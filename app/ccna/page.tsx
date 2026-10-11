import type { Metadata } from "next";
import { TrackHub } from "@/app/components/TrackHub";
import { getTrack } from "@/lib/tracks";

const track = getTrack("ccna");

export const metadata: Metadata = {
  title: `${track.label} | CompTIA Review`,
  description: track.description,
};

export default function CcnaPage() {
  return <TrackHub trackId="ccna" />;
}
