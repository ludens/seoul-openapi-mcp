import { readFileSync } from "node:fs";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  LibraryTimeInfoInputSchema,
  LibraryTimeInfoInputShape,
  LibraryTimeInfoOutputSchema,
  type LibraryTimeInfoInput,
  type LibraryTimeInfoOutput,
} from "../schemas/seoulOpenApiSchemas.js";

const LIBRARY_TIME_INFO_SERVICE = "SeoulLibraryTimeInfo";
const DATASET_DATE = "2026-05-01";
const DATA_URL = new URL(
  "../../data/SeoulLibraryTimeInfo/서울시_도서관_이용시간_및_휴관일_정보.json",
  import.meta.url,
);

const RawLibrarySchema = z.object({
  tel_no: z.string().nullable(),
  gu_code: z.string(),
  lbrry_name: z.string(),
  lbrry_seq_no: z.number().int(),
  fdrm_close_date: z.string().nullable(),
  adres: z.string(),
  ydnts: z.string().nullable(),
  xcnts: z.string().nullable(),
  code_value: z.string(),
});

const RawLibraryDataSchema = z.object({
  DATA: z.array(RawLibrarySchema),
});

type RawLibrary = z.infer<typeof RawLibrarySchema>;
type LibraryTimeInfoRow = LibraryTimeInfoOutput["rows"][number];

let cachedRows: LibraryTimeInfoRow[] | undefined;

function parseJsonFile(url: URL): unknown {
  return JSON.parse(readFileSync(url, "utf8"));
}

function cleanText(value: string | null): string {
  const trimmed = (value ?? "").trim();
  return trimmed === "null" || trimmed === "　" ? "" : trimmed;
}

function parseCoordinate(value: string | null): number | null {
  const cleaned = cleanText(value);
  if (!cleaned) {
    return null;
  }

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("ko-KR");
}

function buildRows(libraries: RawLibrary[]): LibraryTimeInfoRow[] {
  return libraries.map((library) => ({
    librarySeqNo: library.lbrry_seq_no,
    name: cleanText(library.lbrry_name),
    districtCode: library.gu_code,
    districtName: cleanText(library.code_value),
    address: cleanText(library.adres),
    regularClosedDay: cleanText(library.fdrm_close_date),
    phone: cleanText(library.tel_no),
    latitude: parseCoordinate(library.xcnts),
    longitude: parseCoordinate(library.ydnts),
  }));
}

function loadRows(): LibraryTimeInfoRow[] {
  if (!cachedRows) {
    const data = RawLibraryDataSchema.parse(parseJsonFile(DATA_URL));
    cachedRows = buildRows(data.DATA);
  }

  return cachedRows;
}

function matchesQuery(library: LibraryTimeInfoRow, query: string): boolean {
  const needle = normalize(query);
  const haystacks = [
    library.name,
    library.address,
    library.districtName,
    library.regularClosedDay,
    library.phone,
  ];

  return haystacks.some((value) => normalize(value).includes(needle));
}

function matchesLibrary(
  library: LibraryTimeInfoRow,
  params: LibraryTimeInfoInput,
): boolean {
  if (params.query && !matchesQuery(library, params.query)) {
    return false;
  }

  if (
    params.libraryName &&
    !normalize(library.name).includes(normalize(params.libraryName))
  ) {
    return false;
  }

  if (params.districtName && library.districtName !== params.districtName) {
    return false;
  }

  if (
    params.closedDay &&
    !normalize(library.regularClosedDay).includes(normalize(params.closedDay))
  ) {
    return false;
  }

  return true;
}

export async function searchLibraryTimeInfo(
  rawParams: unknown,
): Promise<LibraryTimeInfoOutput> {
  const params = LibraryTimeInfoInputSchema.parse(rawParams);
  const matchedRows = loadRows().filter((library) =>
    matchesLibrary(library, params),
  );
  const rows = matchedRows.slice(params.offset, params.offset + params.limit);

  return {
    serviceName: LIBRARY_TIME_INFO_SERVICE,
    dataSource: "static-json",
    datasetDate: DATASET_DATE,
    totalCount: matchedRows.length,
    returnedCount: rows.length,
    limit: params.limit,
    offset: params.offset,
    rows,
  };
}

export function registerLibraryTimeInfoTool(server: McpServer): void {
  server.registerTool(
    "seoul_search_library_time_info",
    {
      title: "Search Seoul Library Time Info",
      description: `Search Seoul library time and regular closed-day information from the static JSON file under data/SeoulLibraryTimeInfo without calling Seoul OpenAPI.

Use this for finding Seoul libraries by name, district, address keyword, phone number, or regular closed-day text. The source dataset is named "서울시 도서관 이용시간 및 휴관일 정보", but the included JSON fields expose regular closed days, location, and contact data only; it does not contain per-library opening-hour fields.

Args:
  - query: optional keyword matched against library name, address, district name, closed-day text, and phone number
  - libraryName: optional library name keyword, for example 도곡정보문화도서관
  - districtName: optional Seoul district name, for example 강남구 or 강동구
  - closedDay: optional regular closed-day keyword, for example 월요일, 법정공휴일, 휴관중
  - limit/offset: optional pagination controls

Returns structured JSON with dataset metadata, match counts, and libraries including regular closed day, address, phone, latitude, and longitude.`,
      inputSchema: LibraryTimeInfoInputShape,
      outputSchema: LibraryTimeInfoOutputSchema.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (rawParams) => {
      const output = await searchLibraryTimeInfo(rawParams);

      return {
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    },
  );
}
