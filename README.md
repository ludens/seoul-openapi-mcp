# seoul-openapi-mcp

서울 공공데이터 OpenAPI를 MCP 도구로 노출하는 TypeScript 서버입니다.

## npx로 바로 사용

패키지를 설치하지 않고 `npx`로 실행합니다.

```bash
SEOUL_OPENAPI_KEY=발급받은_일반_인증키 SEOUL_SUBWAY_OPENAPI_KEY=발급받은_지하철_인증키 npx seoul-openapi-mcp
```

`SEOUL_OPENAPI_KEY`에는 일반 서울 열린데이터광장 인증키를 넣고, `SEOUL_SUBWAY_OPENAPI_KEY`에는 지하철 OpenAPI 호스트용 인증키를 넣습니다.

## MCP 클라이언트 설정 예시

MCP 클라이언트 설정에 아래 서버를 추가합니다. `command`는 `npx`, `args`는 자동 설치 확인 옵션 `-y`와 패키지명 `seoul-openapi-mcp`입니다.

```json
{
  "mcpServers": {
    "seoul-openapi": {
      "command": "npx",
      "args": ["-y", "seoul-openapi-mcp"],
      "env": {
        "SEOUL_OPENAPI_KEY": "발급받은_일반_인증키",
        "SEOUL_SUBWAY_OPENAPI_KEY": "발급받은_지하철_인증키"
      }
    }
  }
}
```

## 제공 도구

| 도구 | 설명 | 주요 입력 |
| --- | --- | --- |
| `seoul_get_air_quality_by_district` | `ListAirQualityByDistrictService`에서 서울시 실시간 자치구별 최신 대기환경 현황을 조회합니다. | 선택 `districtCode`, 선택 `districtName` |
| `seoul_get_subway_realtime_station_arrival` | `realtimeStationArrival`에서 서울시 지하철역 실시간 도착정보를 조회합니다. | 필수 `stationName`, 선택 `startIndex`, 선택 `endIndex` |
| `seoul_search_good_price_shops` | 저장소에 포함된 static JSON에서 서울 착한가격업소와 상품 가격을 검색합니다. API를 호출하지 않습니다. | 선택 `query`, `districtName`, `industryCode`, `industryName`, `itemName`, `maxItemPrice`, `limit`, `offset` |

## 로컬 개발

저장소를 직접 수정하거나 테스트할 때만 필요합니다.

```bash
pnpm install
cp .env.example .env
pnpm dev
```

`.env`의 `SEOUL_OPENAPI_KEY`와 `SEOUL_SUBWAY_OPENAPI_KEY`에 호스트별 인증키를 넣습니다.

검증:

```bash
pnpm check
pnpm test
pnpm build
```

MCP Inspector로 테스트 서버를 띄울 때:

```bash
pnpm inspect
```

WSL에서 Windows 브라우저로 접속해야 할 때:

```bash
pnpm inspect:wsl
```

## 로컬 빌드 실행

빌드 후 stdio transport로 실행합니다.

```bash
pnpm build
node dist/index.js
```

## 구조

- `src/index.ts`: stdio MCP 서버 엔트리
- `src/server.ts`: MCP 서버 생성과 도구 등록
- `src/services/seoulOpenApiClient.ts`: 서울 OpenAPI 공통 클라이언트
- `src/tools/`: OpenAPI별 MCP 도구
- `src/schemas/`: Zod 입력/출력 스키마
- `apis/AirQualityByDistrict/`: 서울시 실시간 자치구별 대기환경 현황 문서와 코드표
- `apis/RealtimeStationArrival/`: 서울시 지하철 실시간 도착정보 문서와 역 정보
- `data/PriceModelStore/`: 착한가격업소 현황과 상품목록 static JSON
