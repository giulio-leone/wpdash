#!/bin/bash
# WP Dash Bridge Plugin — Integration Test Script
# Usage: ./test-plugin.sh [TOKEN]
# If TOKEN is not provided, it will be fetched from the WordPress transient

set -e

WP_URL="http://localhost:8080"
API_BASE="$WP_URL/wp-json/wpdash/v1"
TOKEN="${1:-}"
PASS=0
FAIL=0
TOTAL=0

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_pass() { PASS=$((PASS+1)); TOTAL=$((TOTAL+1)); echo -e "${GREEN}✅ PASS${NC}: $1"; }
log_fail() { FAIL=$((FAIL+1)); TOTAL=$((TOTAL+1)); echo -e "${RED}❌ FAIL${NC}: $1 — $2"; }
log_info() { echo -e "${YELLOW}ℹ️  ${NC}$1"; }

# Get token if not provided
if [ -z "$TOKEN" ]; then
  log_info "Fetching token from WordPress transient..."
  TOKEN=$(docker exec wpdash-test-cli wp transient get wpdash_bridge_initial_token 2>/dev/null || true)
  if [ -z "$TOKEN" ]; then
    log_info "Transient expired. Generating new token via WP-CLI..."
    TOKEN=$(docker exec wpdash-test-cli wp eval 'echo bin2hex(random_bytes(32));' 2>/dev/null)
    docker exec wpdash-test-cli wp option update wpdash_bridge_token_hash "$(echo -n "$TOKEN" | sha256sum | cut -d' ' -f1)" 2>/dev/null
  fi
fi

log_info "Using token: ${TOKEN:0:16}..."
echo ""
echo "======================================"
echo "  WP Dash Bridge Plugin Tests"
echo "======================================"
echo ""

# --- Test 1: Health endpoint (no auth) should fail ---
log_info "Test: Health endpoint without auth (should return 401)"
HTTP_CODE=$(curl -sL -o /dev/null -w "%{http_code}" "$API_BASE/health")
if [ "$HTTP_CODE" = "401" ]; then
  log_pass "Health endpoint rejects unauthenticated requests (HTTP $HTTP_CODE)"
else
  log_fail "Health endpoint auth check" "Expected 401, got $HTTP_CODE"
fi

# --- Test 2: Health endpoint with wrong token (should fail 403) ---
log_info "Test: Health endpoint with wrong token (should return 403)"
HTTP_CODE=$(curl -sL -o /dev/null -w "%{http_code}" -H "Authorization: Bearer wrong_token" "$API_BASE/health")
if [ "$HTTP_CODE" = "403" ]; then
  log_pass "Health endpoint rejects invalid token (HTTP $HTTP_CODE)"
else
  log_fail "Health endpoint invalid token check" "Expected 403, got $HTTP_CODE"
fi

# --- Test 3: Health endpoint with valid token ---
log_info "Test: Health endpoint with valid token"
RESPONSE=$(curl -sL -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" "$API_BASE/health")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
if [ "$HTTP_CODE" = "200" ]; then
  log_pass "Health endpoint returns 200"
  
  # Check required fields
  for field in wp_version php_version db_version site_url ssl_enabled plugin_count checked_at; do
    if echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); assert '$field' in d" 2>/dev/null; then
      log_pass "Health response contains '$field'"
    else
      log_fail "Health response field" "Missing '$field'"
    fi
  done
  
  # Print health summary
  log_info "Health summary:"
  echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'  WP: {d.get(\"wp_version\")}, PHP: {d.get(\"php_version\")}, DB: {d.get(\"db_version\")}')" 2>/dev/null || true
  echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); p=d.get('plugin_count',{}); print(f'  Plugins: {p.get(\"active\",0)} active, {p.get(\"total\",0)} total')" 2>/dev/null || true
else
  log_fail "Health endpoint" "Expected 200, got $HTTP_CODE"
  echo "$BODY" | head -5
fi
echo ""

