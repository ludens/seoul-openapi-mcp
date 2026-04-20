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
    "Optional district filter code from MSRSTN_PBADMS_CD. Omit to fetch all districts.",
  ),
  districtName: AirQualityDistrictNameSchema.optional().describe(
    "Optional district filter name from MSRSTN_PBADMS_CD.csv. Omit to fetch all districts.",
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
