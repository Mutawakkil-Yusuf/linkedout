#!/usr/bin/env bash
# SPDX-License-Identifier: AGPL-3.0-or-later
# Copyright (C) 2026 Mutawakkil Yusuf
#
# Pushes supabase/templates/*.html to the hosted project's Auth email
# config via the Supabase Management API. Use this instead of
# `supabase config push` on platforms the Supabase CLI binary doesn't
# ship for (e.g. Android/Termux).
#
# Requires: curl, jq
#
# Usage:
#   export SUPABASE_ACCESS_TOKEN="sbp_..."   # https://supabase.com/dashboard/account/tokens
#   export SUPABASE_PROJECT_REF="your-ref"   # from your project dashboard URL
#   bash scripts/push-email-templates.sh

set -euo pipefail

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required. On Termux: pkg install jq" >&2
  exit 1
fi

if [ -z "${SUPABASE_ACCESS_TOKEN:-}" ]; then
  echo "Set SUPABASE_ACCESS_TOKEN to a personal access token from https://supabase.com/dashboard/account/tokens" >&2
  exit 1
fi

if [ -z "${SUPABASE_PROJECT_REF:-}" ]; then
  echo "Set SUPABASE_PROJECT_REF to your project ref from the project dashboard URL" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEMPLATES_DIR="$SCRIPT_DIR/../supabase/templates"

PAYLOAD=$(jq -n \
  --rawfile magic "$TEMPLATES_DIR/magic-link.html" \
  --rawfile conf "$TEMPLATES_DIR/confirmation.html" \
  '{
    mailer_subjects_magic_link: "Your way in",
    mailer_templates_magic_link_content: $magic,
    mailer_subjects_confirmation: "Confirm your email - LinkedOut",
    mailer_templates_confirmation_content: $conf
  }')

echo "Pushing email templates to project $SUPABASE_PROJECT_REF..."

curl -sS -X PATCH "https://api.supabase.com/v1/projects/$SUPABASE_PROJECT_REF/config/auth" \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  --data-binary "$PAYLOAD" \
  -o /tmp/linkedout-email-push-response.json \
  -w "HTTP %{http_code}\n"

echo "Response saved to /tmp/linkedout-email-push-response.json"
