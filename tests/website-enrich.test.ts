import { describe, expect, it } from "vitest";
import {
  isDenylistedHost,
  isPrivateOrLocalHost,
} from "@/lib/website-enrich";

describe("isPrivateOrLocalHost", () => {
  it("rejects loopback and localhost", () => {
    expect(isPrivateOrLocalHost("http://localhost/")).toBe(true);
    expect(isPrivateOrLocalHost("http://localhost:8080/path")).toBe(true);
    expect(isPrivateOrLocalHost("http://app.localhost/")).toBe(true);
    expect(isPrivateOrLocalHost("http://127.0.0.1/")).toBe(true);
    expect(isPrivateOrLocalHost("http://127.5.5.5/")).toBe(true);
    expect(isPrivateOrLocalHost("http://0.0.0.0/")).toBe(true);
    expect(isPrivateOrLocalHost("http://0.1.2.3/")).toBe(true);
  });

  it("rejects RFC-1918 IPv4 ranges", () => {
    expect(isPrivateOrLocalHost("http://10.0.0.1/")).toBe(true);
    expect(isPrivateOrLocalHost("http://10.255.255.255/")).toBe(true);
    expect(isPrivateOrLocalHost("http://172.16.0.1/")).toBe(true);
    expect(isPrivateOrLocalHost("http://172.31.255.1/")).toBe(true);
    expect(isPrivateOrLocalHost("http://192.168.1.1/")).toBe(true);
  });

  it("rejects link-local + AWS metadata", () => {
    expect(isPrivateOrLocalHost("http://169.254.1.1/")).toBe(true);
    expect(isPrivateOrLocalHost("http://169.254.169.254/latest/meta-data/")).toBe(true);
  });

  it("rejects mDNS .local hosts", () => {
    expect(isPrivateOrLocalHost("http://printer.local/")).toBe(true);
    expect(isPrivateOrLocalHost("http://my-mac.local:5000/")).toBe(true);
  });

  it("rejects IPv6 loopback / link-local / unique-local", () => {
    expect(isPrivateOrLocalHost("http://[::1]/")).toBe(true);
    expect(isPrivateOrLocalHost("http://[fe80::1]/")).toBe(true);
    expect(isPrivateOrLocalHost("http://[fc00::1]/")).toBe(true);
    expect(isPrivateOrLocalHost("http://[fd12:3456:789a::1]/")).toBe(true);
  });

  it("accepts public hosts", () => {
    expect(isPrivateOrLocalHost("https://stripe.com/")).toBe(false);
    expect(isPrivateOrLocalHost("https://www.alphamountain.ai")).toBe(false);
    expect(isPrivateOrLocalHost("http://172.32.0.1/")).toBe(false); // outside 16-31
    expect(isPrivateOrLocalHost("http://192.169.1.1/")).toBe(false); // not 192.168
    expect(isPrivateOrLocalHost("http://11.0.0.1/")).toBe(false); // not 10.x
    expect(isPrivateOrLocalHost("https://[2001:db8::1]/")).toBe(false);
  });

  it("returns false on unparseable URLs (request-validation runs first)", () => {
    expect(isPrivateOrLocalHost("not a url")).toBe(false);
    expect(isPrivateOrLocalHost("")).toBe(false);
  });
});

describe("isDenylistedHost", () => {
  it("rejects exact + subdomain matches for known social hosts", () => {
    expect(isDenylistedHost("https://linkedin.com/in/someone")).toBe(true);
    expect(isDenylistedHost("https://www.linkedin.com/")).toBe(true);
    expect(isDenylistedHost("https://twitter.com/elonmusk")).toBe(true);
    expect(isDenylistedHost("https://x.com/elonmusk")).toBe(true);
    expect(isDenylistedHost("https://www.facebook.com/page")).toBe(true);
    expect(isDenylistedHost("https://m.facebook.com/page")).toBe(true);
    expect(isDenylistedHost("https://www.instagram.com/handle")).toBe(true);
    expect(isDenylistedHost("https://github.com/clay-coffman")).toBe(true);
  });

  it("doesn't false-positive on lookalike hostnames", () => {
    // `notlinkedin.com` is not `linkedin.com` and not a *.linkedin.com subdomain.
    expect(isDenylistedHost("https://notlinkedin.com/")).toBe(false);
    expect(isDenylistedHost("https://my-x.com/")).toBe(false);
    expect(isDenylistedHost("https://stripe.com/")).toBe(false);
    expect(isDenylistedHost("https://www.alphamountain.ai/")).toBe(false);
  });

  it("returns false on unparseable URLs", () => {
    expect(isDenylistedHost("not a url")).toBe(false);
  });
});
