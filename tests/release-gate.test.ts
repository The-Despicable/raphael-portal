import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { profile, projects, releaseReadiness } from "@/config/site";
import {
  researchPapers,
  primaryResearchPapers,
  conceptualInfluences,
  relatedSources,
  bibliographyCompleteness,
  dreamRsiFeature,
  researchMappings,
} from "@/content/research";
import { blockers, ASSESSMENT, timeline, evidenceProvenance } from "@/content/status";
import type { ProvenanceCategory } from "@/content/status";

/**
 * RELEASE-GATE TESTS
 *
 * These are not ordinary unit tests. They are tripwires: if someone "fixes" the
 * site by quietly enabling public source access, deleting the release-review
 * notice, or padding the bibliography with plausible-looking citations, these
 * tests fail. That is the intended behaviour.
 */

describe("release readiness gate", () => {
  it("records that the source link IS published (owner decision 2026-10-18)", () => {
    // The repository was already public; this records the owner decision to link
    // it from the site. Publishing the link is not a claim that the repo is clean.
    expect(releaseReadiness.approved).toBe(true);
  });

  it("records why the residuals are listed", () => {
    expect(releaseReadiness.reason.length).toBeGreaterThan(20);
    expect(releaseReadiness.outstanding.length).toBeGreaterThan(0);
    expect(releaseReadiness.reviewedOn).toBe("2026-10-16");
  });

  it("names credential-history and offensive-tooling as outstanding residuals", () => {
    // The licence residual was resolved on 2026-10-18 by adding an MIT LICENSE to
    // the repository. The other two are unresolved and must stay enumerated.
    const joined = releaseReadiness.outstanding.join(" ").toLowerCase();
    expect(joined).toMatch(/credential/);
    expect(joined).toMatch(/offensive/);
    expect(joined).not.toMatch(/no licen[cs]e/);
  });

  it("publishes RAPHAEL's repository URL only at the owner's verified URL", () => {
    // The link is live, so the URL must be exactly the owner's repository and the
    // status must be explicit. A published link is never guessed or inferred.
    const raphael = projects.find((p) => p.id === "raphael")!;
    expect(raphael.linkStatus).toBe("verified");
    expect(raphael.repositoryUrl).toBe(
      "https://github.com/The-Despicable/raphael-2.0-rbsv2r",
    );
  });

  it("keeps the published link accompanied by its residuals", () => {
    // An open link must not read as an endorsement of the code: the caveat has to
    // travel with it, naming the residuals that remain.
    const raphael = projects.find((p) => p.id === "raphael")!;
    expect(raphael.caveat).toBeTruthy();
    const caveat = String(raphael.caveat);
    expect(caveat).toMatch(/MIT/i);
    expect(caveat).toMatch(/credential/i);
    expect(caveat).toMatch(/offensive/i);
    expect(caveat).toMatch(/not release-approved/i);
  });

  it("does not apply Raphael's release gate to unrelated projects", () => {
    const others = projects.filter((p) => p.id !== "raphael");
    expect(others.length).toBeGreaterThan(0);
    for (const p of others) {
      if (p.linkStatus === "verified") {
        expect(p.repositoryUrl).not.toBeNull();
      }
    }
  });

  it("gives every project without a link an availability note instead of a guess", () => {
    for (const project of projects) {
      if (!project.repositoryUrl) {
        expect(project.availabilityNote).toBeTruthy();
      }
    }
  });
});

