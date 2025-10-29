import axios, { type AxiosInstance, type AxiosError } from 'axios';
import type { 
  OpenproviderConfig, 
  OpenproviderAuthRequest, 
  OpenproviderAuthResponse,
  OpenproviderTldRequest,
  OpenproviderTldResponse,
  OpenproviderDomainCheckRequest,
  OpenproviderDomainCheckResponse,
  OpenproviderError 
} from '@/types/openprovider';

export class OpenproviderApiError extends Error {
  constructor(
    public code: number,
    public description: string,
    public originalError?: AxiosError
  ) {
    super(`Openprovider API Error ${code}: ${description}`);
    this.name = 'OpenproviderApiError';
  }
}

export class OpenproviderClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor(private config: OpenproviderConfig) {
    this.client = axios.create({
      baseURL: `${config.baseUrl}/${config.apiVersion}`,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add request interceptor to include auth token
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.data) {
          const errorData = error.response.data as OpenproviderError;
          throw new OpenproviderApiError(
            errorData.code,
            errorData.desc,
            error
          );
        }
        throw new OpenproviderApiError(
          error.response?.status || 0,
          error.message,
          error
        );
      }
    );
  }

  /**
   * Authenticate with Openprovider API
   * @param credentials - Login credentials
   * @returns Promise with auth response containing token
   */
  async authenticate(credentials: OpenproviderAuthRequest): Promise<OpenproviderAuthResponse> {
    try {
      const response = await this.client.post<OpenproviderAuthResponse>('/auth/login', credentials);
      
      // Store token for future requests
      if (response.data.code === 0 && response.data.data?.token) {
        this.token = response.data.data.token;
      }
      
      return response.data;
    } catch (error) {
      if (error instanceof OpenproviderApiError) {
        throw error;
      }
      throw new OpenproviderApiError(0, 'Authentication failed', error as AxiosError);
    }
  }

  /**
   * Set authentication token manually
   * @param token - Bearer token
   */
  setToken(token: string): void {
    this.token = token;
  }

  /**
   * Get current authentication token
   * @returns Current token or null
   */
  getToken(): string | null {
    return this.token;
  }

  /**
   * Retrieve TLDs and pricing information with retry logic
   * @param params - Query parameters for TLD search
   * @returns Promise with TLD response
   */
  async getTlds(params: OpenproviderTldRequest = {}): Promise<OpenproviderTldResponse> {
    const maxRetries = 3;
    const baseDelay = 1000; // 1 second base delay
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Increase timeout for TLD requests as they can be slow
        const timeout = Math.min(this.config.timeout * (1 + attempt * 0.5), 120000); // Max 2 minutes
        
        const response = await this.client.get<OpenproviderTldResponse>('/tlds', {
          params: {
            limit: 100, // Default limit
            status: 'ACT', // Only active TLDs by default
            with_price: true, // Include pricing by default
            with_description: true,
            with_restrictions: true,
            ...params,
          },
          timeout,
        });
        
        return response.data;
      } catch (error) {
        const isLastAttempt = attempt === maxRetries;
        const isTimeoutError = error instanceof OpenproviderApiError && 
          (error.description.includes('timeout') || error.originalError?.code === 'ECONNABORTED');
        
        if (isTimeoutError && !isLastAttempt) {
          // Wait with exponential backoff before retrying
          const delay = baseDelay * Math.pow(2, attempt - 1);
          console.warn(`TLD request timeout (attempt ${attempt}/${maxRetries}), retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        
        if (error instanceof OpenproviderApiError) {
          throw error;
        }
        throw new OpenproviderApiError(0, 'Failed to retrieve TLDs', error as AxiosError);
      }
    }
    
    // This should never be reached, but just in case
    throw new OpenproviderApiError(0, 'Failed to retrieve TLDs after all retry attempts');
  }

  /**
   * Check if client is authenticated
   * @returns True if token is available
   */
  isAuthenticated(): boolean {
    return this.token !== null;
  }

  /**
   * Check domain availability and pricing
   * @param params - Domain check parameters
   * @returns Promise with domain check response
   */
  async checkDomains(params: OpenproviderDomainCheckRequest): Promise<OpenproviderDomainCheckResponse> {
    try {
      const response = await this.client.post<OpenproviderDomainCheckResponse>('/domains/check', params);
      return response.data;
    } catch (error) {
      if (error instanceof OpenproviderApiError) {
        throw error;
      }
      throw new OpenproviderApiError(0, 'Failed to check domains', error as AxiosError);
    }
  }

  /**
   * Clear authentication token
   */
  clearAuth(): void {
    this.token = null;
  }
}

// Factory function to create client instance
export function createOpenproviderClient(config: Partial<OpenproviderConfig> = {}) {
  const defaultConfig: OpenproviderConfig = {
    baseUrl: 'https://api.openprovider.eu',
    apiVersion: 'v1beta',
    timeout: 30000,
    ...config,
  };
  
  return new OpenproviderClient(defaultConfig);
}
