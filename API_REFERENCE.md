# Pipe Network Firestarter API Reference

**Last Updated:** Nov 4, 2025  
**Base URL:** `https://us-west-01-firestarter.pipenetwork.com` (mainnet)  
**Status:** ✅ Fully Tested and Working

---

## ⚠️ Important Notes

- **OLD DEVNET ENDPOINT IS DEAD:** `https://us-west-00-firestarter.pipenetwork.com` (404/504 errors)
- **USE MAINNET:** `https://us-west-01-firestarter.pipenetwork.com`
- CLI defaults to old endpoint - always use `--api` flag
- All authenticated endpoints require JWT token via `Authorization: Bearer {token}`
- **Password requirements:** 8+ characters with uppercase, lowercase, numbers, and symbols required
- **Deposit system:** Send PIPE tokens directly to your wallet address (shown in `/checkWallet`), deposits sync automatically every ~30 seconds
- **Download format:** Files are returned as multipart/form-data (need to parse out content)

---

## Complete Working Flow

1. `POST /users` - Create account
2. `POST /auth/set-password` - Set strong password, get JWT
3. `POST /auth/login` - Login anytime, get fresh JWT
4. `POST /checkWallet` - Get your Solana deposit address
5. Send PIPE tokens to that address (external wallet)
6. `POST /checkCustomToken` - Verify PIPE balance
7. `POST /upload?file_name=X` - Upload files
8. `GET /download?file_name=X` - Download files

---

## Authentication

### Create User
**Endpoint:** `POST /users`  
**Status:** ✅ Fully Working  
**Auth:** None required  

```json
Request:
{
  "username": "your-username"
}

Response 200:
{
  "user_id": "uuid",
  "user_app_key": "hex-string", 
  "solana_pubkey": "base58-address"
}
```

**Notes:**
- Username must be unique
- Returns credentials immediately
- `solana_pubkey` is your deposit address
- Password is NOT set yet (must call `/auth/set-password`)

---

### Set Password
**Endpoint:** `POST /auth/set-password`  
**Status:** ✅ Fully Working  
**Auth:** Requires user_id + user_app_key  

```json
Request:
{
  "user_id": "uuid",
  "user_app_key": "hex-string",
  "new_password": "StrongPass123!@#"
}

Response 200:
{
  "access_token": "jwt...",
  "refresh_token": "jwt...",
  "expires_in": 900,
  "token_type": "Bearer",
  "message": "Password set successfully"
}
```

**Notes:**
- MUST use `new_password` field name (not `password`)
- **Password MUST be strong:** 8+ chars with uppercase, lowercase, numbers, and symbols
- Weak passwords accepted here but fail at login with "Invalid credentials"
- Returns JWT tokens immediately
- Access token expires in 15 minutes (900 seconds)

---

### Login
**Endpoint:** `POST /auth/login`  
**Status:** ✅ Fully Working  
**Auth:** None required  

```json
Request:
{
  "username": "your-username",
  "password": "StrongPass123!@#"
}

Response 200:
{
  "access_token": "jwt...",
  "refresh_token": "jwt...", 
  "expires_in": 900,
  "token_type": "Bearer"
}
```

**Notes:**
- Use username (not user_id)
- Password must be set first via `/auth/set-password`
- **Password MUST be strong:** 8+ chars with uppercase, lowercase, numbers, and symbols
- Weak passwords cause "Invalid credentials" error
- Example working password: `StrongPass123!@#`

---

### Refresh Token
**Endpoint:** `POST /auth/refresh`  
**Status:** ⏳ Not tested yet  
**Auth:** Requires refresh_token  

---

## Wallet & Balance

### Check Wallet (SOL Balance)
**Endpoint:** `POST /checkWallet` ⚠️ **POST not GET!**  
**Status:** ✅ Fully Working  
**Auth:** JWT required  

