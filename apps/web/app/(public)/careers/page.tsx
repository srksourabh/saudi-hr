// Force dynamic rendering for the careers pages so the tRPC client works.
// The actual UI lives in CareersClient which is a client component.
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { CareersClient } from "./careers-client";

export default function CareersPage() {
  return <CareersClient />;
}