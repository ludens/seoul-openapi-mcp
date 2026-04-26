import { describe, expect, test } from "vitest";
import { loadConfig } from "../src/config.js";

describe("loadConfig", () => {
  test("loads host-specific Seoul OpenAPI keys from environment values", () => {
    const config = loadConfig({
      SEOUL_OPENAPI_KEY: "abc123",
      SEOUL_SUBWAY_OPENAPI_KEY: "subway123",
      SEOUL_OPENAPI_BASE_URL: "https://example.test",
      SEOUL_SUBWAY_OPENAPI_BASE_URL: "https://subway.example.test/api/subway",
    });

    expect(config).toEqual({
      seoulOpenApi: {
        apiKey: "abc123",
        subwayApiKey: "subway123",
      },
    });
  });

  test("throws an actionable error when API key is missing", () => {
    expect(() => loadConfig({ SEOUL_SUBWAY_OPENAPI_KEY: "subway123" })).toThrow(
      "Set SEOUL_OPENAPI_KEY before starting seoul-openapi-mcp.",
    );
  });

  test("throws an actionable error when subway API key is missing", () => {
    expect(() => loadConfig({ SEOUL_OPENAPI_KEY: "abc123" })).toThrow(
      "Set SEOUL_SUBWAY_OPENAPI_KEY before starting seoul-openapi-mcp.",
    );
  });
});
