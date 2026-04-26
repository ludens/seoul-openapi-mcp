import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SeoulOpenApiClient } from "../services/seoulOpenApiClient.js";
import { registerAirQualityByDistrictTool } from "./airQualityByDistrictTool.js";
import { registerSubwayRealtimeStationArrivalTool } from "./subwayRealtimeStationArrivalTool.js";

export function registerOpenApiTools(
  server: McpServer,
  client: SeoulOpenApiClient,
  subwayClient: SeoulOpenApiClient,
): void {
  registerAirQualityByDistrictTool(server, client);
  registerSubwayRealtimeStationArrivalTool(server, subwayClient);
}
