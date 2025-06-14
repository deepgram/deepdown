# GET /pet/findByStatus

Multiple status values can be provided with comma separated strings.

## Table of Contents

- [Overview](#overview)
- [API Information](#api-information)
- [Authentication](#authentication)
- [Parameters](#parameters)
- [Response](#response)
- [Example Usage](#example-usage)

## Overview

Finds Pets by status.

## API Information

- **API**: Swagger Petstore - OpenAPI 3.0 (v1.0.26)
- **Operation ID**: `findPetsByStatus`
- **Endpoint**: `GET /pet/findByStatus`

## Authentication

Authentication is required for this endpoint:

- **petstore_auth**: write:pets, read:pets

## Parameters

| Name | Located In | Required | Type | Description |
|------|------------|:--------:|------|-------------|
| `status` | query | No | string | Status values that need to be considered for filter |


## Response

### Status Code: `200`

successful operation

#### Content Type: `application/json`

#### Content Type: `application/xml`

### Status Code: `400`

Invalid status value

### Status Code: `default`

Unexpected error


## Example Usage

### cURL

```bash
curl -X GET "/api/v3/pet/findByStatus" \
-H "Accept: application/json" \
-H "Content-Type: application/json"
```

---

## Disclaimer: Deepdown

_This Markdown file was generated using the experimental [**Deepdown**](https://github.com/deepgram/deepdown), a
templating format for AI-ready JSON Schema content._
_Do not edit this file directly — update the `.deepdown` source instead._