import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SeoulOpenApiClient } from "../services/seoulOpenApiClient.js";
import {
  SubwayRealtimeStationArrivalInputSchema,
  SubwayRealtimeStationArrivalInputShape,
  SubwayRealtimeStationArrivalOutputSchema,
  type SubwayRealtimeStationArrivalOutput,
} from "../schemas/seoulOpenApiSchemas.js";

const SUBWAY_REALTIME_STATION_ARRIVAL_SERVICE = "realtimeStationArrival";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractRows(data: unknown): Record<string, unknown>[] {
  if (!isRecord(data)) {
    return [];
  }

  const rows = data.realtimeArrivalList;
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.filter(isRecord);
}

export async function fetchSubwayRealtimeStationArrival(
  client: SeoulOpenApiClient,
  rawParams: unknown,
): Promise<SubwayRealtimeStationArrivalOutput> {
  const params = SubwayRealtimeStationArrivalInputSchema.parse(rawParams);
  const data = await client.fetchJson({
    serviceName: SUBWAY_REALTIME_STATION_ARRIVAL_SERVICE,
    startIndex: params.startIndex,
    endIndex: params.endIndex,
    pathParams: [params.stationName],
  });

  return {
    serviceName: SUBWAY_REALTIME_STATION_ARRIVAL_SERVICE,
    startIndex: params.startIndex,
    endIndex: params.endIndex,
    stationName: params.stationName,
    rows: extractRows(data),
    data,
  };
}

export function registerSubwayRealtimeStationArrivalTool(
  server: McpServer,
  client: SeoulOpenApiClient,
): void {
  server.registerTool(
    "seoul_get_subway_realtime_station_arrival",
    {
      title: "Get Seoul Subway Realtime Station Arrival",
      description: `Fetch real-time subway arrival information for a Seoul station from realtimeStationArrival.

Use this for current arrival messages by station, including line ID, up/down direction, train destination, estimated arrival seconds, train number, terminal station, generated time, arrival messages, arrival code, and last-train flag.

Args:
  - stationName: required subway station name, for example 강남, 서울, 홍대입구
  - startIndex: optional Seoul subway OpenAPI start index; defaults to 0
  - endIndex: optional Seoul subway OpenAPI end index; defaults to 20

Returns structured JSON with the service name, request range, station name, extracted realtimeArrivalList rows, and raw Seoul subway OpenAPI response data.`,
      inputSchema: SubwayRealtimeStationArrivalInputShape,
      outputSchema: SubwayRealtimeStationArrivalOutputSchema.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (rawParams) => {
      const output = await fetchSubwayRealtimeStationArrival(client, rawParams);

      return {
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    },
  );
}
