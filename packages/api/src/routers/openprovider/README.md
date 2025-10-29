# OpenProvider tRPC Integration

This package provides a comprehensive tRPC integration for OpenProvider's domain reseller API. It includes all the functionality needed to build a complete domain reseller system.

## Features

### ✅ Implemented Features

- **Authentication**: Login with credentials or environment variables
- **TLD Management**: Retrieve TLDs with pricing and configuration
- **Domain Operations**: 
  - Check domain availability and pricing
  - Register new domains
  - Transfer domains from other registrars
  - Search and manage existing domains
  - Update domain attributes (contacts, nameservers, etc.)
  - Renew domains
  - Get/reset auth codes
  - Delete and restore domains
- **Customer Management**: 
  - Create customer handles
  - Search existing customers
  - Update customer information
- **DNS Management**: 
  - Create DNS zones
  - Manage DNS records (add, update, remove)
  - Search DNS zones
  - Delete DNS zones
- **Additional Data**: Get TLD-specific requirements
- **Email Verification**: Start and check gTLD email verification status
- **SSL Certificates**: Get SSL products and place orders

### 🔧 Improvements Over Original Implementation

1. **Comprehensive Coverage**: Covers all OpenProvider API endpoints, not just authentication and TLD retrieval
2. **Better Error Handling**: Proper tRPC error handling with detailed error messages
3. **Type Safety**: Full TypeScript support with comprehensive type definitions
4. **Caching**: Built-in caching for TLD requests to reduce API calls
5. **Retry Logic**: Automatic retry with exponential backoff for failed requests
6. **Batch Processing**: Handles large domain check requests by batching
7. **Validation**: Comprehensive input validation using Zod schemas
8. **Environment Support**: Secure credential management using environment variables
9. **Health Checks**: Built-in health check endpoints to verify integration status

## API Structure

The OpenProvider integration is organized into the following routers:

```
openProvider/
├── auth/           # Authentication endpoints
├── tlds/           # TLD management endpoints
├── domains/        # Domain operations endpoints
├── customers/      # Customer/handle management endpoints
├── dns/            # DNS zone management endpoints
└── healthCheck/    # Health check endpoints
```

## Usage Examples

### Authentication

```typescript
// Login with credentials
const authResult = await trpc.openProvider.auth.login.mutate({
  username: "your_username",
  password: "your_password",
  ip: "0.0.0.0"
});

// Login with environment variables
const authResult = await trpc.openProvider.auth.login.mutate({
  useEnvCredentials: true
});
```

### TLD Management

```typescript
// Get all active TLDs
const tlds = await trpc.openProvider.tlds.getTlds.query({
  limit: 100,
  status: "ACT",
  with_price: true
});

// Get popular TLDs
const popularTlds = await trpc.openProvider.tlds.getPopularTlds.query();

// Search TLDs by pattern
const searchResults = await trpc.openProvider.tlds.searchTlds.query({
  pattern: "com",
  limit: 10
});
```

### Domain Operations

```typescript
// Check domain availability
const availability = await trpc.openProvider.domains.checkAvailability.mutate({
  name: "example",
  extensions: [".com", ".net", ".org"],
  with_price: true
});

// Register a domain
const registration = await trpc.openProvider.domains.register.mutate({
  name: "example",
  extension: ".com",
  period: 1,
  owner_handle: "CV904716-NL",
  admin_handle: "CV904716-NL",
  tech_handle: "CV904716-NL",
  autorenew: "default"
});

// Search domains
const domains = await trpc.openProvider.domains.search.query({
  domain_name_pattern: "example",
  limit: 50
});
```

### Customer Management

```typescript
// Create a customer handle
const customer = await trpc.openProvider.customers.create.mutate({
  name: {
    first_name: "John",
    last_name: "Doe"
  },
  address: {
    street: "Main Street",
    number: "123",
    zipcode: "12345",
    city: "Amsterdam",
    country: "NL"
  },
  phone: {
    country_code: "+31",
    area_code: "20",
    subscriber_number: "1234567"
  },
  email: "john@example.com"
});

// Search customers
const customers = await trpc.openProvider.customers.search.query({
  email_pattern: "john@example.com",
  limit: 10
});
```

