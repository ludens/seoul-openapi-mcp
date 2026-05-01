import { describe, expect, test } from "vitest";
import { searchLibraryTimeInfo } from "../src/tools/libraryTimeInfoTool.js";

describe("searchLibraryTimeInfo", () => {
  test("searches static Seoul library time info by district and closed-day keyword", async () => {
    const output = await searchLibraryTimeInfo({
      districtName: "강남구",
      closedDay: "월요일",
      limit: 10,
    });

    expect(output.serviceName).toBe("SeoulLibraryTimeInfo");
    expect(output.dataSource).toBe("static-json");
    expect(output.datasetDate).toBe("2026-05-01");
    expect(output.totalCount).toBeGreaterThan(0);
    expect(output.rows.length).toBeGreaterThan(0);
    expect(output.rows.length).toBeLessThanOrEqual(10);

    for (const library of output.rows) {
      expect(library.districtName).toBe("강남구");
      expect(library.regularClosedDay).toContain("월요일");
    }
  });

  test("finds a library by name and returns normalized location/contact fields", async () => {
    const output = await searchLibraryTimeInfo({
      libraryName: "도곡정보문화도서관",
    });

    expect(output.totalCount).toBe(1);
    expect(output.rows).toEqual([
      expect.objectContaining({
        librarySeqNo: 1402,
        name: "도곡정보문화도서관",
        districtCode: "0008",
        districtName: "강남구",
        address: "서울특별시 강남구 도곡로18길 57",
        regularClosedDay: "매주 월요일 및 법정공휴일",
        phone: "1644-3227",
        latitude: 37.4883101,
        longitude: 127.0388803,
      }),
    ]);
  });

  test("keeps null closed-day values as empty strings and paginates all rows", async () => {
    const output = await searchLibraryTimeInfo({ limit: 2000 });

    expect(output.totalCount).toBe(1535);
    expect(output.rows).toHaveLength(1535);
    expect(output.rows.some((library) => library.regularClosedDay === "")).toBe(
      true,
    );
  });
});
