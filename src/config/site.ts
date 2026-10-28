/**
 * Central, typed site configuration.
 *
 * RELEASE POSITION (2026-10-18)
 * -----------------------------
 * The Raphael source repository is PUBLIC and is now linked from this site. The
 * owner approved publishing that link, so `releaseReadiness.approved` is true and
 * the gate no longer withholds the source affordance.
 *
 * Publishing the link is NOT a statement that the repository is clean. Residuals
 * remain and are recorded in `outstanding`, surfaced on the project card and on
 * the home page. Do not delete them to tidy the page: they describe the published
 * artifact as it actually is.
 */

export interface ReleaseReadiness {
  /** Owner has approved publishing a link to the source repository. */
  approved: boolean;
  /** Short statement of the release position, shown in the availability notice. */
  reason: string;
  /**
   * Residuals recorded against the PUBLISHED artifact. This is not a to-do list
   * that gates publication, and it is not empty merely because the link is live:
   * an honest published repo still has to disclose what is wrong with it.
   */
  outstanding: readonly string[];
  /** ISO date of the review that produced this state. */
  reviewedOn: string;
}

export interface Profile {
  /**
   * Portal identity. Kept neutral because no personal name was supplied; this
   * field is never rendered as a person's name.
   */
  name: string;
  /** True while any field below still contains unfilled placeholder text. */
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

/**
 * Repository link state, stated explicitly rather than inferred from a null URL.
 *
 * A null `repositoryUrl` alone cannot distinguish "we deliberately withheld this"
 * from "we never found one", and a reviewer should not have to guess which.
 */
export type ProjectLinkStatus =
  /** URL confirmed to point at the owner's own repository. Safe to link. */
  | "verified"
  /**
   * A repository exists, but release or link review has not passed. The link is
   * deliberately withheld. Scoped PER PROJECT: Raphael's release gate does not
   * automatically apply to unrelated projects.
   */
  | "pending_review"
  /** No reliable URL was established. Never guessed, never fabricated. */
  | "unverified";

export interface ProjectCard {
  id: string;
  name: string;
  role: "primary" | "successor" | "portfolio";
  summary: string;
  /** Longer description used on the home page project panel. */
  description: string;
  tech: readonly string[];
  /** Rendered only when linkStatus is "verified". */
  repositoryUrl: string | null;
  /** Secondary documentation/demo link, same rule as repositoryUrl. */
  docsUrl: string | null;
  /**
   * Optional INTERNAL site route for this project, e.g. an architecture
   * explorer.
   *
   * Kept separate from `docsUrl` on purpose: `docsUrl` is an external
   * destination that leaves the site, while this is a page of the site itself.
   * Merging them would force the card to apply "opens in a new tab" and
   * external-link semantics to a local route, and would make the destination's
   * nature invisible in the data model.
   */
  internalPath: string | null;
  /** Label for the internal link. Never implies a source-release affordance. */
  internalLinkLabel: string | null;
  linkStatus: ProjectLinkStatus;
  /**
   * Rendered instead of a repository link whenever the link is withheld.
   * Never a fabricated URL.
   */
  availabilityNote: string | null;
  /** Optional short honest caveat shown on the card. */
  caveat: string | null;
}

/**
 * Canonical public origin for absolute metadata URLs.
 *
 * `NEXT_PUBLIC_SITE_URL` takes precedence when set. This documented production
 * origin is the fallback so canonical and Open Graph URLs are always absolute —
 * a relative OG image URL cannot be fetched by social crawlers such as LinkedIn's.
 */
export const SITE_ORIGIN_FALLBACK = "https://raphael-portal.vercel.app";

export const releaseReadiness: ReleaseReadiness = {
  approved: true,
  reason:
    "The Raphael source repository is public, MIT-licensed and linked from this site. Two residuals remain: its history records a credential exposure, and offensive-tooling references stay in-tree. They are listed so the link is not read as an endorsement of the code.",
  outstanding: [
    "Repository history records a credential exposure (2026-10-04); rotation is not independently confirmed.",
    "Offensive-tooling references remain in-tree (e.g. references/offensive-tactics/, orchestrator/chains/).",
  ],
  reviewedOn: "2026-10-16",
};

export const profile: Profile = {
  // No personal name or biography has been supplied for this site, so none is
  // invented. The hero heading is fixed text and does not render this field;
  // it is kept only so the shape stays stable if a name is provided later.
  name: "Raphael Research Portal",
  isPlaceholder: false,
  headline: "Security research · governed agents · evidence provenance",
  bio: "An independent research portal documenting Raphael — an ambitious and unfinished AI security research project — and the governance, evidence-provenance and reproducibility questions it raises. Everything published here is marked with what is implemented, what has been tested, and what is still unresolved.",
  currentFocus: "Documenting Raphael's architecture and evidence status honestly",
  focusAreas: [
    "Autonomous agents",
    "Policy enforcement",
    "Evidence provenance",
    "Reproducibility",
    "AI safety evaluation",
  ],
  githubProfileUrl: "https://github.com/The-Despicable",
  // Internal route, not an external address: points at Contact & Connect.
  contactUrl: "/community",
  contactLabel: "Contact",
};

export interface ContactChannel {
  id: string;
  /** Platform name, rendered as the card heading. */
  platform: string;
  /** The exact handle or address shown to the visitor. */
  display: string;
  /** The exact destination. */
  href: string;
  /**
   * True when the destination leaves this site. Drives `target`/`rel` and the
   * screen-reader "(opens in a new tab)" hint, so a mailto: link is never
   * mislabelled as an external destination.
   */
  external: boolean;
}

/**
 * Public contact channels, in display order.
 *
 * The displayed text and the link target are separate fields on purpose: the
 * handle is shown verbatim and never rewritten, so a capitalisation or spelling
 * mistake cannot be hidden behind a correct-looking link.
 *
 * Only channels the owner supplied are listed. Nothing here is inferred, and no
 * channel is added on speculation.
 */
export const contactChannels: readonly ContactChannel[] = [
  {
    id: "email",
    platform: "Email",
    display: "rot7051@gmail.com",
    href: "mailto:rot7051@gmail.com",
    external: false,
  },
  {
    id: "telegram",
    platform: "Telegram",
    display: "@zack405",
    href: "https://t.me/zack405",
    external: true,
  },
  {
    id: "instagram",
    platform: "Instagram",
    display: "@yaser.hussain19",
    href: "https://www.instagram.com/yaser.hussain19/",
    external: true,
  },
  {
    id: "x",
    platform: "X",
    display: "@Hussain69Yaser",
    href: "https://x.com/Hussain69Yaser",
    external: true,
  },
];

export const navItems: readonly NavItem[] = [
  { href: "/", label: "Home", description: "Portfolio and project overview" },
  { href: "/raphael", label: "Raphael", description: "Goals and documented architecture" },
  {
    href: "/raphael/architecture",
    label: "Architecture",
    description: "Documented current state and Blueprint v4.2 target",
  },
  {
    href: "/raphael/timeline",
    label: "Timeline",
    description: "Project history from Ultimate Skill to the v4.x present position",
  },
  { href: "/raphael/frozen", label: "Freeze Status", description: "Frozen runtime state, native fallback, cutover triggers" },
  { href: "/research", label: "Research", description: "Papers and application mapping" },
  { href: "/status", label: "Project Status", description: "Current state, blockers, roadmap" },
  { href: "/community", label: "Contact", description: "Email, Telegram, Instagram and X" },
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
    repositoryUrl: "https://github.com/The-Despicable/raphael-2.0-rbsv2r",
    docsUrl: null,
    // Internal architecture explorer. This is a page OF this site, not an
    // external destination and not a source-release affordance: it documents
    // the recorded architecture and the proposed blueprint, and it deliberately
    // introduces no download or release-gate language.
    internalPath: "/raphael/architecture",
    internalLinkLabel: "Architecture",
    // Published. The URL points at the owner's own repository and resolves, so the
    // status is "verified" rather than "pending_review". The residuals travel in
    // `caveat` and in releaseReadiness.outstanding: an open link must not be read
    // as a statement that the repository is clean.
    linkStatus: "verified",
    availabilityNote: null,
    caveat:
      "Public and MIT-licensed. Its history records a credential exposure and offensive-tooling references remain in-tree. Research artifact: not production-ready, not independently verified, not release-approved.",
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
    internalPath: null,
    internalLinkLabel: null,
    // Checked: no Vesper repository exists under the owner's GitHub account.
    // A URL is therefore absent because none was established, not because it is
    // being withheld. Recorded distinctly so the card cannot imply otherwise.
    linkStatus: "unverified",
    availabilityNote:
      "No public repository was located for this project, so no link is shown rather than a guessed one.",
    caveat: "Do not assume Raphael's security properties carry over.",
  },
  {
    id: "computer-control-mcp",
    name: "Computer Control MCP",
    role: "portfolio",
    summary:
      "A Windows-first computer-control layer for AI agents, exposing desktop observation and input over MCP.",
    description:
      "An MCP server that gives an agent a bounded computer capability layer: observation and perception, mouse and keyboard input, window control, and synchronisation. Its defining property is safety binding — every perception call mints a screen_id, mutations must arrive within a freshness window and are re-gated in-process against the foreground window and monitor layout immediately before any input is injected. Every mutation returns a receipt with an explicit CONFIRMED, REJECTED or UNCERTAIN outcome, and the server reports evidence only: it never retries or compensates. Perception uses UI Automation first and OCR only as a fallback, with oversized regions tiled on a two-dimensional grid and tile-local coordinates offset back to global space. A persistent PowerShell worker pool, split across control and perception lanes, keeps a slow OCR pass from starving a window switch. It carries no provider logic and no development-loop logic — it is the computer capability layer only.",
    tech: [
      "TypeScript",
      "Model Context Protocol",
      "PowerShell",
      "UI Automation",
      "OCR",
      "Zod",
    ],
    repositoryUrl: "https://github.com/The-Despicable/computer-control-mcp",
    docsUrl: null,
    internalPath: null,
    internalLinkLabel: null,
    linkStatus: "verified",
    availabilityNote: null,
    caveat:
      "Public repository with no license file, so it is not licensed for reuse. Version 1.0.0; unit and gate test suites are present.",
  },
  {
    id: "rupewatch",
    name: "RupeWatch",
    role: "portfolio",
    summary: "A currency-tracking project. Repository link withheld pending review.",
    description:
      "A currency-tracking project. Its repository is deliberately not linked from this site. A credential file was committed in that repository's history and was flagged for rotation and history remediation; that remediation has not been independently confirmed, so the link is withheld rather than promoted on the strength of an unverified fix.",
    tech: [],
    repositoryUrl: null,
    docsUrl: null,
    internalPath: null,
    internalLinkLabel: null,
    // Withheld on purpose — NOT an absent URL. Mirrors how Raphael's own card
    // distinguishes "we are not publishing this yet" from "we never found one".
    // Promoting this to a verified link requires the credential-history
    // remediation to be independently confirmed first; it is not a styling choice.
    linkStatus: "pending_review",
    availabilityNote:
      "Link withheld pending review: a committed credential file in that repository's history was flagged for rotation and remediation, and that status is not independently confirmed. No link is shown rather than a link that outruns the evidence.",
    caveat: "Not promoted until the credential-history review is independently confirmed resolved.",
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