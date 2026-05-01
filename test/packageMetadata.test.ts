import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";

const packageJson = JSON.parse(readFileSync("package.json", "utf8")) as {
  version?: string;
  bin?: Record<string, string>;
  publishConfig?: { access?: string };
  repository?: { type?: string; url?: string };
  scripts?: Record<string, string>;
  keywords?: string[];
};

describe("npm package metadata", () => {
  test("uses semver-compatible CalVer for package releases", () => {
    expect(packageJson.version).toBe("2026.501.0");
  });

  test("publishes a public executable package for npx usage", () => {
    expect(packageJson.bin).toEqual({
      "seoul-openapi-mcp": "dist/index.js",
    });
    expect(packageJson.publishConfig).toEqual({ access: "public" });
    expect(packageJson.repository).toEqual({
      type: "git",
      url: "git+ssh://git@github.com/ludens/seoul-openapi-mcp.git",
    });
    expect(packageJson.scripts?.prepublishOnly).toBe(
      "pnpm check && pnpm test && pnpm build",
    );
    expect(packageJson.keywords).toEqual(
      expect.arrayContaining(["mcp", "seoul", "openapi"]),
    );
  });

  test("documents the npx command users should configure", () => {
    const readme = readFileSync("README.md", "utf8");

    expect(readme).toContain("npx seoul-openapi-mcp");
  });
});
