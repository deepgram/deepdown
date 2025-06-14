# DELETE /pet/{petId}

Delete a pet.

## Table of Contents

- [Overview](#overview)
- [API Information](#api-information)
- [Authentication](#authentication)
- [Parameters](#parameters)
- [Response](#response)
- [Example Usage](#example-usage)

## Overview

Deletes a pet.

## API Information

- **API**: Swagger Petstore - OpenAPI 3.0 (v1.0.26)
- **Operation ID**: `deletePet`
- **Endpoint**: `DELETE /pet/{petId}`

## Authentication

Authentication is required for this endpoint:

- **petstore_auth**: write:pets, read:pets

## Parameters

| Name | Located In | Required | Type | Description |
|------|------------|:--------:|------|-------------|
| `api_key` | header | No | string |  |
| `petId` | path | Yes | integer
(int64) | Pet id to delete |


## Response

### Status Code: `200`

Pet deleted

### Status Code: `400`

Invalid pet value

### Status Code: `default`

Unexpected error


## Example Usage

### cURL

```bash
curl -X DELETE "/api/v3/pet/{petId}" \
-H "Accept: application/json" \
-H "Content-Type: application/json"
```

---

## Disclaimer: Deepdown

_This Markdown file was generated using the experimental [**Deepdown**](https://github.com/deepgram/deepdown), a
templating format for AI-ready JSON Schema content._
_Do not edit this file directly — update the `.deepdown` source instead._