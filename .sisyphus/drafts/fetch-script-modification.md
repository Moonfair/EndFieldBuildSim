# Draft: Fetch Details Browser Script Update

## User Request Summary

Update `data/fetch_details_browser.py` to use a newly discovered working URL pattern that automatically triggers the `/wiki/item/info` API with browser-handled authentication.

**Key Discovery**: 
- OLD (broken): `https://wiki.skland.com/item/{itemId}` → Does NOT trigger `/wiki/item/info` API
- NEW (working): `https://wiki.skland.com/endfield/detail?mainTypeId=1&subTypeId=6&gameEntryId={itemId}` → TRIGGERS API with auto-auth!

## Requirements (confirmed from user)

### MUST DO:
- ✅ Remove the auth header extraction logic (no longer needed)
- ✅ Update URL to use `endfield/detail` format with correct parameters
- ✅ Wait for BOTH 401 and subsequent 200 responses (browser auto-retries)
- ✅ Only save when response code=0 (success)
- ✅ Test with at least 3 items to verify it works
- ✅ Verify saved JSON files contain complete item data
- ✅ Show progress: `[123/254] 370 ✓`

### MUST NOT DO:
- ❌ Don't try to manually handle authentication
- ❌ Don't give up after first 401 response
- ❌ Don't skip error handling
- ❌ Don't create a "demo" version - full working implementation required

## Technical Approach

### URL Pattern Change
```
# Before (broken)
https://wiki.skland.com/item/{itemId}

# After (working)  
https://wiki.skland.com/endfield/detail?mainTypeId=1&subTypeId=6&gameEntryId={itemId}
```

### API Interception Pattern
The browser visits the page, which automatically:
1. Makes first request to `/wiki/item/info?id={itemId}` → 401
2. Refreshes token automatically
3. Makes second request to `/wiki/item/info?id={itemId}` → 200 (code=0)

Script needs to:
1. Set up response listener for `zonai.skland.com/web/v1/wiki/item/info`
2. Navigate to the page
3. Wait for API response with `code: 0`
4. Save the response data

### Handling 401→200 Pattern
```python
# Need to wait for successful response (code=0), not just any response
# First 401 should be ignored, wait for the 200 with code=0
responses = []
def capture_response(response):
    if '/wiki/item/info' in response.url:
        responses.append(response)

# Wait for page load + potential token refresh
# Check for successful response in captured responses
```

## Current Code Analysis

**Functions to REMOVE/REPLACE:**
- `extract_auth_headers_from_page()` - No longer needed (line 24-49)
- `fetch_item_detail_with_api()` - Current approach of manual API calls doesn't work (line 52-98)

**Functions to KEEP:**
- `load_item_ids()` - Works correctly (line 8-21)
- `main()` flow structure - Good, needs modification

**New Approach:**
- Navigate to real page URL
- Intercept browser's automatic API call
- Wait for 200 response with code=0
- Save response JSON directly

## Test Evidence (from user)
```
Testing URL: https://wiki.skland.com/endfield/detail?mainTypeId=1&subTypeId=6&gameEntryId=370
✓ FOUND API CALL: https://zonai.skland.com/web/v1/wiki/item/info?id=370
  Status: 401 (first attempt)
✓ FOUND API CALL: https://zonai.skland.com/web/v1/wiki/item/info?id=370
  Status: 200 (second attempt after auto token refresh)
  Code: 0
  ItemId: 370
  Name: 紫晶质瓶
```

## Data Counts
- type5_devices.json: 65 devices
- type6_items.json: 189 items
- Total: 254 items to fetch

## Scope Boundaries

### INCLUDE:
- Complete rewrite of fetch_details_browser.py
- Response interception logic
- 401→200 waiting pattern
- Skip existing files
- Progress display
- Error handling for timeouts

### EXCLUDE:
- Changes to other scripts (fetch.py, fetch_all_details.sh, etc.)
- Changes to data format
- Changes to README.md (user can update later)
- Post-processing of data

## Success Criteria
1. **Functional**: Script fetches all 254 item details without 401 errors
2. **Observable**: Each saved JSON has `code: 0` and complete item data
3. **Pass/Fail**: Run `python3 data/fetch_details_browser.py --test` → at least 2/3 items succeed

## Test Strategy Decision
- **Infrastructure exists**: NO formal test infrastructure
- **User wants tests**: Manual verification
- **QA approach**: Run script with `--test` flag, verify output files

## Open Questions
None - requirements are clear from user's detailed specification.
