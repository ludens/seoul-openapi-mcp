import { describe, expect, test } from "vitest";
import { SeoulOpenApiClient } from "../src/services/seoulOpenApiClient.js";

describe("SeoulOpenApiClient", () => {
  test("builds Seoul OpenAPI URLs with JSON response format and pagination range", () => {
    const client = new SeoulOpenApiClient({
      apiKey: "test-key",
      baseUrl: "http://openapi.seoul.go.kr:8088",
    });

    const url = client.buildUrl({
      serviceName: "SearchParkInfoService",
      startIndex: 1,
      endIndex: 5,
    });

    expect(url.toString()).toBe(
      "http://openapi.seoul.go.kr:8088/test-key/json/SearchParkInfoService/1/5/",
    );
  });

  test("rejects invalid pagination ranges before making requests", () => {
    const client = new SeoulOpenApiClient({
      apiKey: "test-key",
      baseUrl: "http://openapi.seoul.go.kr:8088",
    });

    expect(() =>
      client.buildUrl({
        serviceName: "SearchParkInfoService",
        startIndex: 10,
        endIndex: 1,
      }),
    ).toThrow("endIndex must be greater than or equal to startIndex");
  });

  test("builds Seoul subway OpenAPI URLs when zero-based pagination is enabled", () => {
    const client = new SeoulOpenApiClient({
      apiKey: "test-key",
      baseUrl: "http://swopenAPI.seoul.go.kr/api/subway",
      minStartIndex: 0,
    });

    const url = client.buildUrl({
      serviceName: "realtimeStationArrival",
      startIndex: 0,
      endIndex: 5,
      pathParams: ["서울"],
    });

    expect(url.toString()).toBe(
      "http://swopenapi.seoul.go.kr/api/subway/test-key/json/realtimeStationArrival/0/5/%EC%84%9C%EC%9A%B8/",
    );
  });
});
