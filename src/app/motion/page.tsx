import { notFound } from "next/navigation";
import { MotionLab } from "./motion-lab";

// Internal design-reference page for the ActionButton variants.
// Gated to development only — returns a real 404 in production
// builds, so there's nothing to remember to remove before deploying.
export default function MotionPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <MotionLab />;
}
