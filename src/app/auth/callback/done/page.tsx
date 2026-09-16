// SPDX-License-Identifier: AGPL-3.0-or-later
// Copyright (C) 2026 Mutawakkil Yusuf

import { CallbackDoneClient } from "./done-client";

export default async function CallbackDonePage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const dest = next && next.startsWith("/") ? next : "/rooms";
  return <CallbackDoneClient dest={dest} />;
}
