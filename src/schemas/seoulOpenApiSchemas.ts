import { z } from "zod";

export const AirQualityDistricts = [
  { code: "111123", name: "종로구" },
  { code: "111121", name: "중구" },
  { code: "111131", name: "용산구" },
  { code: "111142", name: "성동구" },
  { code: "111141", name: "광진구" },
  { code: "111152", name: "동대문구" },
  { code: "111151", name: "중랑구" },
  { code: "111161", name: "성북구" },
  { code: "111291", name: "강북구" },
  { code: "111171", name: "도봉구" },
  { code: "111311", name: "노원구" },
  { code: "111181", name: "은평구" },
  { code: "111191", name: "서대문구" },
  { code: "111201", name: "마포구" },
  { code: "111301", name: "양천구" },
  { code: "111212", name: "강서구" },
  { code: "111221", name: "구로구" },
  { code: "111281", name: "금천구" },
  { code: "111231", name: "영등포구" },
  { code: "111241", name: "동작구" },
  { code: "111251", name: "관악구" },
  { code: "111262", name: "서초구" },
  { code: "111261", name: "강남구" },
  { code: "111273", name: "송파구" },
  { code: "111274", name: "강동구" },
] as const;

export const AirQualityDistrictCodes = AirQualityDistricts.map(
  (district) => district.code,
) as [string, ...string[]];

export const AirQualityDistrictNames = AirQualityDistricts.map(
  (district) => district.name,
) as [string, ...string[]];

export const AirQualityDistrictCodeSchema = z
  .enum(AirQualityDistrictCodes)
  .describe(
    "Optional Seoul air-quality station administrative code. Examples: 111121 중구, 111261 강남구, 111273 송파구.",
  );

export const AirQualityDistrictNameSchema = z
  .enum(AirQualityDistrictNames)
  .describe(
    "Optional Seoul district name. Examples: 중구, 강남구, 송파구.",
  );

export const AirQualityByDistrictInputShape = {
  districtCode: AirQualityDistrictCodeSchema.optional().describe(
    "Optional district filter code from apis/AirQualityByDistrict/MSRSTN_PBADMS_CD.csv. Omit to fetch all districts.",
  ),
  districtName: AirQualityDistrictNameSchema.optional().describe(
    "Optional district filter name from apis/AirQualityByDistrict/MSRSTN_PBADMS_CD.csv. Omit to fetch all districts.",
  ),
};

export const AirQualityByDistrictInputSchema = z
  .object(AirQualityByDistrictInputShape)
  .strict();

export const AirQualityByDistrictRowSchema = z
  .object({
    MSRMT_YMD: z
      .string()
      .optional()
      .describe("측정일시. 서울 OpenAPI 원본 형식은 yyyyMMddHHmm입니다."),
    MSRSTN_PBADMS_CD: z
      .string()
      .optional()
      .describe("자치구별 대기환경 측정 행정 코드입니다."),
    MSRSTN_NM: z.string().optional().describe("측정 자치구명입니다."),
    CAI: z.string().optional().describe("통합대기환경지수 값입니다."),
    CAI_GRD: z
      .string()
      .optional()
      .describe("통합대기환경등급입니다. 예: 좋음, 보통, 나쁨, 매우나쁨."),
    CRST_SBSTN: z
      .string()
      .optional()
      .describe("통합대기환경지수를 결정한 주요 오염물질입니다."),
    NTDX: z.string().optional().describe("이산화질소(NO2) 농도입니다."),
    OZON: z.string().optional().describe("오존(O3) 농도입니다."),
    CBMX: z.string().optional().describe("일산화탄소(CO) 농도입니다."),
    SPDX: z.string().optional().describe("아황산가스(SO2) 농도입니다."),
    PM: z.string().optional().describe("미세먼지 PM10 농도입니다."),
    FPM: z.string().optional().describe("초미세먼지 PM2.5 농도입니다."),
  })
  .passthrough()
  .describe("서울시 실시간 자치구별 대기환경 현황 원본 row입니다.");

export const AirQualityByDistrictOutputSchema = z.object({
  serviceName: z
    .literal("ListAirQualityByDistrictService")
    .describe("조회한 서울 OpenAPI 서비스명입니다."),
  startIndex: z.number().int().describe("서울 OpenAPI 요청 시작 인덱스입니다."),
  endIndex: z.number().int().describe("서울 OpenAPI 요청 종료 인덱스입니다."),
  districtCode: z.string().optional().describe("조회한 자치구 코드입니다."),
  districtName: z.string().optional().describe("조회한 자치구명입니다."),
  rows: z
    .array(AirQualityByDistrictRowSchema)
    .describe("응답에서 추출한 자치구별 대기환경 row 목록입니다."),
  data: z.unknown().describe("서울 OpenAPI 원본 JSON 응답입니다."),
});

