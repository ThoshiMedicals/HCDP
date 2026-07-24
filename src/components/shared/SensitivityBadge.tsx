"use client";

import { Badge } from "@/components/ui/Badge";
import type { PlatformSensitivity } from "@/platform/status";
import type { BadgeTone } from "@/lib/types";

const TONE: Record<PlatformSensitivity, BadgeTone> = {
  Standard: "default",
  Restricted: "warn",
  Confidential: "danger",
  "Highly Confidential": "danger",
};

export function SensitivityBadge({ level }: { level: PlatformSensitivity }) {
  return <Badge tone={TONE[level]}>{level}</Badge>;
}
