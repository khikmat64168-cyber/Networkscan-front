import { afterEach, describe, expect, it } from "vitest";

import { getToken, initToken, setToken } from "./api/client";
import { parseHosts } from "./views/TlsView";
import { DASH, categoryLabel, findingChange, middleEllipsis, formatBytes, formatDuration, formatNumber, scanBars, serial } from "./format";

describe("format", () => {
  it("never turns a missing value into zero", () => {
    expect(formatNumber(null)).toBe(DASH);
    expect(formatBytes(undefined)).toBe(DASH);
    expect(formatDuration(null)).toBe(DASH);
  });

  it("formats sizes and durations", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(4_300_000)).toBe("4.1 MB");
    expect(formatDuration(75)).toBe("1m 15s");
    expect(formatDuration(3720)).toBe("1h 02m");
  });

  it("labels categories and serials", () => {
    expect(categoryLabel("arp.gateway_mac_change")).toBe("Gateway MAC change");
    expect(categoryLabel("credential.plaintext")).toBe("Plaintext credential");
    expect(serial(14)).toBe("NST-0014");
  });

  it("derives a stable 48-bar scan block from the id", () => {
    const bars = scanBars("a1b2c3d4e5f6");
    expect(bars).toHaveLength(48);
    expect(scanBars("a1b2c3d4e5f6")).toEqual(bars);
    expect(bars.slice(0, 4)).toEqual([true, false, true, false]); // 0xa
  });

  it("extracts the change that tells DNS / ARP rows apart", () => {
    expect(findingChange("dns.ip_change", { old_ip: "1.1.1.1", new_ip: "2.2.2.2" }, "")).toBe("1.1.1.1 → 2.2.2.2");
    expect(findingChange("dns.multiple_ips", {}, "'a.com' resolved to 2 IPs this session: 1.1.1.1, 2.2.2.2")).toBe("1.1.1.1, 2.2.2.2");
    expect(findingChange("arp.gateway_mac_change", { old_mac: "aa", src_mac: "bb" }, "")).toBe("aa → bb");
    expect(findingChange("credential.plaintext", { src_ip: "x" }, "summary")).toBeNull();
    expect(findingChange("dns.ip_change", {}, "summary")).toBeNull();
  });

  it("shortens identifiers in the middle", () => {
    expect(middleEllipsis("www.google.com")).toBe("www.google.com");
    expect(middleEllipsis("content-autofill.googleapis.com", 18)).toBe("content-…eapis.com");
  });

  it("parses host lists", () => {
    expect(parseHosts(" github.com,example.com:8443  1.1.1.1 ")).toEqual(["github.com", "example.com:8443", "1.1.1.1"]);
  });
});

describe("token handling", () => {
  afterEach(() => {
    setToken(null);
    window.history.replaceState(null, "", "/");
  });

  it("moves the token out of the URL fragment", () => {
    window.history.replaceState(null, "", "/#token=abc_DEF-123");
    expect(initToken()).toBe("abc_DEF-123");
    expect(window.location.hash).toBe("");
    expect(getToken()).toBe("abc_DEF-123");
  });

  it("returns null without a token", () => {
    expect(initToken()).toBeNull();
  });
});
