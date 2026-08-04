/**
 * Tech Atlas pillar illustrations.
 *
 * Every pillar previously shared one composition: a centred icon, three nodes,
 * and the same two crossing paths, with only the icon and a label changing. The
 * artwork could not tell Resources from Contribute.
 *
 * Each pillar now has its own diagram explaining what the section *does* —
 * sources entering a reviewed catalog, ordered stages reaching an outcome,
 * answers branching into recommended directions, a contribution moving through
 * review to publication. Guides and Comparisons get companion motifs so they do
 * not read as more copies of the pillar art.
 *
 * The diagrams are HTML and CSS with token colours, so they follow light and
 * dark, the few labels scale with browser text settings, and there is no
 * animation to suppress under reduced motion. Minor detail is dropped rather
 * than shrunk on small screens.
 */

export type AtlasPillarConcept =
  | "resources"
  | "learning-paths"
  | "pathfinder"
  | "careers"
  | "ways-of-working"
  | "teams"
  | "glossary"
  | "contribute"
  | "guides"
  | "comparisons";

/** Section href -> illustration concept. */
export const ATLAS_PILLAR_CONCEPTS: Record<string, AtlasPillarConcept> = {
  "/resources": "resources",
  "/learning-paths": "learning-paths",
  "/career-pathfinder": "pathfinder",
  "/guides": "guides",
  "/comparisons": "comparisons",
  "/tech-careers": "careers",
  "/ways-of-working": "ways-of-working",
  "/tech-teams": "teams",
  "/tech-glossary": "glossary",
  "/contribute": "contribute",
};

export function resolveAtlasConcept(href: string): AtlasPillarConcept | null {
  return ATLAS_PILLAR_CONCEPTS[href] ?? null;
}

/* Sources are catalogued, reviewed, then connected onward. */
function ResourcesIllustration() {
  return (
    <div className="atlas-ill atlas-ill-resources">
      <div className="atlas-ill-sources">
        {["doc", "course", "repo"].map((kind) => (
          <span key={kind} className={`atlas-ill-source atlas-ill-source-${kind}`} />
        ))}
      </div>
      <span className="atlas-ill-flow" />
      <div className="atlas-ill-shelf">
        <span className="atlas-ill-shelf-label">Catalog</span>
        <div className="atlas-ill-shelf-rows">
          {[0, 1, 2].map((row) => (
            <span key={row} className="atlas-ill-shelf-row">
              <i /><i /><i /><i />
            </span>
          ))}
        </div>
        <span className="atlas-ill-status">Reviewed</span>
      </div>
      <span className="atlas-ill-flow atlas-ill-detail" />
      <div className="atlas-ill-outlets atlas-ill-detail">
        <span className="atlas-ill-outlet" />
        <span className="atlas-ill-outlet" />
      </div>
    </div>
  );
}

/* Ordered stages, checkpoints passed, one finished project at the end. */
function LearningPathsIllustration() {
  return (
    <div className="atlas-ill atlas-ill-path">
      <div className="atlas-ill-track">
        <span className="atlas-ill-track-line" />
        <span className="atlas-ill-track-fill" />
        {["01", "02", "03", "04"].map((step, index) => (
          <span key={step} className={`atlas-ill-stage ${index < 2 ? "is-done" : ""} ${index === 2 ? "is-current" : ""}`}>
            <em>{step}</em>
          </span>
        ))}
      </div>
      <div className="atlas-ill-outcome">
        <span className="atlas-ill-outcome-label">Project</span>
        <span className="atlas-ill-outcome-lines"><i /><i /><i /></span>
        <span className="atlas-ill-outcome-star" />
      </div>
    </div>
  );
}

/* Answers narrow three directions down to one recommendation. */
function PathfinderIllustration() {
  return (
    <div className="atlas-ill atlas-ill-pathfinder">
      <div className="atlas-ill-answers">
        <span className="atlas-ill-answer is-picked" />
        <span className="atlas-ill-answer" />
        <span className="atlas-ill-answer is-picked" />
      </div>
      <div className="atlas-ill-fan">
        <svg viewBox="0 0 60 110" preserveAspectRatio="none" focusable="false" aria-hidden>
          <path d="M0 55 C30 55 30 16 60 16" className="atlas-ill-branch" />
          <path d="M0 55 H60" className="atlas-ill-branch atlas-ill-branch-strong" />
          <path d="M0 55 C30 55 30 94 60 94" className="atlas-ill-branch" />
        </svg>
      </div>
      <div className="atlas-ill-outcomes">
        <span className="atlas-ill-outcome-card" />
        <span className="atlas-ill-outcome-card is-recommended">
          <em>Best fit</em>
        </span>
        <span className="atlas-ill-outcome-card" />
      </div>
    </div>
  );
}

