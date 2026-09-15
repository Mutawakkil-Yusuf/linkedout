// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { MarkLoader } from "@/components/mark-loader";
export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center pt-8">
      <MarkLoader size={56} phase="breathing" />
    </div>
  );
}