```json
Request:
POST /checkWallet
Authorization: Bearer {access_token}
Content-Type: application/json

{}

Response 200:
{
  "user_id": "uuid",
  "public_key": "base58-solana-address",
  "balance_lamports": 0,
  "balance_sol": 0.0
}
```

**Notes:**
- **MUST be POST request with empty JSON body `{}`**
- Returns SOL balance (not PIPE tokens)
- `public_key` is your deposit address for funding
- Send PIPE tokens to this address to fund your account

---

### Check PIPE Token Balance
**Endpoint:** `POST /checkCustomToken` ⚠️ **POST not GET!**  
**Status:** ✅ Fully Working  
**Auth:** JWT required  

```json
Request:
POST /checkCustomToken
Authorization: Bearer {access_token}
Content-Type: application/json

{}

Response 200:
{
  "user_id": "uuid",
  "public_key": "base58-address",
  "token_mint": "7s9MoSt7VV1J3jVNnw2AyocsQDBdCkPYz5apQDPKy9i5",
  "amount": "1000000000",
  "ui_amount": 1.0
}
```

**Notes:**
- **MUST be POST request with empty JSON body `{}`**
- Returns PIPE token balance
- `amount` is in smallest units (like lamports)
- `ui_amount` is human-readable (1.0 = 1 PIPE)
- `token_mint` is the PIPE token address on Solana

---

### Sync Deposits
**Endpoint:** `POST /syncDeposits`  
**Status:** ✅ Working (silent response)  
**Auth:** JWT required  

**Notes:**
- Returns empty response on success
- Deposits auto-sync every ~30 seconds anyway
- Only needed if you want immediate sync after funding

---

## File Operations

### Upload File
**Endpoint:** `POST /upload?file_name={filename}`  
**Status:** ✅ Fully Working  
**Auth:** JWT required  

```bash
Request:
POST /upload?file_name=test.txt
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

Form data:
- file: (binary data)

Success Response 200:
File uploaded (296 bytes) - Background transfer in progress

Payment Required Response 402:
{
  "error": "Insufficient deposit balance",
  "message": "Insufficient deposit. You have 0 PIPE...",
  "deposit_balance_pipe": 0.0,
  "estimated_cost_pipe": 3.078e-8,
  "storage_quota_gb": 0.0,
  "tier": "Normal",
  "wallet_address": "solana-address"
}
```

**Notes:**
- File name is query parameter, not form field
- Upload is multipart/form-data with field name `file`
- Returns HTTP 402 when no PIPE balance (NOT x402 protocol, just HTTP 402)
- Shows exact cost estimate and wallet address when unfunded
- Upload happens in background (async processing)
- Cost for small files (<1KB) is negligible
- **CRITICAL:** Response returns a status message ("File uploaded..."), NOT a filename
  - Save the `file_name` query parameter you used - you'll need it for downloads
  - DO NOT try to parse a filename from the response
  - Use the exact same `file_name` value for downloads later

---

### Download File
**Endpoint:** `GET /download?file_name={filename}` OR `GET /download-stream?file_name={filename}`
**Status:** ✅ Fully Working
**Auth:** JWT required

```bash
Request:
GET /download?file_name=test.txt
Authorization: Bearer {access_token}

Response 200:
--------------------------{boundary}
Content-Disposition: form-data; name="file"; filename="test.txt"
Content-Type: text/plain

{file content here}

--------------------------{boundary}--
```

**Notes:**
- Both `/download` and `/download-stream` work identically
- Returns file wrapped in multipart/form-data format
- Need to parse out the actual file content from multipart wrapper
- Boundary is auto-generated, varies per request
- **CRITICAL:** The `file_name` parameter MUST be the exact filename used during upload
  - Upload response returns a status message ("File uploaded..."), NOT a new filename
  - Always use the same filename you sent in the upload `?file_name=` parameter
  - Example: If you upload with `?file_name=photo.jpg`, download with `?file_name=photo.jpg`
  - **DO NOT use blake3 hash or any derived identifier - use the original filename!**
  - The SDK returns both `fileId` (blake3 hash) and `fileName` (original name)
  - For downloads, ALWAYS use `fileName`, NOT `fileId`

