import { describe, expect, it } from "vitest";
import {
  UserPlanSchema,
  UserSchema,
  VoiceProfileSchema,
  VoiceProfileStatusSchema,
} from "../src/index.js";

describe("UserPlanSchema", () => {
  it("accepts known plans", () => {
    expect(UserPlanSchema.parse("free")).toBe("free");
    expect(UserPlanSchema.parse("plus")).toBe("plus");
    expect(UserPlanSchema.parse("family")).toBe("family");
  });
  it("rejects unknown plans", () => {
    expect(() => UserPlanSchema.parse("enterprise")).toThrow();
  });
});

describe("UserSchema", () => {
  it("parses a well-formed user", () => {
    const u = UserSchema.parse({
      id: "u_1",
      email: "kim@example.com",
      name: "김규원",
      plan: "plus",
      createdAt: "2026-04-17T00:00:00.000Z",
    });
    expect(u.plan).toBe("plus");
  });
  it("rejects malformed email", () => {
    expect(() =>
      UserSchema.parse({
        id: "u_1",
        email: "not-an-email",
        name: "kim",
        plan: "free",
        createdAt: "2026-04-17T00:00:00.000Z",
      }),
    ).toThrow();
  });
});

describe("VoiceProfileSchema", () => {
  it("parses a valid profile", () => {
    const p = VoiceProfileSchema.parse({
      id: "vp_1",
      userId: "u_1",
      name: "엄마 목소리",
      status: "ready",
      sampleCount: 3,
    });
    expect(VoiceProfileStatusSchema.parse(p.status)).toBe("ready");
  });
  it("rejects negative sample count", () => {
    expect(() =>
      VoiceProfileSchema.parse({
        id: "vp_1",
        userId: "u_1",
        name: "엄마 목소리",
        status: "ready",
        sampleCount: -1,
      }),
    ).toThrow();
  });
});