export type AirQualityByDistrictInput = z.infer<
  typeof AirQualityByDistrictInputSchema
>;
export type AirQualityByDistrictOutput = z.infer<
  typeof AirQualityByDistrictOutputSchema
>;

export const SubwayRealtimeStationArrivalInputShape = {
  stationName: z
    .string()
    .transform((value) => value.trim())
    .refine((value) => value.length > 0, {
      message: "stationName must contain a station name",
    })
    .describe("Required subway station name. Examples: 강남, 서울, 홍대입구."),
  startIndex: z
    .number()
    .int()
    .min(0)
    .max(1000)
    .default(0)
    .describe("Optional Seoul subway OpenAPI start index. Defaults to 0."),
  endIndex: z
    .number()
    .int()
    .min(0)
    .max(1000)
    .default(20)
    .describe("Optional Seoul subway OpenAPI end index. Defaults to 20."),
};

export const SubwayRealtimeStationArrivalInputSchema = z
  .object(SubwayRealtimeStationArrivalInputShape)
  .strict()
  .superRefine((value, ctx) => {
    if (value.endIndex < value.startIndex) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endIndex"],
        message: "endIndex must be greater than or equal to startIndex",
      });
    }

    if (value.endIndex - value.startIndex > 1000) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endIndex"],
        message: "subway realtime arrival requests can fetch at most 1000 rows",
      });
    }
  });

export const SubwayRealtimeStationArrivalRowSchema = z
  .object({
    subwayId: z.string().optional().describe("지하철호선ID입니다. 예: 1002는 2호선입니다."),
    updnLine: z.string().optional().describe("상하행선구분입니다. 예: 상행/내선, 하행/외선."),
    trainLineNm: z.string().optional().describe("도착지방면입니다."),
    statnFid: z.string().optional().describe("이전지하철역ID입니다."),
    statnTid: z.string().optional().describe("다음지하철역ID입니다."),
    statnId: z.string().optional().describe("지하철역ID입니다."),
    statnNm: z.string().optional().describe("지하철역명입니다."),
    trnsitCo: z.string().optional().describe("환승노선수입니다."),
    ordkey: z.string().optional().describe("도착예정열차순번입니다."),
    subwayList: z.string().optional().describe("연계호선ID 목록입니다."),
    statnList: z.string().optional().describe("연계지하철역ID 목록입니다."),
    btrainSttus: z.string().optional().describe("열차종류입니다. 예: 급행, ITX, 일반, 특급."),
    barvlDt: z.string().optional().describe("열차도착예정시간입니다. 단위는 초입니다."),
    btrainNo: z.string().optional().describe("열차번호입니다."),
    bstatnId: z.string().optional().describe("종착지하철역ID입니다."),
    bstatnNm: z.string().optional().describe("종착지하철역명입니다."),
    recptnDt: z.string().optional().describe("열차도착정보를 생성한 시각입니다."),
    arvlMsg2: z.string().optional().describe("첫번째 도착 메시지입니다. 예: 도착, 출발, 진입."),
    arvlMsg3: z.string().optional().describe("두번째 도착 메시지입니다."),
    arvlCd: z.string().optional().describe("도착코드입니다. 0 진입, 1 도착, 2 출발, 99 운행중 등."),
    lstcarAt: z.string().optional().describe("막차여부입니다. 1은 막차, 0은 아님입니다."),
  })
  .passthrough()
  .describe("서울시 지하철 실시간 도착정보 원본 row입니다.");

export const SubwayRealtimeStationArrivalOutputSchema = z.object({
  serviceName: z
    .literal("realtimeStationArrival")
    .describe("조회한 서울 지하철 OpenAPI 서비스명입니다."),
  startIndex: z.number().int().describe("서울 지하철 OpenAPI 요청 시작 인덱스입니다."),
  endIndex: z.number().int().describe("서울 지하철 OpenAPI 요청 종료 인덱스입니다."),
  stationName: z.string().describe("조회한 지하철역명입니다."),
  rows: z
    .array(SubwayRealtimeStationArrivalRowSchema)
    .describe("응답에서 추출한 지하철 실시간 도착정보 row 목록입니다."),
  data: z.unknown().describe("서울 지하철 OpenAPI 원본 JSON 응답입니다."),
});

