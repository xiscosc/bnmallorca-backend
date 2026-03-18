# BN Mallorca Backend - Claude Context

## Project Overview
Backend and infrastructure for the BN Mallorca Radio App. This is a serverless AWS CDK application built with TypeScript that provides APIs and background processing for a radio streaming application.

## Technology Stack
- **Infrastructure**: AWS CDK (TypeScript)
- **Runtime**: Node.js with TypeScript
- **AWS Services**: Lambda, DynamoDB, S3, SNS, SQS
- **External APIs**: Deezer API, Icecast metadata streaming
- **Testing**: Jest
- **Code Quality**: Biome (linter/formatter)

## Project Structure
```
bn_mallorca_backend/
├── bin/                    # CDK app entry point
├── lib/                    # CDK infrastructure code
│   ├── bn-mallorca-stack.ts
│   ├── bn-mallorca.ts
│   └── constructs/        # CDK constructs
├── src/
│   ├── function/          # Lambda function handlers
│   │   ├── album-art/    # Album art caching
│   │   ├── device/       # Device subscription management
│   │   ├── schedule/     # Radio schedule endpoints
│   │   └── track/        # Track metadata polling
│   ├── net/              # External service clients (S3, SNS, Deezer, etc.)
│   ├── repository/       # Data access layer (DynamoDB)
│   ├── types/            # TypeScript type definitions
│   └── config/           # Configuration
└── open-api.v1.json      # API specification
```

## Key Features & Architecture

### Track Polling System
Continuously polls Icecast metadata streams (with Centova fallback) to detect currently playing songs. An EventBridge rule triggers every minute, filling an SQS queue with staggered messages. Each message triggers a Lambda that checks for track changes, processes new tracks (fetches album art, stores in DynamoDB, publishes to SNS for push notifications).

### Album Art Caching
Fetches and caches album artwork using the Deezer public API (no auth required). On cache miss, searches Deezer for the track, retrieves cover URLs in 3 sizes from the Deezer CDN, and asynchronously caches images in S3 with metadata in DynamoDB.
### Device Subscriptions
Manages push notification subscriptions for mobile devices via SNS. Handles registration (creates SNS platform endpoints and topic subscriptions), unregistration (soft disable), and scheduled cleanup of stale devices.
### HTTP API
API Gateway HTTP API with throttling serving track list, schedule, and device registration endpoints.

## Development Commands
```bash
# Build
npm run build

# Watch mode
npm run watch

# Run tests
npm test

# Linting
npm run biome        # Check code
npm run biome:fix    # Auto-fix issues

# CDK operations
npm run cdk deploy
npm run cdk synth

# Generate OpenAPI types
npm run generate:openapi
```

## Lambda Functions (11 total)
Located in `src/function/`:
- **Album Art**: Album artwork download and caching
- **Device**: Device registration, unsubscription, and push notification management
- **Schedule**: Radio schedule retrieval
- **Track**: Track metadata polling, queue management, and metadata updates

## Data Layer
Repositories in `src/repository/`:
- `device.repository.ts` - Device subscription data
- `schedule.repository.ts` - Radio schedule data
- `album-art.repository.ts` - Album art cache
- `track-list.repository.ts` - Track history
- `dynamo-repository.ts` - Base DynamoDB operations

## External Integrations
Files in `src/net/`:
- `deezer.ts` - Deezer API integration (public, no auth required)
- `metadata.ts` - Icecast metadata streaming
- `centova.downloader.ts` - Centova Cast integration
- `album-art.downloader.ts` - Album artwork downloading
- `s3.ts`, `sns.ts`, `lambda.ts` - AWS service clients

## Configuration
- `tsconfig.json` - TypeScript configuration with strict mode
- `cdk.json` - CDK app configuration
- `biome.json` - Linting and formatting rules
- `jest.config.json` - Test configuration
- `src/config/env.ts` - Environment variable handling

## API Documentation
The OpenAPI specification is available in `open-api.v1.json` with generated TypeScript types.

## Testing
Uses Jest with TypeScript support. Mock utilities available via `jest-mock-extended` and `jest-when`.

## Important Notes
- CI/CD: GitHub Actions workflow for AWS deployment (see `.github/`)

## Common Tasks

### Adding a New Lambda Function
1. Create handler in `src/function/<category>/<name>.lambda.ts`
2. Add construct in `lib/constructs/`
3. Wire up in `lib/bn-mallorca-stack.ts`
4. Update OpenAPI spec if it's an API endpoint

### Modifying Track Metadata Logic
Key files:
- `src/net/metadata.ts` - Icecast streaming and parsing
- `src/function/track/` - Track processing lambdas
- `src/types/icecast-metadata-js.d.ts` - Type definitions

### Working with DynamoDB
- Use repository pattern in `src/repository/`
- Extend `dynamo-repository.ts` for common operations
- Keep data access logic separate from Lambda handlers

## Dependencies of Note
- `icecast-metadata-js` - Icecast metadata stream parsing
- `lambda-log` - Structured logging
- `luxon` - Date/time handling
- `lodash` - Utility functions
- AWS SDK v3 clients for all AWS services
