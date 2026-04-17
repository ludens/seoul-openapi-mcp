# seoul-openapi-mcp-server

서울 공공데이터 OpenAPI를 MCP 도구로 노출하는 TypeScript 서버입니다.

## 준비

```bash
pnpm install
cp .env.example .env
```

`.env`의 `SEOUL_OPENAPI_KEY`에 서울 열린데이터광장 인증키를 넣습니다.

## 개발

```bash
pnpm dev
pnpm check
pnpm test
pnpm build
```

## MCP 연결

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
