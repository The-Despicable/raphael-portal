/**
 * Central, typed site configuration.
 *
 * SECURITY / RELEASE NOTE
 * -----------------------
 * `releaseReadiness` below is a hard gate. The Raphael repository is NOT cleared
 * for public release: as of the 2026-10-16 assessment it has no license, has
 * credentials exposed in history with rotation pending, and contains unresolved
 * offensive tooling. While `approved === false` the UI must render a neutral
 * repository-availability notice and must NOT render a source link, an archive
 * download, or any "fork / clone / view source" affordance.
 *
 * Flipping `approved` to true is an explicit owner decision, not a code detail.
 */

export interface ReleaseReadiness {
  /** Owner has reviewed and approved public release of the source repository. */
  approved: boolean;
  /** Short reason shown in the neutral availability notice. */
  reason: string;
  /** What is still required before this can flip to true. */
  outstanding: readonly string[];
  /** ISO date of the review that produced this state. */
  reviewedOn: string;
}

export interface Profile {
  /** EDITABLE PLACEHOLDER — replace with the real name before publication. */
  name: string;
  /** True while any field below still contains placeholder text. */
  isPlaceholder: boolean;
  headline: string;
  bio: string;
  currentFocus: string;
  focusAreas: readonly string[];
  githubProfileUrl: string | null;
  contactUrl: string | null;
  /** Label for the contact affordance; keep generic, never a personal address. */
  contactLabel: string;
}

export interface NavItem {
  href: string;
  label: string;
  description: string;
}

export interface ProjectCard {
  id: string;
  name: string;
  role: "primary" | "successor" | "portfolio";
  summary: string;
  /** Longer description used on the home page project panel. */
  description: string;
  tech: readonly string[];
  repositoryUrl: string | null;
  docsUrl: string | null;
  /**
   * Rendered instead of a repository link when the release gate is closed, or
   * when no verified URL was supplied. Never a fabricated URL.
   */
  availabilityNote: string | null;
  /** Optional short honest caveat shown on the card. */
  caveat: string | null;
}

export const releaseReadiness: ReleaseReadiness = {
  approved: false,
  reason:
    "The source repository has not cleared release review. Public source availability is pending owner approval.",
  outstanding: [
    "No license file is present, so the project is not licensed for reuse.",
    "Credentials were exposed in repository history; rotation was recorded as pending on 2026-10-16.",
    "Unresolved offensive tooling (payload modules and a volumetric-attack service) remain in-tree.",
  ],
  reviewedOn: "2026-10-16",
};

export const profile: Profile = {
  name: "Your Name",
  isPlaceholder: true,
  headline: "Security research · governed agents · evidence provenance",
  bio: "EDITABLE PLACEHOLDER — replace this paragraph with a two or three sentence biography. This site is an independent research portal; the profile column on the home page is populated entirely from this configuration file and nothing is inferred at runtime.",
  currentFocus: "Documenting Raphael's architecture and evidence status honestly",
  focusAreas: [
    "Autonomous agents",
    "Policy enforcement",
    "Evidence provenance",
    "Reproducibility",
    "AI safety evaluation",
  ],
  githubProfileUrl: null,
  contactUrl: null,
  contactLabel: "Contact",
};

export const navItems: readonly NavItem[] = [
  { href: "/", label: "Home", description: "Portfolio and project overview" },
  { href: "/raphael", label: "Raphael", description: "Goals and documented architecture" },
  { href: "/research", label: "Research", description: "Papers and application mapping" },
  { href: "/status", label: "Project Status", description: "Current state, blockers, roadmap" },
  { href: "/community", label: "Community", description: "Guest chat and reviews" },
];

/**
 * Suggested projects. Only entries with a verified public URL may render a
 * repository link; everything else shows an availability note instead.
 */
export const projects: readonly ProjectCard[] = [
  {
    id: "raphael",
    name: "Raphael",
    role: "primary",
    summary: "Research-grade autonomous security platform with a governed authorization spine.",
    description:
      "A large autonomous-security research artifact built around a canonical cognitive runtime and a deny-by-default policy decision point. Assessed on 2026-10-16 as NOT_READY: the central research claim is self-graded UNRESOLVED and governance is blocked at gate G3.",
    tech: ["Python", "Orchestration", "Policy engines", "Evidence graphs"],
    repositoryUrl: null,
    docsUrl: null,
    availabilityNote:
      "Source not publicly released. Pending owner release review (no license; credential-history remediation outstanding).",
    caveat: "Design reference. Not production-ready and not independently verified.",
  },
  {
    id: "vesper",
    name: "Vesper",
    role: "successor",
    summary: "Independent clean-room successor. Separate project, separate security properties.",
    description:
      "A governed security-testing agent built independently of Raphael, carrying forward selected design laws by citation rather than code. Its security properties are its own and do not transfer from Raphael.",
    tech: ["Python", "Monotonic gates", "Claim ladders"],
    repositoryUrl: null,
    docsUrl: null,
    availabilityNote: "Independent project. Repository link not yet configured for this site.",
    caveat: "Do not assume Raphael's security properties carry over.",
  },
  {
    id: "rupewatch",
    name: "RupeWatch",
    role: "portfolio",
    summary: "Supporting project — placeholder entry.",
    description:
      "EDITABLE PLACEHOLDER — describe RupeWatch here, or remove this card from src/config/site.ts if it should not be featured.",
    tech: [],
    repositoryUrl: null,
    docsUrl: null,
    availabilityNote: "Repository URL not verified. Link intentionally withheld rather than guessed.",
    caveat: null,
  },
];

/** Public, deliberately conservative footer/legal links. */
export const conductSummary: readonly string[] = [
  "Respectful, technically constructive discussion.",
  "No sharing of private credentials or sensitive target data.",
  "No unauthorized scanning, exploitation, or requests for system access.",
  "Distinguish evidence from speculation.",
  "Cite papers and source documents when making technical claims.",
];