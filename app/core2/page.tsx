import type { Metadata } from "next";
import { TrackHub } from "@/app/components/TrackHub";
import { getTrack } from "@/lib/tracks";

const track = getTrack("core2");

export const metadata: Metadata = {
  title: `${track.label} | CompTIA Review`,
  description: track.description,
};

export default function Core2Page() {
  return <TrackHub trackId="core2" />;
}
