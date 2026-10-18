import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { contactChannels, navItems } from "@/config/site";

/**
 * CONTACT & CONNECT PAGE TESTS
 *
 * The `/community` route now renders a directory of direct contact links instead
 * of a guest chat. Two things can go wrong here that no screenshot will catch: a
 * handle drifting away from its own destination, and the page quietly acquiring a
 * dependency on an account. Both are asserted below.
 */

const ROOT = join(__dirname, "..");
const pageSource = readFileSync(join(ROOT, "src/app/community/page.tsx"), "utf8");

describe("contact channels", () => {
  it("lists exactly the four owner-supplied channels, in order", () => {
    expect(contactChannels.map((c) => c.id)).toEqual([
      "email",
      "telegram",
      "instagram",
      "x",
    ]);
  });

  it("shows each handle verbatim, including its capitalisation", () => {
    // A lowercased "@Hussain69Yaser" or "@yaser.hussain19" would still look
    // plausible and would still link, while pointing at a different account.
    expect(contactChannels.map((c) => c.display)).toEqual([
      "rot7051@gmail.com",
      "@zack405",
      "@yaser.hussain19",
      "@Hussain69Yaser",
    ]);
  });

  it("sends each channel to its exact destination", () => {
    expect(contactChannels.map((c) => c.href)).toEqual([
      "mailto:rot7051@gmail.com",
      "https://t.me/zack405",
      "https://www.instagram.com/yaser.hussain19/",
      "https://x.com/Hussain69Yaser",
    ]);
  });

  it("keeps every displayed handle consistent with its own destination", () => {
    // The handle printed on a card must be the handle the link actually
    // addresses, so the two fields cannot drift apart unnoticed.
    for (const c of contactChannels) {
      if (c.href.startsWith("mailto:")) {
        expect(c.href.slice("mailto:".length)).toBe(c.display);
      } else {
        expect(c.href).toContain(c.display.replace(/^@/, ""));
      }
    }
  });

  it("marks only the three web destinations as external", () => {
    // A mailto: is not an external destination and must not be labelled as one.
    expect(contactChannels.filter((c) => c.external).map((c) => c.id)).toEqual([
      "telegram",
      "instagram",
      "x",
    ]);
  });

  it("adds no contact method the owner did not supply", () => {
    const text = JSON.stringify(contactChannels).toLowerCase();
    for (const forbidden of [
      "whatsapp",
      "linkedin",
      "discord",
      "matrix",
      "signal",
      "phone",
    ]) {
      expect(text).not.toContain(forbidden);
    }
    // Exactly one address is published, so exactly one mailto: may exist.
    expect(text.match(/mailto:/g) ?? []).toHaveLength(1);
  });

  it("uses a valid absolute HTTPS URL for every external channel", () => {
    for (const c of contactChannels) {
      if (!c.external) continue;
      expect(() => new URL(c.href)).not.toThrow();
      expect(new URL(c.href).protocol).toBe("https:");
    }
  });

  it("renders each card heading and handle from data, not hard-coded text", () => {
    // Lucide 1.x dropped its brand marks, so the platform name is the only
    // reliable signal. It must come from the config as real text, next to the
    // handle, rather than being implied by a glyph or baked into the markup.
    expect(pageSource).toContain("{channel.platform}");
    expect(pageSource).toContain("{channel.display}");
    expect(pageSource).not.toMatch(/aria-hidden[^>]*>\s*(Email|Telegram|Instagram|X)\s*</);
  });
});

describe("the contact page is public", () => {
  it("renders no chat, review or participation interface", () => {
    for (const removed of [
      "ChatRoom",
      "Reviews",
      "conductSummary",
      "suggest",
      "participat",
    ]) {
      expect(pageSource).not.toContain(removed);
    }
  });

  it("imports no authentication or data provider", () => {
    const imports = (pageSource.match(/^import[\s\S]*?;$/gm) ?? []).join("\n");
    for (const forbidden of ["@clerk/", "next-auth", "@supabase", "@/lib/session"]) {
      expect(imports).not.toContain(forbidden);
    }
  });

  it("carries no sign-in prompt or account gate", () => {
    for (const prompt of ["Sign in", "Sign up", "Log in", "Create an account"]) {
      expect(pageSource).not.toContain(prompt);
    }
  });

  it("publishes the owner's closing line", () => {
    expect(pageSource).toContain("Looking forward to hearing from you.");
  });

  it("opens external channels safely in a new tab", () => {
    expect(pageSource).toContain('rel: "noopener noreferrer"');
    expect(pageSource).toContain('target: "_blank"');
  });

  it("describes the page as a contact channel in its metadata", () => {
    expect(pageSource).toContain('title: "Contact & Connect"');
  });
});

describe("navigation presents the page as contact, not as a chat", () => {
  it("keeps the /community URL so existing links still resolve", () => {
    expect(navItems.some((n) => n.href === "/community")).toBe(true);
  });

  it("labels that route Contact", () => {
    const item = navItems.find((n) => n.href === "/community")!;
    expect(item.label).toBe("Contact");
    expect(item.label).not.toMatch(/community/i);
  });

  it("no longer advertises guest chat or reviews in the nav description", () => {
    const item = navItems.find((n) => n.href === "/community")!;
    expect(item.description).not.toMatch(/chat|review/i);
  });

  it("leaves no site navigation entry still called Community", () => {
    for (const n of navItems) {
      expect(n.label).not.toBe("Community");
    }
  });
});