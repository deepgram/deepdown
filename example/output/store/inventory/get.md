# GET /store/inventory

Returns a map of status codes to quantities.

## Table of Contents

- [Overview](#overview)
- [API Information](#api-information)
- [Authentication](#authentication)
- [Response](#response)
- [Example Usage](#example-usage)

## Overview

Returns pet inventories by status.

## API Information

- **API**: Swagger Petstore - OpenAPI 3.0 (v1.0.26)
- **Operation ID**: `getInventory`
- **Endpoint**: `GET /store/inventory`

## Authentication

Authentication is required for this endpoint:

- **api_key**: 



## Response

### Status Code: `200`

successful operation

#### Content Type: `application/json`

### Status Code: `default`

Unexpected error


## Example Usage

### cURL

```bash
curl -X GET "/api/v3/store/inventory" \
-H "Accept: application/json" \
-H "Content-Type: application/json"
```

---

## Disclaimer: Deepdown

_This Markdown file was generated using the experimental [**Deepdown**](https://github.com/deepgram/deepdown), a
templating format for AI-ready JSON Schema content._
_Do not edit this file directly — update the `.deepdown` source instead._