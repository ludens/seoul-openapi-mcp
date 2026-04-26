import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { SeoulOpenApiClient } from "../services/seoulOpenApiClient.js";
import {
  AirQualityDistricts,
  AirQualityByDistrictInputSchema,
  AirQualityByDistrictInputShape,
  AirQualityByDistrictOutputSchema,
  type AirQualityByDistrictInput,
  type AirQualityByDistrictOutput,
} from "../schemas/seoulOpenApiSchemas.js";

const AIR_QUALITY_BY_DISTRICT_SERVICE = "ListAirQualityByDistrictService";
const LATEST_START_INDEX = 1;
const LATEST_END_INDEX = 25;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractRows(data: unknown): Record<string, unknown>[] {
  if (!isRecord(data)) {
    return [];
  }

  const serviceData = data[AIR_QUALITY_BY_DISTRICT_SERVICE];
  if (!isRecord(serviceData)) {
    return [];
  }

  const rows = serviceData.row;
  if (!Array.isArray(rows)) {
    return [];
  }

  return rows.filter(isRecord);
}

function findDistrictByCode(code: string) {
  return AirQualityDistricts.find((district) => district.code === code);
}

function findDistrictByName(name: string) {
  return AirQualityDistricts.find((district) => district.name === name);
}

function resolveDistrictFilter(params: AirQualityByDistrictInput): {
  districtCode?: string;
  districtName?: string;
} {
  const districtByCode = params.districtCode
    ? findDistrictByCode(params.districtCode)
    : undefined;
  const districtByName = params.districtName
    ? findDistrictByName(params.districtName)
    : undefined;

  if (
    districtByCode &&
    districtByName &&
    districtByCode.code !== districtByName.code
  ) {
    throw new Error(
      "districtCode and districtName must refer to the same district",
    );
  }

  const district = districtByCode ?? districtByName;
  if (!district) {
    return {};
  }

  return {
    districtCode: district.code,
    districtName: district.name,
  };
}

export async function fetchAirQualityByDistrict(
  client: SeoulOpenApiClient,
  rawParams: unknown,
): Promise<AirQualityByDistrictOutput> {
  const params = AirQualityByDistrictInputSchema.parse(rawParams);
  const districtFilter = resolveDistrictFilter(params);
  const data = await client.fetchJson({
    serviceName: AIR_QUALITY_BY_DISTRICT_SERVICE,
    startIndex: LATEST_START_INDEX,
    endIndex: LATEST_END_INDEX,
    pathParams: districtFilter.districtCode ? [districtFilter.districtCode] : [],
  });

  return {
    serviceName: AIR_QUALITY_BY_DISTRICT_SERVICE,
    startIndex: LATEST_START_INDEX,
    endIndex: LATEST_END_INDEX,
    ...districtFilter,
    rows: extractRows(data),
    data,
  };
}

export function registerAirQualityByDistrictTool(
  server: McpServer,
  client: SeoulOpenApiClient,
): void {
  server.registerTool(
    "seoul_get_air_quality_by_district",
    {
      title: "Get Seoul Air Quality By District",
      description: `Fetch real-time Seoul air-quality readings by district from ListAirQualityByDistrictService.

Use this for current district-level Seoul air quality, including integrated air-quality index, grade, decisive pollutant, NO2, O3, CO, SO2, PM-10, and PM-2.5.

Args:
  - districtCode: optional MSRSTN_PBADMS_CD filter from apis/AirQualityByDistrict/MSRSTN_PBADMS_CD.csv, for example 111121 for 중구 or 111261 for 강남구
  - districtName: optional district name from apis/AirQualityByDistrict/MSRSTN_PBADMS_CD.csv, for example 중구 or 강남구; converted to districtCode before request

Returns structured JSON with the fixed service name, fixed latest-data request range 1-25, optional district code/name, extracted row array, and raw Seoul OpenAPI response data.`,
      inputSchema: AirQualityByDistrictInputShape,
      outputSchema: AirQualityByDistrictOutputSchema.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async (rawParams) => {
      const output = await fetchAirQualityByDistrict(client, rawParams);

      return {
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    },
  );
}
