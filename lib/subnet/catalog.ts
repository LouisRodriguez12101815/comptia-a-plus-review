import data from "../../content/subnet-architect.json" with { type: "json" };
import type { SubnetData } from "@/lib/subnet/types";
export const subnetData = data as SubnetData;