export type SubwayRealtimeStationArrivalInput = z.infer<
  typeof SubwayRealtimeStationArrivalInputSchema
>;
export type SubwayRealtimeStationArrivalOutput = z.infer<
  typeof SubwayRealtimeStationArrivalOutputSchema
>;

const GoodPriceShopIndustryCodes = [
  "001",
  "002",
  "003",
  "004",
  "005",
  "006",
  "007",
  "008",
  "009",
  "010",
  "011",
  "012",
  "013",
] as const;

export const GoodPriceShopInputShape = {
  query: z
    .string()
    .trim()
    .min(1)
    .optional()
    .describe(
      "Optional keyword matched against shop name, address, description, pride text, directions, and item names.",
    ),
  districtName: AirQualityDistrictNameSchema.optional().describe(
    "Optional Seoul district name filter. Examples: 송파구, 양천구, 관악구.",
  ),
  industryCode: z
    .enum(GoodPriceShopIndustryCodes)
    .optional()
    .describe(
      "Optional industry category code. Examples: 001 한식, 003 경양식/일식, 005 이미용, 007 세탁.",
    ),
  industryName: z
    .string()
    .trim()
    .min(1)
    .optional()
    .describe("Optional industry category name filter. Examples: 한식, 이미용, 기타외식업."),
  itemName: z
    .string()
    .trim()
    .min(1)
    .optional()
    .describe("Optional item/product name filter. Examples: 아메리카노, 커트, 김밥."),
  maxItemPrice: z
    .number()
    .int()
    .min(0)
    .optional()
    .describe(
      "Optional maximum item price in KRW. Requires a shop to have at least one item at or below this price.",
    ),
  limit: z
    .number()
    .int()
    .min(1)
    .max(2000)
    .default(20)
    .describe("Maximum number of shops to return. Defaults to 20."),
  offset: z
    .number()
    .int()
    .min(0)
    .default(0)
    .describe("Number of matched shops to skip for pagination. Defaults to 0."),
};

export const GoodPriceShopInputSchema = z
  .object(GoodPriceShopInputShape)
  .strict();

export const GoodPriceShopItemSchema = z.object({
  name: z.string().describe("상품명입니다."),
  price: z.number().int().describe("상품가격(일반)(원)입니다."),
});

export const GoodPriceShopRowSchema = z.object({
  shopId: z.string().describe("업소아이디입니다."),
  name: z.string().describe("업소명입니다."),
  industryCode: z.string().describe("분류코드입니다."),
  industryName: z.string().describe("분류코드명입니다."),
  address: z.string().describe("업소 주소입니다."),
  phone: z.string().describe("업소 전화번호입니다."),
  directions: z.string().describe("찾아오시는 길입니다."),
  info: z.string().describe("업소정보입니다."),
  pride: z.string().describe("자랑거리입니다."),
  recommendationCount: z.number().int().describe("추천수입니다."),
  photoUrl: z.string().describe("업소 사진 URL입니다."),
  baseYm: z.string().describe("기준년월입니다."),
  items: z
    .array(GoodPriceShopItemSchema)
    .describe("업소의 상품/가격 목록입니다. 상품 필터가 있으면 매칭 상품만 포함합니다."),
});

export const GoodPriceShopOutputSchema = z.object({
  serviceName: z
    .literal("ListPriceModelStoreService")
    .describe("참조한 서울 열린데이터 서비스명입니다."),
  dataSource: z.literal("static-json").describe("API 호출 없이 static JSON을 참조합니다."),
  datasetDate: z.literal("2026-04-21").describe("참조 JSON 파일 기준일입니다."),
  totalCount: z.number().int().describe("페이지 적용 전 매칭 업소 수입니다."),
  returnedCount: z.number().int().describe("반환한 업소 수입니다."),
  limit: z.number().int().describe("요청 limit입니다."),
  offset: z.number().int().describe("요청 offset입니다."),
  rows: z.array(GoodPriceShopRowSchema).describe("검색된 착한가격업소 목록입니다."),
});

export type GoodPriceShopInput = z.infer<typeof GoodPriceShopInputSchema>;
export type GoodPriceShopOutput = z.infer<typeof GoodPriceShopOutputSchema>;
