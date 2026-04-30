# External API Guide (AI Image Generator)

This guide explains how to connect to the nPanel AI Image Generator API from external systems like Cursor, VS Code, or custom applications.

## Authentication

All requests require an API Key passed in the `Authorization` header as a Bearer token.

**Header:**
`Authorization: Bearer npanel_sk_YOUR_API_KEY`

> [!NOTE]
> You can generate an API Key from your nPanel dashboard under **Settings > API Keys**.

## Endpoint

**POST** `https://api.npanel.io/api/ai/image-generator`

(Replace `api.npanel.io` with your server's domain)

## Request Format

The request body must be a JSON object.

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `prompt` | `string` | Yes | Description of the image you want to generate. |
| `referenceImageUrls` | `string[]` | No | List of URLs for reference images (max 14). |
| `aspectRatio` | `string` | No | One of: `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`. Default: `4:3`. |
| `outputFormat` | `string` | No | `png` or `jpg`. Default: `png`. |
| `resolution` | `string` | No | `1K`, `2K`, or `4K`. Default: `2K`. |
| `teamId` | `string` | No* | Required for **Customer** accounts to deduct credits. |

## Response Format

On success, the API returns a 200 OK with the following JSON:

```json
{
  "success": true,
  "generationId": "uuid-string",
  "imageUrl": "https://replicate.delivery/pbxt/..."
}
```

## Sample Request (cURL)

```bash
curl -X POST https://api.npanel.io/api/ai/image-generator \
  -H "Authorization: Bearer npanel_sk_your_key_here" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A futuristic city in the clouds, cyberpunk style",
    "aspectRatio": "16:9",
    "resolution": "2K"
  }'
```

## Postman Instructions

To use this API in Postman:

1.  **Method**: Set the request type to **POST**.
2.  **URL**: Enter `https://api.npanel.io/api/ai/image-generator`.
3.  **Auth**:
    *   Go to the **Auth** tab.
    *   Select **Bearer Token** from the dropdown.
    *   Enter your API key: `npanel_sk_YOUR_KEY`.
4.  **Body**:
    *   Go to the **Body** tab.
    *   Select **raw** and then **JSON**.
    *   Paste the following sample:
        ```json
        {
          "prompt": "A scenic mountain view at sunset",
          "aspectRatio": "16:9"
        }
        ```
5.  **Settings**:
    *   Go to the **Settings** tab.
    *   Ensure **Request timeout** is set to at least `60000` (60 seconds) to allow time for the AI to generate the image.
6.  **Send**: Click Send and wait for the image URL in the response.

## Troubleshooting

- **401 Unauthorized**: Your API key is missing, invalid, or expired.
- **403 Forbidden**: Insufficient credits or no active subscription for the team.
- **400 Bad Request**: Missing required fields or invalid input format.
- **500 Internal Server Error**: The AI model encountered an error or timed out.

> [!IMPORTANT]
> The generation process usually takes **10-30 seconds**. Ensure your client timeout is set to at least 60 seconds. This API currently uses the **Google Imagen 4 Ultra** model for state-of-the-art results.
