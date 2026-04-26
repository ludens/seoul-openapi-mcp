export interface SeoulOpenApiClientOptions {
  apiKey: string;
  baseUrl: string;
  minStartIndex?: number;
  fetch?: typeof fetch;
}

export interface SeoulOpenApiUrlOptions {
  serviceName: string;
  startIndex: number;
  endIndex: number;
  pathParams?: readonly string[];
}

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

export class SeoulOpenApiClient {
  readonly #apiKey: string;
  readonly #baseUrl: string;
  readonly #minStartIndex: number;
  readonly #fetch: typeof fetch;

  constructor(options: SeoulOpenApiClientOptions) {
    this.#apiKey = options.apiKey;
    this.#baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.#minStartIndex = options.minStartIndex ?? 1;
    this.#fetch = options.fetch ?? fetch;
  }

  buildUrl(options: SeoulOpenApiUrlOptions): URL {
    if (options.startIndex < this.#minStartIndex) {
      throw new Error(
        `startIndex must be greater than or equal to ${this.#minStartIndex}`,
      );
    }

    if (options.endIndex < options.startIndex) {
      throw new Error("endIndex must be greater than or equal to startIndex");
    }

    if (!/^[A-Za-z0-9_]+$/.test(options.serviceName)) {
      throw new Error(
        "serviceName must contain only letters, numbers, and underscores",
      );
    }

    const pathParts = [
      this.#apiKey,
      "json",
      options.serviceName,
      String(options.startIndex),
      String(options.endIndex),
      ...(options.pathParams ?? []),
    ].map((part) => encodeURIComponent(part));

    return new URL(`${this.#baseUrl}/${pathParts.join("/")}/`);
  }

  async fetchJson(options: SeoulOpenApiUrlOptions): Promise<JsonValue> {
    const url = this.buildUrl(options);
    const response = await this.#fetch(url);

    if (!response.ok) {
      throw new Error(
        `Seoul OpenAPI request failed with HTTP ${response.status}. Check serviceName, API key, and pagination range.`,
      );
    }

    return (await response.json()) as JsonValue;
  }
}
