import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import { D1Memory } from "../src/memory/d1-memory";

const USER = "dev-user";

describe("D1Memory", () => {
  it("appends messages and returns history in chronological order", async () => {
    const memory = new D1Memory(env.DB);
    const session = "s-history";

    await memory.appendMessage(USER, session, { role: "user", content: "سلام" });
    await memory.appendMessage(USER, session, { role: "assistant", content: "درود" });
    await memory.appendMessage(USER, session, { role: "user", content: "۱۲۰ هزار تومان" });

    const history = await memory.getHistory(USER, session, 10);

    expect(history.map((message) => message.content)).toEqual([
      "سلام",
      "درود",
      "۱۲۰ هزار تومان",
    ]);
  });

  it("scopes history to a session", async () => {
    const memory = new D1Memory(env.DB);

    await memory.appendMessage(USER, "s-a", { role: "user", content: "A" });
    await memory.appendMessage(USER, "s-b", { role: "user", content: "B" });

    const history = await memory.getHistory(USER, "s-a", 10);
    expect(history.map((message) => message.content)).toEqual(["A"]);
  });

  it("round-trips context values", async () => {
    const memory = new D1Memory(env.DB);

    expect(await memory.getContext(USER, "city")).toBeNull();
    await memory.setContext(USER, "city", "تهران");
    expect(await memory.getContext(USER, "city")).toBe("تهران");
    await memory.setContext(USER, "city", "شیراز");
    expect(await memory.getContext(USER, "city")).toBe("شیراز");
  });
});
