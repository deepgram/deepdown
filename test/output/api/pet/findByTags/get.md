# GET /pet/findByTags

Multiple tags can be provided with comma separated strings. Use tag1, tag2, tag3 for testing.

## Table of Contents

- [Overview](#overview)
- [API Information](#api-information)
- [Authentication](#authentication)
- [Parameters](#parameters)
- [Response](#response)
- [Example Usage](#example-usage)

## Overview

Finds Pets by tags.

## API Information

- **API**: Swagger Petstore - OpenAPI 3.0 (v1.0.26)
- **Operation ID**: `findPetsByTags`
- **Endpoint**: `GET /pet/findByTags`

## Authentication

Authentication is required for this endpoint:

- **petstore_auth**: write:pets, read:pets
## Authentication

No authentication is required for this endpoint.

## Parameters

| Name | Located In | Required | Type | Description |
|------|------------|:--------:|------|-------------|
| `tags` | query | No | array | Tags to filter by |

## Response

### Status Code: `200`

successful operation


#### Content Type: `application/json`


Type: `array`

Items: References `#/components/schemas/Pet`

#### Content Type: `application/xml`


Type: `array`

Items: References `#/components/schemas/Pet`
### Status Code: `400`

Invalid tag value

### Status Code: `default`

Unexpected error


## Example Usage

### cURL

```bash
curl -X GET "https://petstore.swagger.io/api/v3/pet/findByTagsfalse" \
  -H "Accept: application/json" \
  -H "Content-Type: application/json"
```

---

## Disclaimer: Deepdown

_This Markdown file was generated using [**Deepdown**](https://github.com/deepgram/deepdown), a templating format for AI-ready JSON Schema content._
_Do not edit this file directly — update the `.deepdown` source instead._