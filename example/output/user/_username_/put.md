# PUT /user/{username}

This can only be done by the logged in user.

## Table of Contents

- [Overview](#overview)
- [API Information](#api-information)
- [Authentication](#authentication)
- [Parameters](#parameters)
- [Request Body](#request-body)
- [Response](#response)
- [Example Usage](#example-usage)

## Overview

Update user resource.

## API Information

- **API**: Swagger Petstore - OpenAPI 3.0 (v1.0.26)
- **Operation ID**: `updateUser`
- **Endpoint**: `PUT /user/{username}`

## Authentication

No authentication is required for this endpoint.

## Parameters

| Name | Located In | Required | Type | Description |
|------|------------|:--------:|------|-------------|
| `username` | path | Yes | string | name that need to be deleted |

## Request Body

Update an existent user in the store

### Content Type: `application/json`
### Content Type: `application/xml`
### Content Type: `application/x-www-form-urlencoded`

## Response

### Status Code: `200`

successful operation

### Status Code: `400`

bad request

### Status Code: `404`

user not found

### Status Code: `default`

Unexpected error


## Example Usage

### cURL

```bash
curl -X PUT "/api/v3/user/{username}" \
-H "Accept: application/json" \
-H "Content-Type: application/json"
```

---

## Disclaimer: Deepdown

_This Markdown file was generated using the experimental [**Deepdown**](https://github.com/deepgram/deepdown), a
templating format for AI-ready JSON Schema content._
_Do not edit this file directly — update the `.deepdown` source instead._