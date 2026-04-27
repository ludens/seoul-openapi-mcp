export interface SeoulOpenApiConfig {
  apiKey?: string;
  subwayApiKey?: string;
}

export interface AppConfig {
  seoulOpenApi: SeoulOpenApiConfig;
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  const apiKey = env.SEOUL_OPENAPI_KEY?.trim();
  const subwayApiKey = env.SEOUL_SUBWAY_OPENAPI_KEY?.trim();

  return {
    seoulOpenApi: {
      ...(apiKey ? { apiKey } : {}),
      ...(subwayApiKey ? { subwayApiKey } : {}),
    },
  };
}