/* One role, the work it produces, the people around it, the skills it needs. */
function CareersIllustration() {
  return (
    <div className="atlas-ill atlas-ill-careers">
      <div className="atlas-ill-role">
        <span className="atlas-ill-avatar" />
        <span className="atlas-ill-role-label">Role</span>
      </div>
      <div className="atlas-ill-skills">
        {[86, 62, 44].map((width) => (
          <span key={width} className="atlas-ill-skill"><i style={{ width: `${width}%` }} /></span>
        ))}
      </div>
      <div className="atlas-ill-outputs">
        <span className="atlas-ill-output atlas-ill-output-doc"><i /><i /><i /></span>
        <span className="atlas-ill-output atlas-ill-output-chart"><i /><i /><i /><i /></span>
      </div>
      <div className="atlas-ill-collaborators atlas-ill-detail">
        <span /><span /><span />
      </div>
    </div>
  );
}

/* A delivery loop with a feedback return, beside the linear alternative. */
function WaysOfWorkingIllustration() {
  return (
    <div className="atlas-ill atlas-ill-ways">
      <div className="atlas-ill-loop">
        <svg viewBox="0 0 120 120" focusable="false" aria-hidden>
          <circle cx="60" cy="60" r="44" className="atlas-ill-loop-track" />
          <path d="M60 16 A44 44 0 1 1 25 78" className="atlas-ill-loop-arc" />
          <path d="M22 70 L25 80 L35 77" className="atlas-ill-loop-head" />
          <circle cx="60" cy="16" r="7" className="atlas-ill-loop-node" />
          <circle cx="104" cy="60" r="7" className="atlas-ill-loop-node" />
          <circle cx="60" cy="104" r="7" className="atlas-ill-loop-node" />
          <circle cx="16" cy="60" r="7" className="atlas-ill-loop-node is-accent" />
          <path d="M60 40 A20 20 0 0 1 78 60" className="atlas-ill-loop-inner" />
        </svg>
      </div>
      <div className="atlas-ill-patterns">
        <span className="atlas-ill-pattern">
          <em>Iterative</em>
          <i className="atlas-ill-pattern-loop" />
        </span>
        <span className="atlas-ill-pattern atlas-ill-detail">
          <em>Sequential</em>
          <i className="atlas-ill-pattern-line" />
        </span>
      </div>
    </div>
  );
}

/* Pods hand work along a delivery lifecycle. */
function TeamsIllustration() {
  return (
    <div className="atlas-ill atlas-ill-teams">
      <div className="atlas-ill-pods">
        {["Discovery", "Build", "Run"].map((pod, index) => (
          <span key={pod} className="atlas-ill-pod">
            <i /><i /><i />
            {index < 2 ? <b className="atlas-ill-handoff" /> : null}
          </span>
        ))}
      </div>
      <div className="atlas-ill-lifecycle">
        {[1, 1.4, 1.8, 1.2, 1].map((weight, index) => (
          <span key={index} className="atlas-ill-lifecycle-step" style={{ flexGrow: weight }} />
        ))}
      </div>
      <span className="atlas-ill-lifecycle-label">Discover → Release → Learn</span>
    </div>
  );
}

/* A lookup that returns a definition and the terms around it. */
function GlossaryIllustration() {
  return (
    <div className="atlas-ill atlas-ill-glossary">
      <div className="atlas-ill-search">
        <span className="atlas-ill-search-icon" />
        <span className="atlas-ill-search-field" />
      </div>
      <div className="atlas-ill-definition">
        <span className="atlas-ill-term">Idempotent</span>
        <span className="atlas-ill-definition-lines"><i /><i /></span>
      </div>
      <div className="atlas-ill-related">
        <svg viewBox="0 0 150 74" preserveAspectRatio="none" focusable="false" aria-hidden>
          <path d="M8 37 H52 M52 37 L104 12 M52 37 L104 62" className="atlas-ill-link" />
        </svg>
        <span className="atlas-ill-term-node atlas-ill-term-node-a" />
        <span className="atlas-ill-term-node atlas-ill-term-node-b" />
        <span className="atlas-ill-term-node atlas-ill-term-node-c" />
      </div>
    </div>
  );
}

