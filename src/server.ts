import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AppConfig } from "./config.js";
import { SeoulOpenApiClient } from "./services/seoulOpenApiClient.js";
import { registerOpenApiTools } from "./tools/openApiTools.js";

const AIR_QUALITY_OPENAPI_BASE_URL = "http://openapi.seoul.go.kr:8088";
const SUBWAY_OPENAPI_BASE_URL = "http://swopenAPI.seoul.go.kr/api/subway";

export function createSeoulOpenApiMcpServer(config: AppConfig): McpServer {
  const server = new McpServer({
    name: "seoul-openapi-mcp",
    version: "0.1.0",
  });

  const client = new SeoulOpenApiClient({
    apiKey: config.seoulOpenApi.apiKey,
    apiKeyName: "SEOUL_OPENAPI_KEY",
    baseUrl: AIR_QUALITY_OPENAPI_BASE_URL,
  });
  const subwayClient = new SeoulOpenApiClient({
    apiKey: config.seoulOpenApi.subwayApiKey,
    apiKeyName: "SEOUL_SUBWAY_OPENAPI_KEY",
    baseUrl: SUBWAY_OPENAPI_BASE_URL,
    minStartIndex: 0,
  });
  registerOpenApiTools(server, client, subwayClient);

  return server;
}
