# BN Mallorca [![staging](https://github.com/xiscosc/bn_mallorca_backend/actions/workflows/deploy-staging.yml/badge.svg)](https://github.com/xiscosc/bn_mallorca_backend/actions/workflows/deploy-staging.yml) [![prod](https://github.com/xiscosc/bn_mallorca_backend/actions/workflows/deploy-prod.yml/badge.svg)](https://github.com/xiscosc/bn_mallorca_backend/actions/workflows/deploy-prod.yml)

Backend and infrastructure for the BN Mallorca Radio App.

## Technology Stack

- **Infrastructure**: AWS CDK (TypeScript)
- **Runtime**: Node.js with TypeScript
- **AWS Services**: Lambda, DynamoDB, S3, SNS, SQS, API Gateway
- **External APIs**: Deezer API, Icecast metadata streaming
- **Code Quality**: Biome (linter/formatter)

## Key Features

- **Track Polling**: Continuously polls Icecast metadata streams to track currently playing songs, storing track history in DynamoDB
- **Track List API**: Exposes recently played tracks via REST API
- **Album Art Caching**: Fetches and caches album artwork using Deezer API (public, no auth required), stores in S3
- **Device Subscriptions**: Manages push notification subscriptions for mobile devices via SNS
- **Radio Schedule**: Provides radio programming schedule endpoints

## Project Structure

```
bnmallorca-backend/
├── bin/                    # CDK app entry point
├── lib/                    # CDK infrastructure code
│   └── constructs/         # CDK constructs
├── src/
│   ├── function/           # Lambda function handlers
│   │   ├── album-art/      # Album art caching
│   │   ├── device/         # Device registration and cleanup
│   │   ├── schedule/       # Radio schedule endpoint
│   │   └── track/          # Track polling and track list API
│   ├── net/                # External service clients (Deezer, S3, SNS, etc.)
│   ├── repository/         # Data access layer (DynamoDB)
│   ├── service/            # Business logic
│   └── helpers/            # Utility functions
└── open-api.v1.json        # API specification
```

## Development

```bash
# Install dependencies
bun install

# Build
bun run build

# Linting
bun run biome        # Check code
bun run biome:fix    # Auto-fix issues

# CDK operations
bun run cdk deploy
bun run cdk synth

# Generate OpenAPI types
bun run generate:openapi
```

## Related Projects