---

### Priority Upload
**Endpoint:** `POST /priorityUpload?file_name={filename}`  
**Status:** ⏳ Not tested yet  
**Auth:** JWT required  

---

### Delete File
**Endpoint:** `DELETE /deleteFile?file_name={filename}`  
**Status:** ⏳ Not tested yet  
**Auth:** JWT required  

---

## Other Endpoints (Not Tested Yet)

### Get Tier Pricing
**Endpoint:** `GET /getTierPricing`  
**Status:** ⏳ Not tested yet  

---

### Token Usage
**Endpoint:** `GET /api/token-usage`  
**Status:** ⏳ Not tested yet  

---

### Public Links
**Endpoint:** `POST /createPublicLink`  
**Status:** ⏳ Not tested yet  

**Endpoint:** `DELETE /deletePublicLink`  
**Status:** ⏳ Not tested yet  

---

## Known Issues & Gotchas

1. **CLI uses wrong endpoint by default**  
   - Fix: Always use `--api https://us-west-01-firestarter.pipenetwork.com`

2. **Docs say `/createUser` but actual endpoint is `/users`**  
   - Use: `POST /users`

3. **Password field naming inconsistent**  
   - Set password requires: `new_password`
   - Login requires: `password`

4. **Password strength requirements are enforced at login, not set-password**  
   - Weak passwords accepted during `/auth/set-password` but fail at `/auth/login`
   - Must be 8+ chars with uppercase, lowercase, numbers, and symbols
   - Example working: `StrongPass123!@#`

5. **JWT expires after 15 minutes**  
   - Need to implement refresh token flow for long-running apps
   - Can always re-login to get fresh token

6. **Balance check endpoints are POST, not GET**  
   - `/checkWallet` requires POST with empty `{}` body
   - `/checkCustomToken` requires POST with empty `{}` body

7. **Download returns multipart/form-data format**  
   - Files are wrapped in multipart envelope
   - Need to parse out actual content (between Content-Type line and boundary)

8. **Old `/exchangeSolForTokens` endpoint doesn't exist on mainnet**  
   - Mainnet uses direct PIPE token deposits instead
   - Send PIPE tokens directly to wallet address from `/checkWallet`

---

## Testing Status Summary

| Endpoint | Method | Status | Notes |
|----------|--------|--------|-------|
| `/users` | POST | ✅ Working | Creates user successfully |
| `/auth/set-password` | POST | ✅ Working | Returns JWT tokens |
| `/auth/login` | POST | ✅ Working | Returns JWT tokens |
| `/checkWallet` | POST | ✅ Working | Returns SOL balance & deposit address |
| `/checkCustomToken` | POST | ✅ Working | Returns PIPE token balance |
| `/syncDeposits` | POST | ✅ Working | Silent success response |
| `/upload` | POST | ✅ Working | Uploads files, returns 402 when unfunded |
| `/download` | GET | ✅ Working | Downloads files as multipart |
| `/download-stream` | GET | ✅ Working | Same as /download |
| `/auth/refresh` | POST | ⏳ Not tested | - |
| `/priorityUpload` | POST | ⏳ Not tested | - |
| `/deleteFile` | DELETE | ⏳ Not tested | - |
| `/getTierPricing` | GET | ⏳ Not tested | - |
| `/api/token-usage` | GET | ⏳ Not tested | - |
| `/createPublicLink` | POST | ⏳ Not tested | - |
| `/deletePublicLink` | DELETE | ⏳ Not tested | - |

---

## Tested Account

For verification purposes:
- Username: `wallettest1762286471`
- Deposit Address: `F6XKjzTGF3XCAgVkVSajv37WGF3fuY7ENhrnHLUQ6Ghs`
- Successfully uploaded and downloaded: `test-pipe-upload.txt` (296 bytes)
- Balance: 1.0 PIPE
