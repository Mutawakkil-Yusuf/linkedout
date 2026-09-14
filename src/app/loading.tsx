import { MarkLoader } from "@/components/mark-loader";
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <MarkLoader size={64} phase="breathing" />
    </div>
  );
}