/* An idea becomes a branch, passes review, merges, and ships. */
function ContributeIllustration() {
  return (
    <div className="atlas-ill atlas-ill-contribute">
      <div className="atlas-ill-graph">
        <svg viewBox="0 0 260 96" preserveAspectRatio="none" focusable="false" aria-hidden>
          <path d="M6 76 H254" className="atlas-ill-trunk" />
          <path d="M52 76 C74 76 74 24 100 24 H176 C202 24 202 76 224 76" className="atlas-ill-branch-line" />
        </svg>
        <span className="atlas-ill-commit atlas-ill-commit-issue" />
        <span className="atlas-ill-commit atlas-ill-commit-work" />
        <span className="atlas-ill-commit atlas-ill-commit-review" />
        <span className="atlas-ill-commit atlas-ill-commit-merge" />
        <span className="atlas-ill-commit atlas-ill-commit-ship" />
      </div>
      <div className="atlas-ill-stages">
        <em>Idea</em>
        <em className="atlas-ill-detail">Review</em>
        <em>Published</em>
      </div>
    </div>
  );
}

/* A practical checklist along a route, for the guides companion. */
function GuidesIllustration() {
  return (
    <div className="atlas-ill atlas-ill-guides">
      <div className="atlas-ill-checklist">
        {[true, true, false, false].map((done, index) => (
          <span key={index} className={`atlas-ill-check ${done ? "is-done" : ""}`}>
            <i />
            <b style={{ width: `${86 - index * 14}%` }} />
          </span>
        ))}
      </div>
      <div className="atlas-ill-route">
        <svg viewBox="0 0 96 118" preserveAspectRatio="none" focusable="false" aria-hidden>
          <path d="M18 108 C18 74 78 78 78 46 C78 26 56 22 48 14" className="atlas-ill-route-line" />
        </svg>
        <span className="atlas-ill-route-start" />
        <span className="atlas-ill-route-pin" />
      </div>
    </div>
  );
}

/* Two options measured on the same criteria, one chosen. */
function ComparisonsIllustration() {
  return (
    <div className="atlas-ill atlas-ill-comparisons">
      <div className="atlas-ill-option">
        <span className="atlas-ill-option-head">A</span>
        {[74, 44, 88].map((width) => (
          <span key={width} className="atlas-ill-criterion"><i style={{ width: `${width}%` }} /></span>
        ))}
      </div>
      <div className="atlas-ill-versus">
        <span className="atlas-ill-versus-line" />
        <em>vs</em>
        <span className="atlas-ill-versus-line" />
      </div>
      <div className="atlas-ill-option is-chosen">
        <span className="atlas-ill-option-head">B</span>
        {[90, 78, 62].map((width) => (
          <span key={width} className="atlas-ill-criterion"><i style={{ width: `${width}%` }} /></span>
        ))}
        <span className="atlas-ill-chosen">Chosen</span>
      </div>
    </div>
  );
}

const ILLUSTRATIONS: Record<AtlasPillarConcept, () => React.ReactElement> = {
  resources: ResourcesIllustration,
  "learning-paths": LearningPathsIllustration,
  pathfinder: PathfinderIllustration,
  careers: CareersIllustration,
  "ways-of-working": WaysOfWorkingIllustration,
  teams: TeamsIllustration,
  glossary: GlossaryIllustration,
  contribute: ContributeIllustration,
  guides: GuidesIllustration,
  comparisons: ComparisonsIllustration,
};

/**
 * Renders a pillar's illustration on the shared Atlas artwork tile, so card
 * dimensions and the surrounding layout are unchanged.
 */
export function AtlasPillarIllustration({ concept }: { concept: AtlasPillarConcept }) {
  const Illustration = ILLUSTRATIONS[concept];
  return (
    <div className={`atlas-card-art atlas-card-art-pillar atlas-card-art-${concept}`} aria-hidden>
      <Illustration />
    </div>
  );
}
