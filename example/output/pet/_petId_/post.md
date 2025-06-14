# POST /pet/{petId}

Updates a pet resource based on the form data.

## Table of Contents

- [Overview](#overview)
- [API Information](#api-information)
- [Authentication](#authentication)
- [Parameters](#parameters)
- [Response](#response)
- [Example Usage](#example-usage)

## Overview

Updates a pet in the store with form data.

## API Information

- **API**: Swagger Petstore - OpenAPI 3.0 (v1.0.26)
- **Operation ID**: `updatePetWithForm`
- **Endpoint**: `POST /pet/{petId}`

## Authentication

Authentication is required for this endpoint:

- **petstore_auth**: write:pets, read:pets

## Parameters

| Name | Located In | Required | Type | Description |
|------|------------|:--------:|------|-------------|
| `petId` | path | Yes | integer
(int64) | ID of pet that needs to be updated |
| `name` | query | No | string | Name of pet that needs to be updated |
| `status` | query | No | string | Status of pet that needs to be updated |


## Response

### Status Code: `200`

successful operation

#### Content Type: `application/json`

References schema: `#/components/schemas/Pet`
#### Content Type: `application/xml`

References schema: `#/components/schemas/Pet`
### Status Code: `400`

Invalid input

### Status Code: `default`

Unexpected error


## Example Usage

### cURL

```bash
curl -X POST "/api/v3/pet/{petId}" \
-H "Accept: application/json" \
-H "Content-Type: application/json"
```

---

## Disclaimer: Deepdown

_This Markdown file was generated using the experimental [**Deepdown**](https://github.com/deepgram/deepdown), a
templating format for AI-ready JSON Schema content._
_Do not edit this file directly — update the `.deepdown` source instead._