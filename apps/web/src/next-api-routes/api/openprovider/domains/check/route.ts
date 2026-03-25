import { z } from 'zod';
import { createOpenproviderClient, OpenproviderApiError } from '@/lib/openprovider-client';
import type { OpenproviderDomainCheckRequest, OpenproviderDomainCheckResponse } from '@/types/openprovider';

// Validation schema for domain check request
const DomainCheckRequestSchema = z.object({
  // Either provide specific domains with extensions, or just a name to check all extensions
  domains: z.array(z.object({
    name: z.string().min(1, 'Domain name is required'),
    extension: z.string().min(1, 'Domain extension is required'),
  })).optional(),
  // Or provide just a name to check against all available extensions
  name: z.string().min(1, 'Domain name is required').optional(),
  // Optional array of specific extensions to check (only used when name is provided)
  extensions: z.array(z.string().min(1, 'Extension cannot be empty')).optional(),
  // Pagination removed - using specific extensions only
  with_price: z.boolean().optional().default(true),
  with_whois: z.boolean().optional().default(true),
  additional_data: z.object({
    idn_script: z.string().optional(),
  }).optional(),
}).refine((data) => data.domains || data.name, {
  message: "Either 'domains' array or 'name' must be provided"
});

export async function POST(request: Request) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = DomainCheckRequestSchema.parse(body);

    // Authenticate using environment variables
    const authResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/openprovider/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ useEnvCredentials: true }),
    });

    if (!authResponse.ok) {
      const errorData = await authResponse.json();
      return Response.json(
        {
          success: false,
          error: {
            code: 401,
            message: errorData.error?.message || 'Authentication failed',
          },
        },
        { status: 401 }
      );
    }

    const authData = await authResponse.json();
    const token = authData.data.token;

    // Create Openprovider client and set token
    const client = createOpenproviderClient();
    client.setToken(token);

    let checkRequest: OpenproviderDomainCheckRequest;

    // If only name is provided, get available TLDs with pagination, then check each one
    if (validatedData.name && !validatedData.domains) {
      let domains: any[] = [];

      // If specific extensions are provided, use those
      if (validatedData.extensions && validatedData.extensions.length > 0) {
        domains = validatedData.extensions.map((extension: string) => ({
          name: validatedData.name,
          extension: extension,
        }));
      } else {
        // If no specific extensions provided, return error
        return Response.json(
          {
            success: false,
            error: {
              code: 400,
              message: "No extensions provided. Please select specific extensions or provide a domains array.",
            },
          },
          { status: 400 }
        );
      }

      checkRequest = {
        domains,
        with_price: validatedData.with_price,
        with_whois: validatedData.with_whois,
        additional_data: validatedData.additional_data,
      };
    } else {
      // Use provided domains array
      checkRequest = {
        domains: validatedData.domains,
        with_price: validatedData.with_price,
        with_whois: validatedData.with_whois,
        additional_data: validatedData.additional_data,
      };
    }

    // Call Openprovider domain check API
    let checkResponse: OpenproviderDomainCheckResponse;
    
    // If we have many domains, batch them into smaller requests
    if (checkRequest.domains && checkRequest.domains.length > 10) {
      const batchSize = 10;
      const batches: OpenproviderDomainCheckRequest[] = [];
      
      for (let i = 0; i < checkRequest.domains.length; i += batchSize) {
        const batch = checkRequest.domains.slice(i, i + batchSize);
        batches.push({
          domains: batch,
          with_price: checkRequest.with_price,
          with_whois: checkRequest.with_whois,
          additional_data: checkRequest.additional_data,
        });
      }
      
      // Process each batch
      const batchResults: any[] = [];
      for (const batch of batches) {
        const batchResponse = await client.checkDomains(batch);
        if (batchResponse.code !== 0) {
          return Response.json(
            {
              success: false,
              error: {
                code: batchResponse.code,
                message: batchResponse.desc,
              },
            },
            { status: 400 }
          );
        }
        batchResults.push(...batchResponse.data.results);
      }
      
      // Combine all batch results
      checkResponse = {
        code: 0,
        desc: "OK",
        data: {
          results: batchResults
        }
      };
    } else {
      // Single request for small batches
      checkResponse = await client.checkDomains(checkRequest);
      
      // Check if request was successful
      if (checkResponse.code !== 0) {
        return Response.json(
          {
            success: false,
            error: {
              code: checkResponse.code,
              message: checkResponse.desc,
            },
          },
          { status: 400 }
        );
      }
    }

    // No pagination needed for specific extensions approach

    // Return successful response with full data
    return Response.json({
      success: true,
      data: checkResponse.data,
      meta: {
        checked_at: new Date().toISOString(),
        total_domains_checked: checkRequest.domains?.length || 0,
        request_type: validatedData.name 
          ? (validatedData.extensions && validatedData.extensions.length > 0 
              ? 'name_with_specific_extensions' 
              : 'name_with_custom_extensions')
          : 'specific_domains',
      },
      raw_response: checkResponse, // Include the full raw response for debugging
    });

  } catch (error) {
    console.error('Openprovider domain check error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return Response.json(
        {
          success: false,
          error: {
            code: 400,
            message: 'Invalid request data',
            details: error.issues.map((err: any) => ({
              field: err.path.join('.'),
              message: err.message,
            })),
          },
        },
        { status: 400 }
      );
    }

    // Handle Openprovider API errors
    if (error instanceof OpenproviderApiError) {
      return Response.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.description,
          },
        },
        { status: error.code >= 400 && error.code < 500 ? error.code : 500 }
      );
    }

    // Handle unexpected errors
    return Response.json(
      {
        success: false,
        error: {
          code: 500,
          message: 'Internal server error',
        },
      },
      { status: 500 }
    );
  }
}
