import urllib.request
import zipfile
import io
import re

print("=" * 60)
print("1. TEST ONLINE APK DOWNLOAD LINK")
print("=" * 60)
url = "https://fermegestpro.vercel.app/FermeGestPro.apk"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
with urllib.request.urlopen(req, timeout=15) as res:
    status = res.status
    content_length = int(res.headers.get("content-length", 0))
    chunk = res.read(1024 * 100)
    is_valid_apk = chunk[:4] == b"PK\x03\x04"
    print(f"URL: {url}")
    print(f"HTTP Status: {status}")
    print(f"Content-Length: {content_length} bytes (~{content_length / (1024*1024):.2f} MB)")
    print(f"Content-Type: {res.headers.get('content-type')}")
    print(f"Valid APK Archive Magic Bytes (PK\\x03\\x04): {is_valid_apk}")
    assert status == 200, f"Expected 200, got {status}"
    assert is_valid_apk, "Not a valid APK zip archive!"
    assert content_length > 5 * 1024 * 1024, "APK is too small!"
print("✅ APK Download Link is 100% ONLINE, VALID & FUNCTIONAL!")

print("\n" + "=" * 60)
print("2. TEST WEB APPLICATION ROOT LINK")
print("=" * 60)
with urllib.request.urlopen("https://fermegestpro.vercel.app/", timeout=15) as res:
    html = res.read().decode("utf-8")
    print(f"HTTP Status: {res.status}")
    print(f"HTML Size: {len(html)} characters")
    assert res.status == 200
    assert "FermeGest Pro" in html
    assert "eggStockCard" in html
print("✅ Web Application Root is 100% ONLINE!")

print("\n" + "=" * 60)
print("3. TEST INVITATION DEEP LINK (?join=FERME-XXXX)")
print("=" * 60)
with urllib.request.urlopen("https://fermegestpro.vercel.app/?join=FERME-TEST", timeout=15) as res:
    print(f"HTTP Status: {res.status}")
    assert res.status == 200
print("✅ Deep Link Invite URL is 100% ONLINE & REACHABLE!")

print("\n" + "=" * 60)
print("4. VERIFY BUTTONS CSS LAYOUT (PC vs MOBILE)")
print("=" * 60)
with open("styles.css", "r", encoding="utf-8") as f:
    css = f.read()

# Check PC desktop rule
desktop_match = re.search(r"\.egg-stock-actions-grid\s*\{([^}]+)\}", css)
assert desktop_match, "egg-stock-actions-grid not found in styles.css"
desktop_props = desktop_match.group(1)
print("Default (PC Desktop) CSS:")
for line in desktop_props.strip().split("\n"):
    print("  ", line.strip())

assert "grid-template-columns: repeat(4, minmax(0, 1fr))" in desktop_props, "PC rule must be 4 columns on 1 line!"
print("✅ PC Desktop Rule: strictly 4 buttons on 1 single line!")

# Check Mobile rule
mobile_query_match = re.search(r"@media\s*\(max-width:\s*767px\)\s*\{(.*?)\n\}", css, re.DOTALL)
assert mobile_query_match, "Mobile media query block not found"
mobile_block = mobile_query_match.group(1)
mobile_match = re.search(r"\.egg-stock-actions-grid\s*\{([^}]+)\}", mobile_block)
assert mobile_match, "Mobile media query for egg-stock-actions-grid not found"
mobile_props = mobile_match.group(1)
print("\nMobile (<= 767px) CSS:")
for line in mobile_props.strip().split("\n"):
    print("  ", line.strip())

assert "grid-template-columns: repeat(2, minmax(0, 1fr))" in mobile_props, "Mobile rule must be 2 columns!"
print("✅ Mobile Rule: strictly 2x2 grid (1 2 / 3 4)!")

# Check Capacitor / Native app rule
native_match = re.search(r"(?:body\.is-capacitor|\.is-mobile-app)\s+\.egg-stock-actions-grid\s*\{([^}]+)\}", css)
assert native_match, "Native app rule for egg-stock-actions-grid not found"
native_props = native_match.group(1)
print("\nNative App (.is-mobile-app) CSS:")
for line in native_props.strip().split("\n"):
    print("  ", line.strip())

assert "grid-template-columns: repeat(2, minmax(0, 1fr))" in native_props, "Native app rule must be 2 columns!"
print("✅ Native Mobile App Rule: strictly 2x2 grid (1 2 / 3 4)!")

print("\n" + "=" * 60)
print("🎉 ALL LINK AND BUTTON VERIFICATIONS PASSED 100%!")
print("=" * 60)