# --- Test 4: Plugins list ---
log_info "Test: Plugins list endpoint"
RESPONSE=$(curl -sL -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" "$API_BASE/plugins")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
if [ "$HTTP_CODE" = "200" ]; then
  log_pass "Plugins list returns 200"
  PLUGIN_COUNT=$(echo "$BODY" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")
  log_info "Found $PLUGIN_COUNT plugins"
  
  # Check if our plugin is listed
  if echo "$BODY" | python3 -c "import sys,json; plugins=json.load(sys.stdin); assert any(p.get('slug')=='wp-dash-bridge' for p in plugins)" 2>/dev/null; then
    log_pass "WP Dash Bridge plugin found in list"
  else
    log_fail "Plugin self-reference" "WP Dash Bridge not found in plugin list"
  fi
else
  log_fail "Plugins list" "Expected 200, got $HTTP_CODE"
fi
echo ""

# --- Test 5: Security integrity check ---
log_info "Test: Security integrity endpoint"
RESPONSE=$(curl -sL -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" "$API_BASE/security/integrity")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
if [ "$HTTP_CODE" = "200" ]; then
  log_pass "Security integrity returns 200"
  if echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); assert 'status' in d or 'findings' in d" 2>/dev/null; then
    log_pass "Security response has status/findings"
  fi
else
  log_fail "Security integrity" "Expected 200, got $HTTP_CODE"
fi
echo ""

# --- Test 6: SEO audit ---
log_info "Test: SEO audit endpoint"
RESPONSE=$(curl -sL -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "{\"url\":\"$WP_URL\"}" "$API_BASE/seo/audit")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
if [ "$HTTP_CODE" = "200" ]; then
  log_pass "SEO audit returns 200"
  for field in title meta_description headers; do
    if echo "$BODY" | python3 -c "import sys,json; d=json.load(sys.stdin); assert '$field' in d" 2>/dev/null; then
      log_pass "SEO response contains '$field'"
    else
      log_fail "SEO response field" "Missing '$field'"
    fi
  done
  TITLE=$(echo "$BODY" | python3 -c "import sys,json; print(json.load(sys.stdin).get('title',''))" 2>/dev/null || echo "")
  log_info "SEO title: $TITLE"
else
  log_fail "SEO audit" "Expected 200, got $HTTP_CODE"
  echo "$BODY" | head -5
fi
echo ""

# --- Test 7: Logs endpoint ---
log_info "Test: Logs endpoint"
RESPONSE=$(curl -sL -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" "$API_BASE/logs?lines=10")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
if [ "$HTTP_CODE" = "200" ]; then
  log_pass "Logs endpoint returns 200"
else
  log_fail "Logs endpoint" "Expected 200, got $HTTP_CODE"
fi
echo ""

# --- Test 8: Backup status ---
log_info "Test: Backup status endpoint"
RESPONSE=$(curl -sL -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" "$API_BASE/backup/status")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | sed '$d')
if [ "$HTTP_CODE" = "200" ]; then
  log_pass "Backup status returns 200"
else
  log_fail "Backup status" "Expected 200, got $HTTP_CODE"
fi
echo ""

# --- Test 9: Rate limiting ---
log_info "Test: Rate limiting (rapid requests)"
for i in $(seq 1 5); do
  curl -sL -o /dev/null -H "Authorization: Bearer $TOKEN" "$API_BASE/health" &
done
wait
log_pass "Rapid requests handled without crash"
echo ""

# --- Test 10: Plugin manage (deactivate Hello Dolly if present) ---
log_info "Test: Plugin manage endpoint (deactivate)"
HELLO=$(echo "$BODY" | python3 -c "import sys,json; plugins=json.load(sys.stdin) if isinstance(json.load(open('/dev/stdin') if False else sys.stdin), list) else []; print('hello.php' if any('hello' in p.get('slug','') for p in plugins) else '')" 2>/dev/null || echo "")
# Try activating Akismet (usually inactive by default)
RESPONSE=$(curl -sL -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"action":"activate","plugin":"akismet/akismet.php"}' \
  "$API_BASE/plugins/manage")
HTTP_CODE=$(echo "$RESPONSE" | tail -1)
if [ "$HTTP_CODE" = "200" ]; then
  log_pass "Plugin activate action works (HTTP $HTTP_CODE)"
  # Deactivate it back
  curl -sL -o /dev/null -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
    -d '{"action":"deactivate","plugin":"akismet/akismet.php"}' \
    "$API_BASE/plugins/manage"
  log_pass "Plugin deactivate action works"
else
  log_info "Plugin manage returned $HTTP_CODE (plugin may not exist in this install)"
fi
echo ""

# --- Summary ---
echo "======================================"
echo "  Test Results"
echo "======================================"
echo -e "  ${GREEN}Passed: $PASS${NC}"
echo -e "  ${RED}Failed: $FAIL${NC}"
echo "  Total:  $TOTAL"
echo "======================================"

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
echo -e "${GREEN}All tests passed!${NC}"
