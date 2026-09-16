#!/bin/bash
# Deploy Supabase Edge Functions to production

echo "🚀 Deploying VanLink Backend Functions..."

# Install Supabase CLI if not exists
if ! command -v supabase &> /dev/null; then
    echo "📦 Installing Supabase CLI..."
    npm install -g supabase@latest
fi

# Set Supabase project
export SUPABASE_URL="https://ebvjnirbkyixgwxahdpe.supabase.co"

# Deploy functions
echo "📤 Deploying broadcast-request function..."
supabase functions deploy broadcast-request --project-id ebvjnirbkyixgwxahdpe

echo "📤 Deploying confirm-delivery function..."
supabase functions deploy confirm-delivery --project-id ebvjnirbkyixgwxahdpe

echo "📤 Deploying admin-login function..."
supabase functions deploy admin-login --project-id ebvjnirbkyixgwxahdpe

echo "✅ Backend deployment complete!"
echo ""
echo "Functions available at:"
echo "  • https://ebvjnirbkyixgwxahdpe.supabase.co/functions/v1/broadcast-request"
echo "  • https://ebvjnirbkyixgwxahdpe.supabase.co/functions/v1/confirm-delivery"
echo "  • https://ebvjnirbkyixgwxahdpe.supabase.co/functions/v1/admin-login"
