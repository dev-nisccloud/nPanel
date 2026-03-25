import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createOpenproviderClient, OpenproviderApiError } from '@/lib/openprovider-client';
import type { OpenproviderAuthRequest } from '@/types/openprovider';

// Validation schema for login request (optional when using env vars)
const LoginRequestSchema = z.object({
  username: z.string().min(1, 'Username is required').optional(),
  password: z.string().min(1, 'Password is required').optional(),
  ip: z.string().regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/).optional(),
  useEnvCredentials: z.boolean().optional().default(false),
});

// Environment variable validation schema
const EnvCredentialsSchema = z.object({
  OPENPROVIDER_USERNAME: z.string().min(1, 'OPENPROVIDER_USERNAME is required'),
  OPENPROVIDER_PASSWORD: z.string().min(1, 'OPENPROVIDER_PASSWORD is required'),
  OPENPROVIDER_IP: z.string().regex(/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/).optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validatedData = LoginRequestSchema.parse(body);

    let authRequest: OpenproviderAuthRequest;

    // Check if we should use environment variables for credentials
    if (validatedData.useEnvCredentials) {
      // Validate environment variables
      const envCredentials = EnvCredentialsSchema.parse({
        OPENPROVIDER_USERNAME: process.env.OPENPROVIDER_USERNAME,
        OPENPROVIDER_PASSWORD: process.env.OPENPROVIDER_PASSWORD,
        OPENPROVIDER_IP: process.env.OPENPROVIDER_IP,
      });

      authRequest = {
        username: envCredentials.OPENPROVIDER_USERNAME,
        password: envCredentials.OPENPROVIDER_PASSWORD,
        ip: envCredentials.OPENPROVIDER_IP,
      };
    } else {
      // Use credentials from request body
      if (!validatedData.username || !validatedData.password) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 400,
              message: 'Username and password are required when not using environment credentials',
            },
          },
          { status: 400 }
        );
      }

      authRequest = {
        username: validatedData.username,
        password: validatedData.password,
        ip: validatedData.ip,
      };
    }

    // Create Openprovider client
    const client = createOpenproviderClient();

    // Authenticate with Openprovider
    const authResponse = await client.authenticate(authRequest);

    // Check if authentication was successful
    if (authResponse.code !== 0) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: authResponse.code,
            message: authResponse.desc,
          },
        },
        { status: 400 }
      );
    }

    // Return successful authentication response
    return NextResponse.json({
      success: true,
      data: {
        token: authResponse.data.token,
        reseller_id: authResponse.data.reseller_id,
      },
    });

  } catch (error) {
    console.error('Openprovider authentication error:', error);

    // Handle validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
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
      return NextResponse.json(
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
    return NextResponse.json(
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
