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

  test("allows Seoul OpenAPI keys to be omitted at server startup", () => {
    const config = loadConfig({});

    expect(config).toEqual({
      seoulOpenApi: {},
    });
  });

  test("trims optional Seoul OpenAPI key values when present", () => {
    const config = loadConfig({
      SEOUL_OPENAPI_KEY: " abc123 ",
      SEOUL_SUBWAY_OPENAPI_KEY: " subway123 ",
    });

    expect(config).toEqual({
      seoulOpenApi: {
        apiKey: "abc123",
        subwayApiKey: "subway123",
      },
    });
  });
});
