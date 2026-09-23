import { env } from "cloudflare:test";
import { describe, expect, it } from "vitest";

import { DEV_USER_ID } from "../src/auth/placeholder";
import { insertTransaction, listTransactions } from "../src/db";
import { confirmationMessage } from "../src/services/transactions";

describe("transactions", () => {
  it("stores integer Toman amounts and lists them per user", async () => {
    const tx = await insertTransaction(env.DB, DEV_USER_ID, {
      amount: 120000,
      counterparty: "حسن",
      description: "پرداخت آزمایشی",
      raw_text: "۱۲۰ هزار تومان به حسن دادم",
    });

    expect(tx.amount).toBe(120000);
    expect(tx.currency).toBe("IRT");

    const list = await listTransactions(env.DB, DEV_USER_ID, 20);
    const found = list.find((item) => item.id === tx.id);
    expect(found?.counterparty).toBe("حسن");
  });

  it("never returns another user's transactions", async () => {
    await env.DB.prepare(
      `INSERT OR IGNORE INTO users (id, email, display_name, locale, created_at)
       VALUES (?, ?, ?, 'fa', ?)`,
    )
      .bind("other-user", "other@shila.local", "Other User", 0)
      .run();

    await insertTransaction(env.DB, "other-user", {
      amount: 999,
      description: "belongs elsewhere",
    });

    const list = await listTransactions(env.DB, DEV_USER_ID, 100);
    expect(list.every((item) => item.user_id === DEV_USER_ID)).toBe(true);
  });

  it("formats a Persian confirmation", () => {
    const message = confirmationMessage({
      id: "t1",
      user_id: DEV_USER_ID,
      amount: 120000,
      currency: "IRT",
      category: "بدهی",
      counterparty: "حسن",
      description: "",
      source: "text",
      raw_text: null,
      occurred_at: null,
      created_at: 0,
    });

    expect(message).toContain("۱۲۰٬۰۰۰");
    expect(message).toContain("حسن");
  });
});
