import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SeoulOpenApiClient } from "../services/seoulOpenApiClient.js";
import { registerAirQualityByDistrictTool } from "./airQualityByDistrictTool.js";

export function registerOpenApiTools(
  server: McpServer,
  client: SeoulOpenApiClient,
): void {
  registerAirQualityByDistrictTool(server, client);
}
