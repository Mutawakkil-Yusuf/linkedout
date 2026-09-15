// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { MarkLoader } from "@/components/mark-loader";
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <MarkLoader size={64} phase="breathing" />
    </div>
  );
}
