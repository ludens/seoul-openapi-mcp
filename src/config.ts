export interface SeoulOpenApiConfig {
  apiKey: string;
  subwayApiKey: string;
}

export interface AppConfig {
  seoulOpenApi: SeoulOpenApiConfig;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const apiKey = env.SEOUL_OPENAPI_KEY?.trim();
  const subwayApiKey = env.SEOUL_SUBWAY_OPENAPI_KEY?.trim();

  if (!apiKey) {
    throw new Error(
      "Set SEOUL_OPENAPI_KEY before starting seoul-openapi-mcp.",
    );
  }

  if (!subwayApiKey) {
    throw new Error(
      "Set SEOUL_SUBWAY_OPENAPI_KEY before starting seoul-openapi-mcp.",
    );
  }

  return {
    seoulOpenApi: {
      apiKey,
      subwayApiKey,
    },
  };
}
