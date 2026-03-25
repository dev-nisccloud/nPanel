# Openprovider API Integration

This directory contains API routes for integrating with Openprovider's domain reseller API. The integration follows the official Openprovider API documentation and implements the first two steps: authentication and TLD retrieval.

## Available Endpoints

### 1. Authentication

**POST** `/api/openprovider/auth/login`

Authenticates with Openprovider API and returns a bearer token for subsequent requests.

#### Request Body

**Method 1: Manual Credentials**
```json
{
  "username": "your_openprovider_username",
  "password": "your_openprovider_password",
  "ip": "0.0.0.0"
}
```

**Method 2: Environment Variables**
```json
{
  "useEnvCredentials": true,
  "ip": "0.0.0.0"
}
```

**Method 3: Mixed (Environment + Override)**
```json
{
  "useEnvCredentials": true,
  "ip": "192.168.1.1"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "token": "bearer_token_here",
    "reseller_id": 12345
  }
}
```

#### Error Response
```json
{
  "success": false,
  "error": {
    "code": 400,
    "message": "Invalid credentials"
  }
}
```

### 2. TLD Retrieval

**GET** `/api/openprovider/tlds`

Retrieves available TLDs (Top Level Domains) with pricing and configuration information.

#### Query Parameters
- `limit` (number, optional): Maximum number of results (1-1000, default: 100)
- `offset` (number, optional): Number of results to skip (default: 0)
- `extensions` (string, optional): Comma-separated list of TLD extensions to filter by
- `status` (string, optional): Filter by status - "ACT" or "INACT" (default: "ACT")
- `with_price` (boolean, optional): Include pricing information (default: true)
- `with_description` (boolean, optional): Include TLD descriptions (default: true)
- `with_restrictions` (boolean, optional): Include TLD restrictions (default: true)

#### Headers
- `Authorization: Bearer <token>` - Required authentication token

#### Response
```json
{
  "success": true,
  "data": {
    "results": [
      {
        "name": ".com",
        "min_period": 1,
        "max_period": 10,
        "transfer_available": true,
        "renew_available": true,
        "dnssec_allowed": true,
        "transfer_auth_code_required": true,
        "price": {
          "product": {
            "currency": "USD",
            "price": 12.99
          },
          "reseller": {
            "currency": "USD",
            "price": 8.99
          }
        },
        "is_premium": false,
        "description": "Commercial domains",
        "restrictions": []
      }
    ],
    "total": 150
  },
  "cached": false,
  "fetched_at": "2024-01-15T10:30:00.000Z"
}
```

**POST** `/api/openprovider/tlds`

Alternative method for TLD retrieval with request body instead of query parameters. Same parameters as GET request but sent in the request body.

## Features

### Caching
- TLD responses are cached for 1 hour to reduce API calls
- Cache is automatically invalidated after the cache duration
- Cached responses include a `cached: true` flag

### Error Handling
- Comprehensive error handling for all API responses
- Validation errors with detailed field information
- Openprovider API errors are properly forwarded
- HTTP status codes match the error type

### Authentication
- Bearer token authentication for TLD endpoints
- Automatic token management in the client
- Secure token storage and transmission

### Validation
- Request validation using Zod schemas
- Type-safe request/response handling
- Input sanitization and validation

## Usage Examples

### 1. Authenticate

#### Method 1: Using Request Body (Manual Credentials)

**Windows Command Prompt (cmd):**
```cmd
curl -X POST http://localhost:3000/api/openprovider/auth/login -H "Content-Type: application/json" -d "{\"username\":\"your_username\",\"password\":\"your_password\"}"
```

**Windows PowerShell:**
```powershell
curl -X POST http://localhost:3000/api/openprovider/auth/login -H "Content-Type: application/json" -d '{\"username\":\"your_username\",\"password\":\"your_password\"}'
```

#### Method 2: Using Environment Variables (Recommended for Production)

**Step 1: Create environment file**
Create a `.env.local` file in your project root with your Openprovider credentials:
```env
OPENPROVIDER_USERNAME=your_email@example.com
OPENPROVIDER_PASSWORD=your_password_here
OPENPROVIDER_IP=0.0.0.0
```

**Step 2: Use environment authentication**
**Windows Command Prompt (cmd):**
```cmd
curl -X POST http://localhost:3000/api/openprovider/auth/login -H "Content-Type: application/json" -d "{\"useEnvCredentials\":true}"
```

**Windows PowerShell:**
```powershell
curl -X POST http://localhost:3000/api/openprovider/auth/login -H "Content-Type: application/json" -d '{\"useEnvCredentials\":true}'
```

#### Method 3: Mixed Approach (Override Environment with Request Body)
```cmd
curl -X POST http://localhost:3000/api/openprovider/auth/login -H "Content-Type: application/json" -d "{\"useEnvCredentials\":true,\"ip\":\"192.168.1.1\"}"
```

### 2. Get All Active TLDs

**Windows Command Prompt (cmd):**
```cmd
curl -X GET "http://localhost:3000/api/openprovider/tlds" -H "Authorization: Bearer your_token_here"
```

**Windows PowerShell:**
```powershell
curl -X GET "http://localhost:3000/api/openprovider/tlds" -H "Authorization: Bearer your_token_here"
```

### 3. Get Specific TLDs with Pricing

**Windows Command Prompt (cmd):**
```cmd
curl -X GET "http://localhost:3000/api/openprovider/tlds?extensions=.com,.net,.org&with_price=true" -H "Authorization: Bearer your_token_here"
```

**Windows PowerShell:**
```powershell
curl -X GET "http://localhost:3000/api/openprovider/tlds?extensions=.com,.net,.org&with_price=true" -H "Authorization: Bearer your_token_here"
```

