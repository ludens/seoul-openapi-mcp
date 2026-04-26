import { describe, expect, test } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { z } from "zod";
import { AirQualityByDistrictOutputSchema } from "../src/schemas/seoulOpenApiSchemas.js";
import { SeoulOpenApiClient } from "../src/services/seoulOpenApiClient.js";
import { fetchAirQualityByDistrict } from "../src/tools/airQualityByDistrictTool.js";

function loadEnvFile(): NodeJS.ProcessEnv {
  if (!existsSync(".env")) {
    return process.env;
  }

  const env = { ...process.env };
  for (const line of readFileSync(".env", "utf8").split(/\r?\n/)) {
    const trimmedLine = line.trim();
    if (!trimmedLine || trimmedLine.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmedLine.indexOf("=");
    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine.slice(separatorIndex + 1).trim();
    env[key] = value.replace(/^["']|["']$/g, "");
  }

  return env;
}

describe("fetchAirQualityByDistrict", () => {
  test("describes Seoul OpenAPI air-quality row fields in the output schema", () => {
    const rowsSchema = AirQualityByDistrictOutputSchema.shape.rows;
    expect(rowsSchema).toBeInstanceOf(z.ZodArray);

    const rowSchema = rowsSchema.element;
    expect(rowSchema).toBeInstanceOf(z.ZodObject);

    const rowShape = (rowSchema as z.ZodObject<z.ZodRawShape>).shape;
    expect(rowShape.MSRMT_YMD.description).toContain("측정일시");
    expect(rowShape.CAI.description).toContain("통합대기환경지수");
    expect(rowShape.PM.description).toContain("PM10");
    expect(rowShape.FPM.description).toContain("PM2.5");
  });

  test("fetches latest district air-quality rows from the real Seoul API using .env", async () => {
    const env = loadEnvFile();
    const apiKey = env.SEOUL_OPENAPI_KEY?.trim();
    if (!apiKey) {
      throw new Error("Set SEOUL_OPENAPI_KEY before running this test.");
    }

    const client = new SeoulOpenApiClient({
      apiKey,
      baseUrl: "http://openapi.seoul.go.kr:8088",
    });

    const output = await fetchAirQualityByDistrict(client, {
      districtCode: "111121",
    });

    expect(output.serviceName).toBe("ListAirQualityByDistrictService");
    expect(output.startIndex).toBe(1);
    expect(output.endIndex).toBe(25);
    expect(output.districtCode).toBe("111121");
    expect(output.districtName).toBe("중구");
    expect(output.rows.length).toBeGreaterThan(0);
    expect(output.rows[0]).toMatchObject({
      MSRSTN_PBADMS_CD: "111121",
      MSRSTN_NM: "중구",
    });
  });

  test("maps a district name from MSRSTN_PBADMS_CD.csv to the matching district code", async () => {
    let requestedUrl: string | undefined;
    const client = new SeoulOpenApiClient({
      apiKey: "test-key",
      baseUrl: "http://openapi.seoul.go.kr:8088",
      fetch: async (url) => {
        requestedUrl = url.toString();
        return new Response(
          JSON.stringify({
            ListAirQualityByDistrictService: {
              row: [{ MSRSTN_PBADMS_CD: "111261", MSRSTN_NM: "강남구" }],
            },
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      },
    });

    const output = await fetchAirQualityByDistrict(client, {
      districtName: "강남구",
    });

    expect(requestedUrl).toBe(
      "http://openapi.seoul.go.kr:8088/test-key/json/ListAirQualityByDistrictService/1/25/111261/",
    );
    expect(output.districtCode).toBe("111261");
    expect(output.districtName).toBe("강남구");
  });

  test("rejects mismatched district code and district name", async () => {
    const client = new SeoulOpenApiClient({
      apiKey: "test-key",
      baseUrl: "http://openapi.seoul.go.kr:8088",
      fetch: async () => {
        throw new Error("fetch should not be called");
      },
    });

    await expect(
      fetchAirQualityByDistrict(client, {
        districtCode: "111121",
        districtName: "강남구",
      }),
    ).rejects.toThrow(
      "districtCode and districtName must refer to the same district",
    );
  });

  test("rejects caller supplied pagination because the tool fetches the latest current data range", async () => {
    const client = new SeoulOpenApiClient({
      apiKey: "test-key",
      baseUrl: "http://openapi.seoul.go.kr:8088",
    });

    await expect(
      fetchAirQualityByDistrict(client, {
        startIndex: 1,
        endIndex: 5,
      }),
    ).rejects.toThrow("Unrecognized key(s) in object");
  });
});
