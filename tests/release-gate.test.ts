import { describe, expect, it } from "vitest";
import { profile, projects, releaseReadiness } from "@/config/site";
import { researchPapers, bibliographyCompleteness, dreamRsiFeature } from "@/content/research";
import { blockers, ASSESSMENT } from "@/content/status";

/**
 * RELEASE-GATE TESTS
 *
 * These are not ordinary unit tests. They are tripwires: if someone "fixes" the
 * site by quietly enabling public source access, deleting the release-review
 * notice, or padding the bibliography with plausible-looking citations, these
 * tests fail. That is the intended behaviour.
 */

describe("release readiness gate", () => {
  it("is currently CLOSED — public source access is not approved", () => {
    expect(releaseReadiness.approved).toBe(false);
  });

  it("records why the gate is closed", () => {
    expect(releaseReadiness.reason.length).toBeGreaterThan(20);
    expect(releaseReadiness.outstanding.length).toBeGreaterThan(0);
    expect(releaseReadiness.reviewedOn).toBe("2026-10-16");
  });

  it("names licence, credential-history and offensive-tooling as outstanding", () => {
    const joined = releaseReadiness.outstanding.join(" ").toLowerCase();
    expect(joined).toMatch(/licen[cs]e/);
    expect(joined).toMatch(/credential/);
    expect(joined).toMatch(/offensive/);
  });

  it("keeps every repository URL null while the gate is closed", () => {
    // A populated URL here would mean the UI could render a source link.
    for (const project of projects) {
      if (!releaseReadiness.approved) {
        expect(project.repositoryUrl).toBeNull();
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

describe("profile placeholders", () => {
  it("is flagged as a placeholder so real data is never implied", () => {
    expect(profile.isPlaceholder).toBe(true);
  });

  it("does not ship a fabricated GitHub profile URL", () => {
    expect(profile.githubProfileUrl).toBeNull();
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
  const published = JSON.stringify({ researchPapers, blockers, ASSESSMENT });

  it("contains no RFC1918 internal addresses", () => {
    expect(published).not.toMatch(/\b10\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/);
    expect(published).not.toMatch(/\b192\.168\.\d{1,3}\.\d{1,3}\b/);
    expect(published).not.toMatch(/\b172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}\b/);
  });

  it("contains no absolute home-directory paths", () => {
    expect(published).not.toMatch(/\/home\/[a-z0-9_-]+\//i);
  });

  it("contains no git remote owner handles", () => {
    expect(published).not.toMatch(/The-Despicable/i);
  });

  it("contains no full git object hashes", () => {
    expect(published).not.toMatch(/\b[0-9a-f]{40}\b/);
  });
});