### 4. Search TLDs with Pagination

**Windows Command Prompt (cmd):**
```cmd
curl -X GET "http://localhost:3000/api/openprovider/tlds?limit=50&offset=100&status=ACT" -H "Authorization: Bearer your_token_here"
```

**Windows PowerShell:**
```powershell
curl -X GET "http://localhost:3000/api/openprovider/tlds?limit=50&offset=100&status=ACT" -H "Authorization: Bearer your_token_here"
```

### 5. Advanced TLD Search with Multiple Parameters

**Windows Command Prompt (cmd):**
```cmd
curl -X GET "http://localhost:3000/api/openprovider/tlds?extensions=.com,.net,.org,.info&limit=25&offset=0&status=ACT&with_price=true&with_description=true" -H "Authorization: Bearer your_token_here"
```

**Windows PowerShell:**
```powershell
curl -X GET "http://localhost:3000/api/openprovider/tlds?extensions=.com,.net,.org,.info&limit=25&offset=0&status=ACT&with_price=true&with_description=true" -H "Authorization: Bearer your_token_here"
```

### 6. Using POST Method for TLD Search

**Windows Command Prompt (cmd):**
```cmd
curl -X POST "http://localhost:3000/api/openprovider/tlds" -H "Content-Type: application/json" -H "Authorization: Bearer your_token_here" -d "{\"extensions\":[\".com\",\".net\",\".org\"],\"limit\":50,\"with_price\":true}"
```

**Windows PowerShell:**
```powershell
curl -X POST "http://localhost:3000/api/openprovider/tlds" -H "Content-Type: application/json" -H "Authorization: Bearer your_token_here" -d '{\"extensions\":[\".com\",\".net\",\".org\"],\"limit\":50,\"with_price\":true}'
```

## Windows-Specific Notes

### Command Prompt (cmd.exe)
- Use double quotes around the entire URL and headers
- Escape inner quotes with backslashes: `\"`
- Put everything on one line to avoid issues with line continuation
- Example: `curl -X POST "url" -H "header" -d "{\"key\":\"value\"}"`

### PowerShell
- Can use single quotes for the outer string and escape inner quotes
- Supports backtick (`) for line continuation
- Example: `curl -X POST "url" -H "header" -d '{\"key\":\"value\"}'`

### Alternative: Using Invoke-RestMethod (PowerShell)
For better JSON handling in PowerShell, you can also use:

```powershell
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer your_token_here"
}

$body = @{
    username = "your_username"
    password = "your_password"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/openprovider/auth/login" -Method POST -Headers $headers -Body $body
```

## TypeScript Support

The API is fully typed with TypeScript interfaces available in `@/types/openprovider.ts`:

- `OpenproviderAuthRequest` - Login request type
- `OpenproviderAuthResponse` - Login response type
- `OpenproviderTldRequest` - TLD query parameters type
- `OpenproviderTldResponse` - TLD response type
- `OpenproviderTld` - Individual TLD object type

## Utility Functions

Helper functions are available in `@/lib/openprovider-utils.ts`:

- `formatTldForDisplay()` - Format TLD data for UI display
- `filterTlds()` - Filter TLDs by various criteria
- `sortTlds()` - Sort TLDs by different fields
- `getPopularTldExtensions()` - Get list of popular TLD extensions
- `isValidDomainName()` - Validate domain name format
- `isValidTldExtension()` - Validate TLD extension format

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid parameters or validation errors |
| 401 | Unauthorized - Missing or invalid authentication token |
| 500 | Internal Server Error - Unexpected server errors |

## Rate Limiting

The Openprovider API has rate limits. The client includes:
- Request timeout of 30 seconds
- Proper error handling for rate limit responses
- Caching to reduce API calls

## Environment Variables

The API supports reading Openprovider credentials from environment variables for enhanced security and convenience.

### Required Environment Variables
- `OPENPROVIDER_USERNAME` - Your Openprovider username (usually email)
- `OPENPROVIDER_PASSWORD` - Your Openprovider password

### Optional Environment Variables
- `OPENPROVIDER_IP` - IP address for authentication (if required)
- `OPENPROVIDER_BASE_URL` - API base URL (defaults to https://api.openprovider.eu)
- `OPENPROVIDER_API_VERSION` - API version (defaults to v1beta)
- `OPENPROVIDER_TIMEOUT` - Request timeout in milliseconds (defaults to 30000)

### Setting Up Environment Variables

1. **Create `.env.local` file** in your project root:
```env
OPENPROVIDER_USERNAME=your_email@example.com
OPENPROVIDER_PASSWORD=your_password_here
OPENPROVIDER_IP=0.0.0.0
```

2. **Or use system environment variables**:
```bash
# Windows Command Prompt
set OPENPROVIDER_USERNAME=your_email@example.com
set OPENPROVIDER_PASSWORD=your_password_here

# Windows PowerShell
$env:OPENPROVIDER_USERNAME="your_email@example.com"
$env:OPENPROVIDER_PASSWORD="your_password_here"
```

3. **Use the environment authentication**:
```cmd
curl -X POST http://localhost:3000/api/openprovider/auth/login -H "Content-Type: application/json" -d "{\"useEnvCredentials\":true}"
```

## Security Considerations

- Never log sensitive information like passwords or tokens
- Use HTTPS in production
- Store tokens securely
- Implement proper authentication checks
- Validate all input data
- Use environment variables for production credentials
- Never commit `.env.local` files to version control

## Next Steps

This implementation covers the first two steps of the Openprovider integration:
1. ✅ Authentication
2. ✅ TLD retrieval and pricing

Future steps would include:
- Customer handle management
- Domain availability checking
- Domain registration and transfer
- DNS management
- Additional products (SSL, SpamExpert)
