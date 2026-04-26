import { readFileSync } from "node:fs";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  GoodPriceShopInputSchema,
  GoodPriceShopInputShape,
  GoodPriceShopOutputSchema,
  type GoodPriceShopInput,
  type GoodPriceShopOutput,
} from "../schemas/seoulOpenApiSchemas.js";

const GOOD_PRICE_SHOP_SERVICE = "ListPriceModelStoreService";
const DATASET_DATE = "2026-04-21";
const SHOP_DATA_URL = new URL(
  "../../data/PriceModelStore/서울시_착한가격업소_현황_20260421.json",
  import.meta.url,
);
const ITEM_DATA_URL = new URL(
  "../../data/PriceModelStore/서울시_가격안정_모범업소_상품목록_현황_20260421.json",
  import.meta.url,
);

const RawShopSchema = z.object({
  sh_id: z.string(),
  sh_name: z.string(),
  induty_code_se: z.string(),
  induty_code_se_name: z.string(),
  sh_addr: z.string(),
  sh_phone: z.string().nullable(),
  sh_way: z.string().nullable(),
  sh_info: z.string().nullable(),
  sh_pride: z.string().nullable(),
  sh_rcmn: z.number().int(),
  sh_photo: z.string().nullable(),
  base_ym: z.string(),
});

const RawItemSchema = z.object({
  sh_id: z.string(),
  im_name: z.string().nullable(),
  im_price: z.number().int().nullable(),
});

const RawShopDataSchema = z.object({
  DATA: z.array(RawShopSchema),
});

const RawItemDataSchema = z.object({
  DATA: z.array(RawItemSchema),
});

type RawShop = z.infer<typeof RawShopSchema>;
type RawItem = z.infer<typeof RawItemSchema>;
type GoodPriceShopRow = GoodPriceShopOutput["rows"][number];

let cachedRows: GoodPriceShopRow[] | undefined;

function parseJsonFile(url: URL): unknown {
  return JSON.parse(readFileSync(url, "utf8"));
}

function cleanText(value: string | null): string {
  const trimmed = (value ?? "").trim();
  return trimmed === "null" || trimmed === "　" ? "" : trimmed;
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("ko-KR");
}

function itemMatchesFilters(
  item: GoodPriceShopRow["items"][number],
  params: Pick<GoodPriceShopInput, "itemName" | "maxItemPrice">,
): boolean {
  if (params.itemName && !normalize(item.name).includes(normalize(params.itemName))) {
    return false;
  }

  if (params.maxItemPrice !== undefined && item.price > params.maxItemPrice) {
    return false;
  }

  return true;
}

function buildRows(shops: RawShop[], items: RawItem[]): GoodPriceShopRow[] {
  const itemsByShopId = new Map<string, GoodPriceShopRow["items"]>();

  for (const item of items) {
    if (item.im_name === null || item.im_price === null) {
      continue;
    }

    const shopItems = itemsByShopId.get(item.sh_id) ?? [];
    shopItems.push({
      name: cleanText(item.im_name),
      price: item.im_price,
    });
    itemsByShopId.set(item.sh_id, shopItems);
  }

  return shops.map((shop) => ({
    shopId: shop.sh_id,
    name: cleanText(shop.sh_name),
    industryCode: shop.induty_code_se,
    industryName: cleanText(shop.induty_code_se_name),
    address: cleanText(shop.sh_addr),
    phone: cleanText(shop.sh_phone),
    directions: cleanText(shop.sh_way),
    info: cleanText(shop.sh_info),
    pride: cleanText(shop.sh_pride),
    recommendationCount: shop.sh_rcmn,
    photoUrl: cleanText(shop.sh_photo),
    baseYm: shop.base_ym,
    items: itemsByShopId.get(shop.sh_id) ?? [],
  }));
}

function loadRows(): GoodPriceShopRow[] {
  if (!cachedRows) {
    const shopData = RawShopDataSchema.parse(parseJsonFile(SHOP_DATA_URL));
    const itemData = RawItemDataSchema.parse(parseJsonFile(ITEM_DATA_URL));
    cachedRows = buildRows(shopData.DATA, itemData.DATA);
  }

  return cachedRows;
}

function matchesQuery(shop: GoodPriceShopRow, query: string): boolean {
  const needle = normalize(query);
  const haystacks = [
    shop.name,
    shop.address,
    shop.industryName,
    shop.directions,
    shop.info,
    shop.pride,
    ...shop.items.map((item) => item.name),
  ];

  return haystacks.some((value) => normalize(value).includes(needle));
}

function matchesShop(shop: GoodPriceShopRow, params: GoodPriceShopInput): boolean {
  if (params.query && !matchesQuery(shop, params.query)) {
    return false;
  }

  if (params.districtName && !shop.address.includes(params.districtName)) {
    return false;
  }

  if (params.industryCode && shop.industryCode !== params.industryCode) {
    return false;
  }

  if (
    params.industryName &&
    !normalize(shop.industryName).includes(normalize(params.industryName))
  ) {
    return false;
  }

  if (
    (params.itemName || params.maxItemPrice !== undefined) &&
    !shop.items.some((item) => itemMatchesFilters(item, params))
  ) {
    return false;
  }

  return true;
}

function filterItems(
  items: GoodPriceShopRow["items"],
  params: GoodPriceShopInput,
): GoodPriceShopRow["items"] {
  if (!params.itemName && params.maxItemPrice === undefined) {
    return items;
  }

  return items.filter((item) => itemMatchesFilters(item, params));
}

export async function searchGoodPriceShops(
  rawParams: unknown,
): Promise<GoodPriceShopOutput> {
  const params = GoodPriceShopInputSchema.parse(rawParams);
  const matchedRows = loadRows()
    .filter((shop) => matchesShop(shop, params))
    .map((shop) => ({
      ...shop,
      items: filterItems(shop.items, params),
    }));
  const rows = matchedRows.slice(params.offset, params.offset + params.limit);

  return {
    serviceName: GOOD_PRICE_SHOP_SERVICE,
    dataSource: "static-json",
    datasetDate: DATASET_DATE,
    totalCount: matchedRows.length,
    returnedCount: rows.length,
    limit: params.limit,
    offset: params.offset,
    rows,
  };
}

export function registerGoodPriceShopsTool(server: McpServer): void {
  server.registerTool(
    "seoul_search_good_price_shops",
    {
      title: "Search Seoul Good Price Shops",
      description: `Search Seoul good-price shops from static JSON files under data/PriceModelStore without calling Seoul OpenAPI.

Use this for finding 착한가격업소 by shop keyword, district, industry category, product name, or maximum product price. Results join the shop master dataset and product price dataset by sh_id.

Args:
  - query: optional keyword matched against shop name, address, description, directions, pride text, industry name, and item names
  - districtName: optional Seoul district name, for example 송파구 or 양천구
  - industryCode: optional category code, for example 001 한식 or 005 이미용
  - industryName: optional category name, for example 한식 or 기타외식업
  - itemName: optional product name, for example 아메리카노, 커트, 김밥
  - maxItemPrice: optional maximum product price in KRW
  - limit/offset: optional pagination controls

Returns structured JSON with dataset metadata, match counts, and shops including product names and prices.`,
      inputSchema: GoodPriceShopInputShape,
      outputSchema: GoodPriceShopOutputSchema.shape,
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async (rawParams) => {
      const output = await searchGoodPriceShops(rawParams);

      return {
        content: [{ type: "text", text: JSON.stringify(output, null, 2) }],
        structuredContent: output,
      };
    },
  );
}