describe("portfolio project configuration", () => {
  it("features the Computer Control MCP project", () => {
    const mcp = projects.find((p) => p.id === "computer-control-mcp");
    expect(mcp).toBeDefined();
    expect(mcp!.name).toBe("Computer Control MCP");
  });

  it("uses the verified Computer Control MCP repository URL", () => {
    // Verified by: the repository's package.json bin path (dist/src/index.js)
    // matching the locally configured MCP command; the README's 14-tool
    // registry matching the tools actually exposed; and ownership under the
    // authenticated account with isFork === false.
    const mcp = projects.find((p) => p.id === "computer-control-mcp")!;
    expect(mcp.repositoryUrl).toBe("https://github.com/The-Despicable/computer-control-mcp");
    expect(mcp.linkStatus).toBe("verified");
  });

  it("does not mistake the third-party repo of the same name for this one", () => {
    const mcp = projects.find((p) => p.id === "computer-control-mcp")!;
    expect(mcp.repositoryUrl).not.toMatch(/AB498/i);
    expect(mcp.repositoryUrl).toMatch(/^https:\/\/github\.com\/The-Despicable\//);
  });

  it("is actually rendered by the homepage project grid", () => {
    // Present in the config is not the same as visible on the page. The home
    // route maps over `projects` into ProjectCard; assert it still does, so the
    // entry cannot sit in the data file while being unreachable.
    const home = readFileSync(
      join(__dirname, "..", "src", "app", "page.tsx"),
      "utf8"
    );
    expect(home).toMatch(/projects\.map\(/);
    expect(home).toMatch(/<ProjectCard\s+project=\{project\}/);
  });

  it("shows the concise summary on its card, not the long-form description", () => {
    // ProjectCard renders `description` only for the featured (primary) project;
    // every other entry renders `summary`. The architecture detail is accurate
    // but far too long for a card, so it must stay off the rendered surface.
    const mcp = projects.find((p) => p.id === "computer-control-mcp")!;
    expect(mcp.role).not.toBe("primary");
    expect(mcp.summary.length).toBeLessThan(140);
    expect(mcp.description.length).toBeGreaterThan(mcp.summary.length);
  });

  it("describes capabilities the repository actually documents", () => {
    // Verified against the upstream README: the 14-tool registry, the
    // screen_id/freshness binding, and the evidence-only receipt model are all
    // documented there. No adoption, benchmark or production-readiness claim is
    // made beyond that.
    const mcp = projects.find((p) => p.id === "computer-control-mcp")!;
    expect(mcp.summary).toMatch(/MCP/);
    expect(mcp.description).toMatch(/screen_id/);
    expect(mcp.description).toMatch(/never retries or compensates/);
    const rendered = `${mcp.summary} ${mcp.description} ${mcp.caveat ?? ""}`;
    expect(rendered).not.toMatch(
      /\b(production[- ]ready|enterprise[- ]grade|used by \d+|most popular|blazing|seamless)\b/i
    );
  });

  it("carries no license claim it cannot support", () => {
    // The upstream repository publishes no LICENSE file, so the card must say
    // the project is unlicensed for reuse rather than implying permission.
    const mcp = projects.find((p) => p.id === "computer-control-mcp")!;
    expect(mcp.caveat).toMatch(/no license file/i);
    expect(`${mcp.summary} ${mcp.description}`).not.toMatch(/MIT|Apache|GPL|BSD licensed/i);
  });

  it("gives every project an explicit, valid link status", () => {
    for (const p of projects) {
      expect(["verified", "pending_review", "unverified"]).toContain(p.linkStatus);
    }
  });

  it("uses only valid HTTPS URLs for verified links", () => {
    for (const p of projects) {
      for (const url of [p.repositoryUrl, p.docsUrl]) {
        if (url !== null) {
          expect(() => new URL(url)).not.toThrow();
          expect(new URL(url).protocol).toBe("https:");
        }
      }
    }
  });

  it("never fabricates a link for a project that is not verified", () => {
    for (const p of projects) {
      if (p.linkStatus !== "verified") {
        expect(p.repositoryUrl).toBeNull();
        expect(p.docsUrl).toBeNull();
        expect(p.availabilityNote).toBeTruthy();
      }
    }
  });

  it("requires a verified project to actually have a URL", () => {
    for (const p of projects) {
      if (p.linkStatus === "verified") {
        expect(p.repositoryUrl).not.toBeNull();
      }
    }
  });

  it("keeps Vesper unverified rather than inventing a repository", () => {
    const vesper = projects.find((p) => p.id === "vesper")!;
    expect(vesper.linkStatus).toBe("unverified");
    expect(vesper.repositoryUrl).toBeNull();
  });

  it("keeps RupeWatch withheld until its credential-history review is resolved", () => {
    // A credential file was committed in that repository's history and flagged
    // for rotation and remediation; that remediation is NOT independently
    // confirmed. The link must therefore stay withheld rather than be promoted to
    // make the portfolio look more complete. Promote only on evidence, and only
    // after that separate repository is actually reviewed.
    const rupe = projects.find((p) => p.id === "rupewatch")!;
    expect(rupe.linkStatus).not.toBe("verified");
    expect(rupe.repositoryUrl).toBeNull();
    expect(rupe.availabilityNote).toBeTruthy();
  });

  it("shows no placeholder marker text on any project card", () => {
    for (const p of projects) {
      const text = `${p.name} ${p.summary} ${p.description} ${p.caveat ?? ""} ${p.availabilityNote ?? ""}`;
      expect(text).not.toMatch(/EDITABLE PLACEHOLDER|TODO|FIXME|lorem ipsum/i);
    }
  });

  it("keeps every project uniquely identified and named for accessibility", () => {
    const ids = projects.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const p of projects) {
      expect(p.id).toMatch(/^[a-z0-9-]+$/);
      expect(p.name.trim().length).toBeGreaterThan(0);
      expect(p.summary.trim().length).toBeGreaterThan(0);
    }
  });

  it("orders Raphael first, then Vesper, then the rest", () => {
    expect(projects[0].id).toBe("raphael");
    expect(projects[1].id).toBe("vesper");
    expect(projects.findIndex((p) => p.id === "computer-control-mcp")).toBeGreaterThan(1);
  });

  it("does not publish fabricated activity metrics on any card", () => {
    for (const p of projects) {
      const text = `${p.summary} ${p.description} ${p.caveat ?? ""}`;
      expect(text).not.toMatch(/\b\d+\s*(stars?|forks?|downloads?|users?|contributors?)\b/i);
    }
  });
});

describe("profile placeholders", () => {
  it("renders no unfilled placeholder text to the public", () => {
    // Earlier revisions shipped literal marker strings that the home page rendered
    // verbatim ("EDITABLE PLACEHOLDER — replace this paragraph…"). A public
    // portfolio must never display its own scaffolding. This REPLACES the old
    // "is flagged as a placeholder" assertion rather than weakening it: the
    // guarantee moves from "we admit it is unfinished" to "no placeholder is
    // visible", which is the stronger property for a published site.
    const rendered = [profile.name, profile.headline, profile.bio, profile.currentFocus];
    for (const field of rendered) {
      expect(field).not.toMatch(/EDITABLE PLACEHOLDER|Your Name|TODO|FIXME|lorem ipsum/i);
    }
    expect(profile.isPlaceholder).toBe(false);
  });

  it("only publishes a VERIFIED GitHub profile URL", () => {
    // This previously asserted null, while the profile was an unconfigured
    // placeholder. The account has since been verified as the owner of the
    // repositories linked from the project cards, so a populated value is
    // correct — but it must be EXACTLY that verified account. A profile URL is
    // never invented and never inferred from a project link.
    if (profile.githubProfileUrl !== null) {
      expect(profile.githubProfileUrl).toBe("https://github.com/The-Despicable");
    }
  });

  it("invents no biography, credential, employer or affiliation", () => {
    // Dropping the placeholder is not licence to fabricate an identity. With no
    // personal name or biography supplied, the copy must stay a neutral
    // description of the portal and make no personal claim whatsoever.
    const text = `${profile.name} ${profile.headline} ${profile.bio} ${profile.currentFocus}`;
    expect(text).not.toMatch(/\b(PhD|MSc|BSc|CISSP|OSCP|CEH)\b/);
    expect(text).not.toMatch(/\b\d+\+?\s*(years?|yrs?)\s+(of\s+)?experience\b/i);
    expect(text).not.toMatch(/\b(works?|working)\s+(at|for)\s+[A-Z]/);
    expect(text).not.toMatch(/\b(Inc|Ltd|LLC|Corp|GmbH|University|College)\b\.?/);
  });

  it("routes the profile contact affordance to the Contact page", () => {
    // A null contactUrl rendered the literal "Contact · not configured" on the
    // home page, which is a visible scaffold artifact and is also misleading now
    // that a real Contact & Connect page exists.
    expect(profile.contactUrl).toBe("/community");
  });
});

describe("research bibliography honesty", () => {
  it("declares itself incomplete", () => {
    expect(bibliographyCompleteness.status).toBe("INCOMPLETE");
  });

  it("contains exactly one external publication", () => {
    const external = researchPapers.filter(
      (p) => p.publicationStatus === "PEER_REVIEWED" || p.publicationStatus === "PREPRINT",
    );
    expect(external).toHaveLength(1);
    expect(external[0].id).toBe("dream-rsi");
  });

  it("classifies Dream-RSI as inspiration, not as a pending candidate", () => {
    // The master roadmap (section 19.3, appendix B.2) records a narrow,
    // deliberate conceptual adoption. The previous labels — CANDIDATE_SUCCESSOR
    // and NOT_YET_INVESTIGATED — described something awaiting investigation,
    // which misstated what the records actually say.
    const dream = researchPapers.find((p) => p.id === "dream-rsi")!;
    expect(dream.provenance).toBe("SOURCE_OF_INSPIRATION");
    expect(dream.applicationStatus).toBe("REFERENCED_IN_DECISION");
  });

  it("still never claims Dream-RSI was implemented", () => {
    // Reclassifying it as inspiration must NOT become a backdoor claim that the
    // paper was used. The adoption is conceptual, and the copy has to say so.
    const dream = researchPapers.find((p) => p.id === "dream-rsi")!;
    expect(dream.applicationStatus).not.toBe("IMPLEMENTED_AND_DOCUMENTED");
    expect(dream.whereApplied).toMatch(/not as code/i);
    expect(dream.whereApplied).toMatch(/no code was copied|no dependency/i);
    expect(dreamRsiFeature.note).toMatch(/do not state that raphael implemented/i);
  });

  it("does not present awesome-rsi as a source of inspiration", () => {
    // awesome-rsi was only read to cross-check one recorded fact. It must not be
    // given the same badge as Dream-RSI, which would overstate it.
    const index = researchPapers.find((p) => p.id === "awesome-rsi-index")!;
    expect(index.provenance).toBe("REFERENCE_INDEX_CONSULTED");
    expect(index.applicationStatus).not.toBe("IMPLEMENTED_AND_DOCUMENTED");
    expect(index.whereApplied).toMatch(/no concept was adopted/i);
  });

  it("never asserts that an external paper was implemented", () => {
    for (const paper of researchPapers) {
      const isInternal = paper.publicationStatus === "INTERNAL";
      if (!isInternal) {
        expect(paper.applicationStatus).not.toBe("IMPLEMENTED_AND_DOCUMENTED");
      }
    }
  });

  it("places Dream-RSI in conceptual influences, not the primary card grid", () => {
    // Editorial placement: a full-size research card would imply Dream-RSI is a
    // record of the same kind as the project's internal entries. It influenced
    // planning only, so it belongs in the secondary section.
    expect(primaryResearchPapers.some((p) => p.id === "dream-rsi")).toBe(false);
    expect(conceptualInfluences.map((p) => p.id)).toContain("dream-rsi");
  });

  it("retains the arXiv link for the Dream-RSI influence", () => {
    const dream = conceptualInfluences.find((p) => p.id === "dream-rsi")!;
    expect(dream.arxivId).toBe("2609.14858");
    expect(dream.officialUrl).toBe("https://arxiv.org/abs/2609.14858");
  });

  it("keeps Dream-RSI framed as a planning influence, never as implementation", () => {
    // Placement must not soften the honesty constraints from the checks above.
    const dream = conceptualInfluences.find((p) => p.id === "dream-rsi")!;
    expect(dream.provenance).toBe("SOURCE_OF_INSPIRATION");
    expect(dream.applicationStatus).toBe("REFERENCED_IN_DECISION");
    expect(dream.applicationStatus).not.toBe("IMPLEMENTED_AND_DOCUMENTED");
    expect(dream.whereApplied).toMatch(/exploration policy/i);
    expect(dream.whereApplied).toMatch(/no code was copied|no dependency/i);
  });

  it("keeps awesome-rsi out of the primary grid as a consulted reference only", () => {
    // awesome-rsi was read to cross-check one recorded fact. A full card would
    // present it as research of its own, which overstates its role.
    expect(primaryResearchPapers.some((p) => p.id === "awesome-rsi-index")).toBe(false);
    expect(relatedSources.map((p) => p.id)).toContain("awesome-rsi-index");
    const index = relatedSources.find((p) => p.id === "awesome-rsi-index")!;
    expect(index.provenance).toBe("REFERENCE_INDEX_CONSULTED");
    expect(index.whereApplied).toMatch(/no concept was adopted/i);
    expect(index.officialUrl).toBe("https://github.com/lobehub/awesome-rsi");
  });

  it("keeps the two secondary tiers disjoint from the primary grid", () => {
    const primaryIds = new Set(primaryResearchPapers.map((p) => p.id));
    for (const p of [...conceptualInfluences, ...relatedSources]) {
      expect(primaryIds.has(p.id)).toBe(false);
    }
    // Nothing may be dropped: the tiers must partition the corpus exactly.
    const tiered = [
      ...primaryResearchPapers.map((p) => p.id),
      ...conceptualInfluences.map((p) => p.id),
      ...relatedSources.map((p) => p.id),
    ].sort();
    expect(tiered).toEqual(researchPapers.map((p) => p.id).sort());
  });

  it("marks unawaited submissions as awaiting review rather than published", () => {
    for (const paper of researchPapers) {
      expect(["REVIEWED", "AWAITING_REVIEW"]).toContain(paper.reviewStatus);
    }
  });
});

describe("assessment snapshot", () => {
  it("is dated and explicitly not revalidated", () => {
    expect(ASSESSMENT.date).toBe("2026-10-16");
    expect(ASSESSMENT.revalidated).toBe(false);
  });

  it("reports NOT_READY rather than a success framing", () => {
    expect(ASSESSMENT.overallReadiness).toBe("NOT_READY");
    expect(ASSESSMENT.gateDisposition).toContain("BLOCKED");
  });

  it("keeps blocker identifiers unique", () => {
    const ids = blockers.map((b) => b.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("gives every blocker evidence, a need, and an owner", () => {
    for (const b of blockers) {
      expect(b.evidence.length).toBeGreaterThan(10);
      expect(b.needed.length).toBeGreaterThan(5);
      expect(b.owner.length).toBeGreaterThan(0);
      expect(b.severity).toMatch(/^P[0-3]$/);
    }
  });

  it("does not reproduce credential material in the credential blocker", () => {
    const cred = blockers.find((b) => b.id === "CRED-001")!;
    // Must describe the remediation without ever quoting a key.
    expect(cred.whatIsKnown).toMatch(/rotation/i);
    expect(cred.whatIsKnown).not.toMatch(/nvapi-[A-Za-z0-9]/);
    expect(cred.whatIsKnown).not.toMatch(/sk-[A-Za-z0-9]{20}/);
  });
});

describe("no private infrastructure detail in published content", () => {
  // Deliberately scoped to research/assessment content. Project cards now link
  // to the owner's PUBLIC repositories, so the account handle appears there by
  // design — that is an intentional publication, not a leak. This set stays
  // narrow so it keeps guarding the content it was written for.
  const published = JSON.stringify({ researchPapers, blockers, ASSESSMENT });

  it("contains no RFC1918 internal addresses", () => {
    expect(published).not.toMatch(/\b10\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
    expect(published).not.toMatch(/\b192\.168\.\d{1,3}\.\d{1,3}\b/);
    expect(published).not.toMatch(/\b172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}\b/);
  });

  it("contains no absolute home-directory paths", () => {
    expect(published).not.toMatch(/\/home\/[a-z0-9_-]+\//i);
  });

  it("contains no git remote owner handles in research/assessment content", () => {
    expect(published).not.toMatch(/The-Despicable/i);
  });

  it("contains no full git object hashes", () => {
    expect(published).not.toMatch(/\b[0-9a-f]{40}\b/);
  });
});

describe("project cards expose no secret or private material", () => {
  it("carries no credential-shaped or local-path content", () => {
    const cards = JSON.stringify(projects);
    expect(cards).not.toMatch(/nvapi-|sk-[A-Za-z0-9]{20}|-----BEGIN/);
    expect(cards).not.toMatch(/\.env/i);
    expect(cards).not.toMatch(/\/home\/[a-z0-9_-]+\//i);
    expect(cards).not.toMatch(/\b(C:\\|\\\\wsl)/i);
  });

  it("links only to public repositories, never a private path or archive", () => {
    for (const p of projects) {
      if (!p.repositoryUrl) continue;
      expect(p.repositoryUrl).toMatch(/^https:\/\/github\.com\//);
      expect(p.repositoryUrl).not.toMatch(/\.git$|\.zip$|\.tar\.gz$/);
    }
  });
});

/**
 * PUBLIC CLAIM ACCURACY
 *
 * Found by a 2026-10-18 fact-check of every public Raphael claim. These are
 * tripwires for three specific ways the site was able to mislead a reader while
 * looking scrupulous. Each one failed before the corresponding correction.
 *
 * They deliberately assert *relationships and invariants*, not prose. A test
 * that pinned the exact corrected wording would pass while the meaning rotted;
 * these fail if the underlying relationship breaks again.
 */
describe("public claim accuracy", () => {
  const read = (p: string) => readFileSync(join(__dirname, "..", p), "utf8");

  it("never lets the mapping matrix contradict the paper it maps", () => {
    // The matrix and the paper entry both render on /research. When they
    // disagreed, the page simultaneously told the reader that Dream-RSI was
    // "NOT APPLIED ... NOT YET INVESTIGATED" and that it was "adopted as
    // inspiration at the planning level". Both statements rendered together.
    for (const mapping of researchMappings) {
      const paper = researchPapers.find((p) => p.id === mapping.paperId);
      if (!paper) continue;
      expect(
        mapping.status,
        `mapping for ${mapping.paperId} disagrees with its paper record`
      ).toBe(paper.applicationStatus);
    }
  });

  it("keeps Dream-RSI recorded as inspiration, never as an implemented method", () => {
    const paper = researchPapers.find((p) => p.id === "dream-rsi")!;
    const mapping = researchMappings.find((m) => m.paperId === "dream-rsi")!;
    expect(paper.provenance).toBe("SOURCE_OF_INSPIRATION");
    expect(mapping.status).not.toBe("NOT_YET_INVESTIGATED");
    expect(mapping.whereApplied).not.toMatch(/NOT APPLIED/i);
    // The distinction is only meaningful if "implemented" stays off the table.
    expect(mapping.whereApplied).not.toMatch(/implemented and verified/i);
    expect(dreamRsiFeature.treatment).toMatch(/NOT IMPLEMENTED/);
  });

  it("never renders a bare VERIFIED tag on the homepage", () => {
    // "Release readiness" sat above three unresolved blockers wearing a
    // VERIFIED tag, which reads as "release readiness: verified" — the exact
    // opposite of the list underneath it.
    const home = read("src/app/page.tsx");
    expect(home).not.toMatch(/EvidenceTag label="VERIFIED"/);
    // The repository is published now, so the heading no longer claims the link
    // is withheld. It still enumerates the residuals that travel with the link.
    expect(home).toMatch(/Published repository · residuals/);
    expect(home).not.toMatch(/Release readiness · not approved/);
  });

  it("keeps the published repository's residuals enumerated", () => {
    expect(releaseReadiness.approved).toBe(true);
    // Two residuals remain after the licence was resolved.
    expect(releaseReadiness.outstanding.length).toBeGreaterThanOrEqual(2);
    const joined = releaseReadiness.outstanding.join(" ").toLowerCase();
    expect(joined).toMatch(/credential/);
    expect(joined).toMatch(/offensive/);
  });

  it("records the repository as MIT-licensed now that a LICENSE exists", () => {
    expect(releaseReadiness.reason).toMatch(/MIT-licensed/);
  });

  it("defines what a VERIFIED tag means wherever it is used unqualified", () => {
    // On the timeline, VERIFIED qualifies an EVENT being recorded — not Raphael
    // having been executed and validated. The assessment ran no tests of its
    // own, so without this qualifier the tag overstates what was checked.
    const status = read("src/app/status/page.tsx");
    const at = status.indexOf("Milestones, source-supported");
    expect(at).toBeGreaterThan(-1);
    expect(status.slice(at, at + 800)).toMatch(/structural and documentary/);
  });

  it("keeps every timeline label inside the declared evidence vocabulary", () => {
    for (const event of timeline) {
      expect(["VERIFIED", "DOCUMENTED", "INFERRED"]).toContain(event.label);
    }
  });

  it("keeps the mandatory unresolved statuses visible on the status page", () => {
    // G3, the canonical roadmap milestone, and the central thesis. None of these
    // may quietly disappear; they are the findings that matter most.
    const status = read("src/app/status/page.tsx");
    for (const marker of ["NOT ACCEPTED", "NOT EXECUTED", "UNRESOLVED"]) {
      expect(status).toContain(marker);
    }
    expect(ASSESSMENT.overallReadiness).toBe("NOT_READY");
    expect(ASSESSMENT.gateDisposition).toContain("BLOCKED");
    expect(ASSESSMENT.revalidated).toBe(false);
  });

  it("does not present the dated assessment as live telemetry", () => {
    // The assessment is a frozen 2026-10-16 snapshot. Any wording implying a
    // current reading of project state would overstate its currency.
    const status = read("src/app/status/page.tsx");
    expect(status).toMatch(/dated findings, not live telemetry/i);
    expect(status).toMatch(/has not\s+been revalidated/i);
  });
});

/**
 * EVIDENCE PROVENANCE
 *
 * The 2026-10-18 provenance audit located and authenticated the source
 * assessment, then checked this site's transcription of it field by field: 10/10
 * readiness dimensions, 22/22 blocker ids and severities, the confidence value
 * and all four strategic scores matched exactly.
 *
 * These tests guard the boundary that audit exposed as the easy thing to lose.
 * Authenticating an artifact says the artifact is intact. It says nothing about
 * whether the artifact's conclusions are right — so a finding may not quietly
 * inherit `canonical` merely because it sits next to something that earned it.
 */
const PROVENANCE_CATEGORIES: readonly ProvenanceCategory[] = [
  "canonical",
  "unauthenticated_internal_note",
  "transcription",
];

describe("evidence provenance record", () => {
  const entry = (id: string) => {
    const found = evidenceProvenance.find((e) => e.findingId === id);
    expect(found, `no provenance entry for ${id}`).toBeDefined();
    return found!;
  };

  it("keeps the assessment marked as a snapshot that has not been revalidated", () => {
    // Authenticating the artifact does not revalidate Raphael. These integrity
    // checks are about identity and transcription fidelity, nothing more.
    expect(ASSESSMENT.revalidated).toBe(false);
    expect(ASSESSMENT.date).toBe("2026-10-16");
  });

  it("records the published source link and its residuals", () => {
    expect(releaseReadiness.approved).toBe(true);
    expect(releaseReadiness.outstanding.length).toBeGreaterThanOrEqual(2);
  });

  it("classifies only with the declared categories", () => {
    for (const e of evidenceProvenance) {
      expect(PROVENANCE_CATEGORIES).toContain(e.category);
    }
  });

  it("gives every finding a unique identifier", () => {
    const ids = evidenceProvenance.map((e) => e.findingId);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids.length).toBeGreaterThan(0);
  });

  it("never marks an unauthenticated or transcribed finding as canonical", () => {
    // These four have no authenticated artifact behind them. Promoting any of
    // them must be a deliberate, visible change — that is the whole point of
    // recording them separately instead of folding them into the assessment's
    // own authority.
    for (const id of [
      "EVAL-001-DRIFT",
      "DREAM-RSI-STRUCTURAL-CONCERN",
      "AWESOME-RSI-ENTRY-COUNT",
      "SITE-TRANSCRIPTION",
    ]) {
      expect(entry(id).category, `${id} must not be canonical`).not.toBe("canonical");
    }
  });

  it("splits the evaluation finding so an authenticated dataset claim cannot carry an unadjudicated drift claim", () => {
    // Both sit under blocker EVAL-001, but only the dataset absence rests on an
    // integrity-checked manifest. The drift classification comes from a record
    // that describes itself as non-authoritative and pending a decision.
    expect(entry("EVAL-001-DATASET").category).toBe("canonical");
    expect(entry("EVAL-001-DRIFT").category).toBe("unauthenticated_internal_note");
  });

  it("requires every entry to state what it does not establish", () => {
    // An entry that cannot state its own limit is not specific enough to record.
    for (const e of evidenceProvenance) {
      expect(e.establishes.trim().length).toBeGreaterThan(20);
      expect(e.doesNotEstablish.trim().length).toBeGreaterThan(20);
    }
  });

  it("keeps artifact authentication separate from claim validation", () => {
    // The boundary this guards: an authenticated artifact is evidence ABOUT the
    // artifact, not about Raphael. So no canonical entry may assert that the
    // thing it sources has been proven or validated. Asserting the absence of a
    // claim is done here rather than by pattern-matching negation words in the
    // prose, which would test wording instead of meaning.
    for (const e of evidenceProvenance.filter((x) => x.category === "canonical")) {
      expect(
        e.doesNotEstablish,
        `${e.findingId} must not assert validation`
      ).not.toMatch(/\b(proves|proven|validated|confirmed)\b[^.]{0,40}\b(raphael|conclusion|behaviou?r)\b/i);
    }
    // The strongest claim in the record carries the explicit disclaimer.
    expect(entry("ASSESSMENT-ARTIFACT").doesNotEstablish).toMatch(
      /artifact identity is not claim validation/i
    );
    // And the blocker register, which is entirely the assessor's own judgement,
    // must say the severities were not independently validated.
    expect(entry("RPH-BLOCKER-REGISTER").doesNotEstablish).toMatch(
      /not been independently validated|independently validated/i
    );
  });

  it("carries no paths, checksums, or credential-shaped content", () => {
    // Provenance metadata is safe to render, so it must not become a leak.
    const blob = JSON.stringify(evidenceProvenance);
    expect(blob).not.toMatch(/[0-9a-f]{40,}/i);
    expect(blob).not.toMatch(/\/home\/|[A-Za-z]:\\/);
    expect(blob).not.toMatch(/\b\d{7,}\b/);
    expect(blob).not.toMatch(/nvapi-|sk-[A-Za-z0-9]{20}|BEGIN [A-Z ]*PRIVATE KEY/i);
    expect(blob).not.toMatch(/\.env\b/i);
  });
});

describe("Dream-RSI provenance", () => {
  const dream = researchPapers.find((p) => p.id === "dream-rsi")!;
  const index = researchPapers.find((p) => p.id === "awesome-rsi-index")!;

  it("records the adoption as an authenticated roadmap entry", () => {
    expect(dream.supportingEvidence).toMatch(/integrity-checked archive/i);
    expect(dream.supportingEvidence).toMatch(/re-verifies exactly as it was recorded/i);
  });

  it("does not let authentication imply implementation", () => {
    // The exact failure mode this guards: "the record is authentic" silently
    // becoming "therefore the method is implemented."
    expect(dream.supportingEvidence).toMatch(
      /does not implement, validate or reproduce/i
    );
    expect(dream.whereApplied).toMatch(/No code was copied/i);
    expect(dream.provenance).toBe("SOURCE_OF_INSPIRATION");
    expect(dream.applicationStatus).toBe("REFERENCED_IN_DECISION");
    expect(dream.applicationStatus).not.toBe("IMPLEMENTED_AND_DOCUMENTED");
  });

  it("keeps Awesome RSI a secondary cross-check with a qualified count", () => {
    expect(index.provenance).toBe("REFERENCE_INDEX_CONSULTED");
    expect(index.applicationStatus).toBe("CONCEPTUALLY_RELATED");
    expect(index.whereApplied).toMatch(/no concept was adopted/i);
    // The recorded count stays explicitly un-verified by this site.
    expect(index.supportingEvidence).toMatch(/not independently re-counted/i);
    expect(primaryResearchPapers.some((p) => p.id === "awesome-rsi-index")).toBe(
      false
    );
  });

  it("publishes the complete author list exactly as the source record gives it", () => {
    // Transcribed from the arXiv publication metadata, which lists all 17.
    // An abbreviated form would look equally authoritative while being
    // unverifiable, so the full list is asserted verbatim.
    expect(dream.authors).toBe(
      "Tong Zheng, Xidong Wu, Zheng Zhang, Zhankui He, Chaoyi Zhang, Benjamin Coleman, Ruoqiao Wei, Di Bai, Haolin Liu, Rui Liu, Xue Wang, Yue Zhuan, Wang-Cheng Kang, Renkai Xiang, Heng Huang, Xinwu Cheng, Yunsong Guo"
    );
    const names = dream.authors!.split(",").map((s) => s.trim());
    expect(names).toHaveLength(17);
    expect(new Set(names).size).toBe(17);
    expect(names[0]).toBe("Tong Zheng");
    expect(names[16]).toBe("Yunsong Guo");
    expect(dream.authors).not.toMatch(/et al/i);
  });
});