### DNS Management

```typescript
// Create a DNS zone
const zone = await trpc.openProvider.dns.createZone.mutate({
  domain: {
    name: "example",
    extension: ".com"
  },
  type: "master",
  records: [
    {
      name: "@",
      type: "A",
      value: "192.168.1.1",
      ttl: 3600
    }
  ]
});

// Add DNS records
const update = await trpc.openProvider.dns.addRecords.mutate({
  zoneName: "example.com",
  records: [
    {
      name: "www",
      type: "CNAME",
      value: "example.com",
      ttl: 3600
    }
  ]
});
```

## Environment Variables

Set up the following environment variables for secure credential management:

```env
OPENPROVIDER_USERNAME=your_email@example.com
OPENPROVIDER_PASSWORD=your_password_here
OPENPROVIDER_IP=0.0.0.0  # Optional
```

## Error Handling

The integration provides comprehensive error handling:

```typescript
try {
  const result = await trpc.openProvider.domains.register.mutate(data);
} catch (error) {
  if (error.code === 'BAD_REQUEST') {
    // Handle validation errors
    console.error('Validation error:', error.message);
  } else if (error.code === 'UNAUTHORIZED') {
    // Handle authentication errors
    console.error('Authentication failed:', error.message);
  } else if (error.code === 'TIMEOUT') {
    // Handle timeout errors
    console.error('Request timeout:', error.message);
  }
}
```

## Health Checks

Check the integration status:

```typescript
const health = await trpc.openProvider.healthCheck.status.get.query();
console.log(health);
// Output:
// {
//   status: 'healthy',
//   message: 'OpenProvider integration is working correctly',
//   details: {
//     authenticated: true,
//     base_url: 'https://api.openprovider.eu',
//     api_version: 'v1beta'
//   }
// }
```

## Caching

The integration includes intelligent caching:

- **TLD requests** are cached for 1 hour
- **Automatic cache invalidation** after expiration
- **Cache statistics** available via client methods
- **Manual cache clearing** when needed

## Rate Limiting & Retry Logic

- **Automatic retry** with exponential backoff for failed requests
- **Timeout handling** with configurable timeouts
- **Batch processing** for large domain check requests
- **Request optimization** to minimize API calls

## Type Safety

All endpoints are fully typed with TypeScript:

```typescript
import type { 
  OpenProviderTld,
  OpenProviderDomainCheckResult,
  OpenProviderCustomerRequest 
} from '@npanel/api/types/openprovider';
```

## Testing

The integration includes comprehensive error handling and validation, making it suitable for production use. All endpoints include:

- Input validation using Zod schemas
- Proper error handling and status codes
- Detailed error messages and field-level validation
- Comprehensive logging for debugging

## Migration from Original API

The new tRPC implementation is a complete replacement for the original Next.js API routes. Key differences:

1. **Type Safety**: Full TypeScript support vs. manual type checking
2. **Error Handling**: Proper tRPC error handling vs. manual error responses
3. **Caching**: Built-in intelligent caching vs. manual cache implementation
4. **Validation**: Zod schema validation vs. manual validation
5. **Completeness**: All OpenProvider endpoints vs. limited subset

## Next Steps

This implementation provides a solid foundation for a domain reseller system. Future enhancements could include:

- **Webhook handling** for domain status updates
- **Bulk operations** for managing multiple domains
- **Advanced caching strategies** with Redis
- **Monitoring and metrics** for API usage
- **Rate limiting** and quota management
- **Audit logging** for compliance

## Support

For issues or questions about the OpenProvider integration, refer to:

- [OpenProvider API Documentation](https://docs.openprovider.com/)
- [OpenProvider Support](https://support.openprovider.eu/)
- Internal documentation and code comments
