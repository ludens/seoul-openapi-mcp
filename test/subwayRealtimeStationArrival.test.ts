import { describe, expect, test } from "vitest";
import { z } from "zod";
import { SubwayRealtimeStationArrivalOutputSchema } from "../src/schemas/seoulOpenApiSchemas.js";
import { SeoulOpenApiClient } from "../src/services/seoulOpenApiClient.js";
import { fetchSubwayRealtimeStationArrival } from "../src/tools/subwayRealtimeStationArrivalTool.js";

describe("fetchSubwayRealtimeStationArrival", () => {
  test("describes Seoul subway realtime arrival row fields in the output schema", () => {
    const rowsSchema = SubwayRealtimeStationArrivalOutputSchema.shape.rows;
    expect(rowsSchema).toBeInstanceOf(z.ZodArray);

    const rowSchema = rowsSchema.element;
    expect(rowSchema).toBeInstanceOf(z.ZodObject);

    const rowShape = (rowSchema as z.ZodObject<z.ZodRawShape>).shape;
    expect(rowShape.subwayId.description).toContain("지하철호선ID");
    expect(rowShape.statnNm.description).toContain("지하철역명");
    expect(rowShape.barvlDt.description).toContain("초");
    expect(rowShape.arvlMsg2.description).toContain("도착");
    expect(rowShape.lstcarAt.description).toContain("막차");
  });

  test("fetches realtime arrivals for a station name from the subway OpenAPI", async () => {
    let requestedUrl: string | undefined;
    const client = new SeoulOpenApiClient({
      apiKey: "test-key",
      baseUrl: "http://swopenAPI.seoul.go.kr/api/subway",
      minStartIndex: 0,
      fetch: async (url) => {
        requestedUrl = url.toString();
        return new Response(
          JSON.stringify({
            realtimeArrivalList: [
              {
                subwayId: "1002",
                updnLine: "내선",
                trainLineNm: "성수행 - 역삼방면",
                statnNm: "강남",
                barvlDt: "180",
                arvlMsg2: "3분 후",
                arvlCd: "99",
                lstcarAt: "0",
              },
            ],
          }),
          { status: 200, headers: { "content-type": "application/json" } },
        );
      },
    });

    const output = await fetchSubwayRealtimeStationArrival(client, {
      stationName: "강남",
    });

    expect(requestedUrl).toBe(
      "http://swopenapi.seoul.go.kr/api/subway/test-key/json/realtimeStationArrival/0/20/%EA%B0%95%EB%82%A8/",
    );
    expect(output.serviceName).toBe("realtimeStationArrival");
    expect(output.stationName).toBe("강남");
    expect(output.startIndex).toBe(0);
    expect(output.endIndex).toBe(20);
    expect(output.rows).toHaveLength(1);
    expect(output.rows[0]).toMatchObject({
      subwayId: "1002",
      statnNm: "강남",
      arvlMsg2: "3분 후",
    });
  });

  test("supports caller supplied pagination within the documented API range", async () => {
    let requestedUrl: string | undefined;
    const client = new SeoulOpenApiClient({
      apiKey: "test-key",
      baseUrl: "http://swopenAPI.seoul.go.kr/api/subway",
      minStartIndex: 0,
      fetch: async (url) => {
        requestedUrl = url.toString();
        return new Response(JSON.stringify({ realtimeArrivalList: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        });
      },
    });

    await fetchSubwayRealtimeStationArrival(client, {
      stationName: "서울",
      startIndex: 2,
      endIndex: 7,
    });

    expect(requestedUrl).toBe(
      "http://swopenapi.seoul.go.kr/api/subway/test-key/json/realtimeStationArrival/2/7/%EC%84%9C%EC%9A%B8/",
    );
  });

  test("rejects blank station names", async () => {
    const client = new SeoulOpenApiClient({
      apiKey: "test-key",
      baseUrl: "http://swopenAPI.seoul.go.kr/api/subway",
      minStartIndex: 0,
    });

    await expect(
      fetchSubwayRealtimeStationArrival(client, { stationName: "  " }),
    ).rejects.toThrow("stationName must contain a station name");
  });
});
