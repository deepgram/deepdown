---
outputPattern: auth-test.md
---
# OpenAPI Curl Authentication Test

## Debug Security Objects Tests

### API Key Testing

```bash
-H &quot;api_key: YOUR_APIKEY&quot;
```

### OAuth2 Testing

```bash
-H &quot;Authorization: Bearer YOUR_OAUTH_TOKEN&quot; // Requires scopes: read:api, write:api
```

### HTTP Basic Testing 

```bash
-u &quot;YOUR_USERNAME:YOUR_PASSWORD&quot;
```

### HTTP Bearer Testing

```bash
-H &quot;Authorization: Bearer YOUR_BEARER_TOKEN&quot;
```

## Hardcoded Examples

```bash
# API Key Test
-H "api_key: YOUR_API_KEY"

# OAuth2 Test
-H "Authorization: Bearer YOUR_OAUTH_TOKEN" // Requires scopes: write:pets, read:pets
```

## Direct Schema Tests

### OAuth2 Auth (petstore_auth)

```bash
```

### API Key Auth (api_key)

```bash
```

## Operation Security Tests


