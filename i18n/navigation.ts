import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Use these instead of next/link and next/navigation so internal links keep the active locale.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