- [BN Mallorca Android App](https://github.com/xiscosc/bnmallorca-android) - Android client application

## API Spec

[<img src="https://validator.swagger.io/validator?url=https://raw.githubusercontent.com/xiscosc/bn_mallorca_backend/main/open-api.v1.json">](open-api.v1.json)

## Architecture

### Track Polling

Every minute, the system polls the radio stream to detect the currently playing song. When a new track is found, it fetches album art, stores the track in history, and sends push notifications to all registered devices.

```mermaid
flowchart TD
    subgraph external [" "]
        ICE([fa:fa-headphones Icecast Stream])
        CEN([fa:fa-server Centova])
    end

    subgraph polling [" "]
        CRON[fa:fa-clock EventBridge - every minute]
        SQS[[fa:fa-layer-group SQS - 6 staggered messages]]
        POLL[/fa:fa-bolt Poll Track/]
    end

    subgraph processing [" "]
        PROC[/fa:fa-bolt Process Track/]
        ART[fa:fa-image Album Art]
        DB[(fa:fa-database TrackList)]
        SNS{fa:fa-bell SNS Topic}
    end

    subgraph push [" "]
        APN([fa:fa-apple APNs])
        FCM([fa:fa-android FCM])
    end

    CRON --> SQS --> POLL
    POLL -->|ICY metadata| ICE
    POLL -.->|fallback| CEN
    POLL -->|new song?| DB
    POLL -->|changed| PROC
    PROC --> ART
    PROC --> DB
    PROC --> SNS
    SNS --> APN
    SNS --> FCM

    classDef aws fill:#ff9900,stroke:#232f3e,color:#fff,stroke-width:2px
    classDef ext fill:#4a90d9,stroke:#2c5f8a,color:#fff,stroke-width:2px
    classDef data fill:#3b48cc,stroke:#232f3e,color:#fff,stroke-width:2px
    classDef notify fill:#e74c3c,stroke:#c0392b,color:#fff,stroke-width:2px
    classDef device fill:#27ae60,stroke:#1e8449,color:#fff,stroke-width:2px

    class CRON,SQS aws
    class POLL,PROC aws
    class ICE,CEN ext
    class DB data
    class ART data
    class SNS notify
    class APN,FCM device
```

### Album Art Cache

When a new track is detected, the system looks up cover art by track ID. On cache hit, images are served directly from S3. On cache miss, it searches Deezer's public API, returns the URLs immediately, and caches the images asynchronously for next time.

```mermaid
flowchart TD
    subgraph lookup [" "]
        REQ([fa:fa-music New Track])
        CACHE[(fa:fa-database AlbumArt Table)]
    end

    subgraph hit [Cache Hit]
        S3[fa:fa-box-open S3 Bucket]
    end

    subgraph miss [Cache Miss]
        DEEZER([fa:fa-search Deezer API])
        ASYNC[/fa:fa-bolt Cache Art/]
        CDN([fa:fa-globe Deezer CDN])
        S3B[fa:fa-box-open S3 Bucket]
        CACHE2[(fa:fa-database AlbumArt Table)]
    end

    REQ --> CACHE
    CACHE -->|found| S3
    CACHE -->|not found| DEEZER
    DEEZER -->|cover URLs - 3 sizes| REQ
    DEEZER -.->|async| ASYNC
    ASYNC -->|download| CDN
    ASYNC -->|store images| S3B
    ASYNC -->|save metadata| CACHE2

    classDef aws fill:#ff9900,stroke:#232f3e,color:#fff,stroke-width:2px
    classDef ext fill:#4a90d9,stroke:#2c5f8a,color:#fff,stroke-width:2px
    classDef data fill:#3b48cc,stroke:#232f3e,color:#fff,stroke-width:2px
    classDef req fill:#8e44ad,stroke:#6c3483,color:#fff,stroke-width:2px

    class ASYNC aws
    class DEEZER,CDN ext
    class CACHE,CACHE2,S3,S3B data
    class REQ req
```

### Device Subscriptions

Mobile apps register for push notifications via the API. The system creates an SNS platform endpoint per device and subscribes it to the notification topic. Stale devices are automatically disabled and cleaned up on a schedule.

```mermaid
flowchart TD
    subgraph api [API]
        REG([fa:fa-plus POST /device/register])
        UNREG([fa:fa-minus POST /device/unregister])
    end

    subgraph register [Registration]
        REGLAM[/fa:fa-bolt Register/]
        EP[fa:fa-satellite-dish SNS Endpoint]
        SUB[fa:fa-rss SNS Subscription]
        DDB[(fa:fa-database Device Table)]
    end

    subgraph cleanup [Scheduled Cleanup]
        STALE[fa:fa-clock Hourly - disable stale devices]
        CLEAN[fa:fa-clock Every 10min - purge disabled]
        DELSNS[fa:fa-trash SNS Cleanup]
    end

    REG -->|async| REGLAM
    REGLAM --> EP
    REGLAM --> SUB
    REGLAM --> DDB
    UNREG -->|disable| DDB
    STALE -->|not seen in 24h| DDB
    CLEAN --> DDB
    CLEAN --> DELSNS

    classDef aws fill:#ff9900,stroke:#232f3e,color:#fff,stroke-width:2px
    classDef api fill:#27ae60,stroke:#1e8449,color:#fff,stroke-width:2px
    classDef data fill:#3b48cc,stroke:#232f3e,color:#fff,stroke-width:2px
    classDef sched fill:#7f8c8d,stroke:#5d6d7e,color:#fff,stroke-width:2px

    class REGLAM aws
    class REG,UNREG api
    class EP,SUB,DELSNS aws
    class DDB data
    class STALE,CLEAN sched
```

### HTTP API

The mobile app consumes these endpoints, all behind API Gateway with throttling.

```mermaid
flowchart LR
    APP([fa:fa-mobile-alt Mobile App])

    subgraph gateway [API Gateway]
        T[GET /tracks]
        S[GET /schedule]
        R[POST /device/register]
        U[POST /device/unregister]
    end

    subgraph lambdas [" "]
        TL[/fa:fa-bolt Tracks/]
        SL[/fa:fa-bolt Schedule/]
        RL[/fa:fa-bolt Register/]
        UL[/fa:fa-bolt Unregister/]
    end

    subgraph storage [" "]
        TDB[(fa:fa-database TrackList)]
        SDB[(fa:fa-database Schedule)]
        DDB[(fa:fa-database Devices)]
        SNS[fa:fa-bell SNS]
    end

    APP --> gateway
    T --> TL --> TDB
    S --> SL --> SDB
    R --> RL --> DDB
    RL --> SNS
    U --> UL --> DDB

    classDef aws fill:#ff9900,stroke:#232f3e,color:#fff,stroke-width:2px
    classDef api fill:#27ae60,stroke:#1e8449,color:#fff,stroke-width:2px
    classDef data fill:#3b48cc,stroke:#232f3e,color:#fff,stroke-width:2px
    classDef app fill:#8e44ad,stroke:#6c3483,color:#fff,stroke-width:2px

    class TL,SL,RL,UL aws
    class T,S,R,U api
    class TDB,SDB,DDB data
    class SNS aws
    class APP app
```
