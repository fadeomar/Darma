import type { WordCounterGoal, WordCounterPreset } from "./types";

export const WORD_COUNTER_GOALS: WordCounterGoal[] = [
  {
    id: "assignment-500",
    label: "500-word assignment",
    description: "A short essay or written response with a practical tolerance range.",
    metric: "words",
    min: 450,
    max: 550,
  },
  {
    id: "blog-post",
    label: "Blog article",
    description: "A focused article target suitable for tutorials and explainers.",
    metric: "words",
    min: 900,
    max: 1400,
  },
  {
    id: "seo-title",
    label: "SEO title",
    description: "A concise page title measured by characters.",
    metric: "characters",
    min: 30,
    max: 60,
  },
  {
    id: "meta-description",
    label: "Meta description",
    description: "A search-result description with a conventional character range.",
    metric: "characters",
    min: 120,
    max: 160,
  },
  {
    id: "social-post",
    label: "Short social post",
    description: "A compact post that stays within 280 characters.",
    metric: "characters",
    max: 280,
  },
  {
    id: "speech-five-minutes",
    label: "Five-minute speech",
    description: "A speaking script based on roughly 130 words per minute.",
    metric: "words",
    min: 575,
    max: 700,
  },
  {
    id: "tweet-thread-post",
    label: "Thread post",
    description: "A single post inside a longer thread, kept comfortably under the limit.",
    metric: "characters",
    min: 120,
    max: 270,
  },
  {
    id: "linkedin-post",
    label: "LinkedIn post",
    description: "A professional update that stays above the fold before the see-more cut.",
    metric: "characters",
    min: 600,
    max: 1300,
  },
  {
    id: "product-description",
    label: "Product description",
    description: "Enough detail for a listing page without turning into a manual.",
    metric: "words",
    min: 120,
    max: 220,
  },
  {
    id: "cover-letter",
    label: "Cover letter",
    description: "One page of focused, specific writing for a job application.",
    metric: "words",
    min: 250,
    max: 400,
  },
  {
    id: "abstract-250",
    label: "Research abstract",
    description: "A conference or journal abstract with a hard upper bound.",
    metric: "words",
    max: 250,
  },
  {
    id: "long-form-guide",
    label: "Long-form guide",
    description: "An in-depth reference article covering a topic end to end.",
    metric: "words",
    min: 2000,
    max: 3500,
  },
  {
    id: "speech-ten-minutes",
    label: "Ten-minute talk",
    description: "A conference talk script based on roughly 130 words per minute.",
    metric: "words",
    min: 1150,
    max: 1400,
  },
  {
    id: "custom",
    label: "Custom target",
    description: "Set your own minimum, maximum, and measurement unit.",
    metric: "words",
    min: 0,
    max: 1000,
  },
];

export const WORD_COUNTER_PRESETS: WordCounterPreset[] = [
  {
    id: "student-essay",
    label: "Student essay",
    description: "A short academic response with varied sentence lengths.",
    goalId: "assignment-500",
    text: `Digital tools have changed how students find information, organize ideas, and submit their work. A search that once required several books can now begin in seconds. This speed is useful, but it also creates a new responsibility: students must judge whether a source is accurate, current, and relevant.

Good research therefore depends on more than access. A student should compare sources, identify the author, check the publication date, and look for evidence that supports each claim. Notes should clearly separate direct quotations from personal summaries. These habits reduce accidental plagiarism and make the final argument easier to defend.

Technology is most valuable when it strengthens careful thinking rather than replacing it. The best digital workflow combines fast discovery with slow verification. Students who learn that balance can work efficiently while still producing reliable and original writing.`,
  },
  {
    id: "seo-description",
    label: "SEO description",
    description: "A meta description near the recommended character range.",
    goalId: "meta-description",
    text: "Analyze words, characters, sentence length, keyword density, and writing goals locally with Darma's private Word Counter Studio.",
  },
  {
    id: "product-update",
    label: "Product update",
    description: "Scannable release copy with a repeated product keyword.",
    goalId: "social-post",
    text: `Darma now makes project exports faster. The new export flow groups reports, source files, and CSV data into one ZIP pack. Darma also remembers your last workspace view, so returning to a long review takes fewer clicks.`,
  },
  {
    id: "speech-script",
    label: "Speech opening",
    description: "A spoken introduction for estimating delivery time.",
    goalId: "speech-five-minutes",
    text: `Good morning, and thank you for being here. Today I want to talk about a simple idea: progress becomes easier when a large goal is turned into a small action that can be repeated. We often wait for perfect conditions, more confidence, or a complete plan. In practice, momentum usually begins before any of those things arrive. It begins when we choose one useful step and complete it consistently.`,
  },
  {
    id: "keyword-heavy",
    label: "Keyword-heavy draft",
    description: "A deliberately repetitive sample that exposes density warnings.",
    goalId: "blog-post",
    text: `Project management software helps teams manage projects. Good project management software makes project planning easier, and project management software can improve project communication. When choosing project management software, compare the project management features, project management reports, and project management integrations carefully.`,
  },
  {
    id: "arabic-sample",
    label: "Arabic sample",
    description: "A multilingual counting example with Arabic punctuation.",
    goalId: "assignment-500",
    text: `تساعد الأدوات الرقمية الكتّاب على مراجعة النص بسرعة، لكنها لا تغني عن القراءة المتأنية. يمكن لعداد الكلمات أن يوضح طول المقال، وعدد الجمل، وزمن القراءة المتوقع. هل النص واضح ومباشر؟ وهل تتكرر بعض الكلمات أكثر من اللازم؟

عندما تظهر هذه المؤشرات أمام الكاتب يصبح التحرير أكثر دقة. الهدف ليس تقليل الكلمات دائمًا، بل استخدام العدد المناسب منها لشرح الفكرة دون حشو أو غموض.`,
  },
  {
    id: "cover-letter-draft",
    label: "Cover letter",
    description: "A focused application letter sized for a single page.",
    goalId: "cover-letter",
    text: `I am writing to apply for the frontend engineer role on your product team. For the past four years I have built accessible interfaces for a small SaaS company, where I owned the component library and the migration to a token-based design system.

Two things drew me to this role. The first is that you treat performance as a product concern rather than a cleanup task. The second is the emphasis on written communication, which matches how I prefer to work: a short design note before a large change saves far more time than it costs.

I would bring practical experience with component architecture, testing, and reviewing other people's work carefully. I am comfortable owning a feature end to end and equally comfortable handing it over. Thank you for considering my application; I would welcome the chance to talk about what the team is building next.`,
  },
  {
    id: "linkedin-update",
    label: "LinkedIn update",
    description: "A professional post that stays readable above the see-more fold.",
    goalId: "linkedin-post",
    text: `We shipped something small this week that I keep thinking about.

Our onboarding had a five-step form. Support kept hearing the same thing: people did not know how long it would take, so they closed the tab. We did not redesign the form. We added a single line at the top saying "about four minutes, and you can come back later".

Completion went up noticeably. No new components, no new flow, one sentence.

The lesson I am taking from it is that a lot of what looks like a design problem is really a missing expectation. Before rebuilding a screen, it is worth asking what the person needs to know before they start.

What is the smallest change that moved a number for your team?`,
  },
  {
    id: "product-listing",
    label: "Product listing",
    description: "Ecommerce copy with concrete detail and no filler.",
    goalId: "product-description",
    text: `The Arc Desk Lamp puts warm, adjustable light exactly where you need it without lighting the whole room. The arm pivots through 180 degrees and holds its position, so you can move it once and forget about it.

Three brightness levels and two colour temperatures cover late-night reading, detailed work, and video calls. The weighted base keeps it stable on a crowded desk, and the USB-C port on the back charges a phone while you work.

Assembled dimensions are 42 by 18 centimetres. The shade is recycled aluminium and the finish is available in sand, slate, and black. Two-year warranty included.`,
  },
  {
    id: "conference-abstract",
    label: "Conference abstract",
    description: "A submission with a hard 250-word ceiling.",
    goalId: "abstract-250",
    text: `Front-end performance work is often framed as a technical optimisation problem, yet in practice the largest regressions we observed originated in organisational decisions rather than code. This talk reports on eighteen months of performance data from a mid-sized product team, covering forty-one releases.

We instrumented every release with field metrics and correlated regressions against the type of change that introduced them. Three patterns emerged. First, third-party scripts added for short marketing campaigns accounted for a disproportionate share of long-tail regressions and were rarely removed on schedule. Second, regressions introduced during design-system migrations persisted longer than those introduced by feature work, because ownership was ambiguous. Third, teams that reviewed a performance budget during planning caught issues earlier than teams that reviewed dashboards afterwards.

We describe the lightweight process changes that followed, including a shared removal date for every temporary script and a named owner for each migration phase. We also discuss what did not work: automated budgets alone produced alert fatigue without changing behaviour.

Attendees will leave with a concrete checklist for locating organisational sources of performance regression in their own teams, and with the measurement approach we used to make the case internally.`,
  },
  {
    id: "long-guide-intro",
    label: "Long-form guide opening",
    description: "The opening of an in-depth reference article.",
    goalId: "long-form-guide",
    text: `Caching is one of those topics where everyone agrees it matters and almost nobody agrees on where to start. This guide takes a different approach from most: instead of listing every cache layer available to you, it works through one realistic application and shows which layer solves which specific complaint.

We will begin with the browser, because it is both the cheapest layer and the one most often configured incorrectly. From there we move outward to the CDN, then to the application layer, and finally to the database. At each step the question is the same: what request is being repeated, who is repeating it, and what is the cost of serving a slightly stale answer.

Along the way we will cover cache keys, invalidation strategies that actually survive a deploy, and the specific failure modes that make people distrust caching in the first place. By the end you should be able to look at a slow endpoint and say confidently which layer is the right place to fix it.`,
  },
  {
    id: "conference-talk-script",
    label: "Ten-minute talk",
    description: "A spoken script for estimating a short conference slot.",
    goalId: "speech-ten-minutes",
    text: `Thank you for having me. I want to spend the next ten minutes on a question that sounds simple: why do good teams ship slow software?

Not bad teams. Good ones. Teams with senior engineers, real code review, and a genuine interest in doing the work well. I have watched several of them ship something noticeably slower than what they replaced, and the interesting part is that nobody made an obviously wrong decision along the way.

Here is the pattern I keep seeing. Performance starts as everyone's concern, which in practice means it is nobody's. There is no single moment where the budget is blown. There is a marketing script here, a heavier component there, a library that seemed small until three features depended on it. Each change is defensible on its own. The total is not.

The second thing I see is that measurement arrives too late. Dashboards tell you what already happened. By the time a regression appears in a chart, it has shipped, it has dependents, and reverting it costs more political capital than anyone has that week.

So what actually works? Three things, in my experience. First, give every temporary addition an expiry date at the moment you add it, and put that date somewhere a human will see it. Second, name an owner for each migration, not each ticket. Third, and this is the one people resist, review the budget during planning rather than after the release. It feels premature. It is the only point where the cost of saying no is still small.

None of that is technically interesting, which I think is exactly why it gets skipped. Thank you.`,
  },
  {
    id: "thread-post",
    label: "Thread post",
    description: "One post from a longer thread, sized to stay under the limit.",
    goalId: "tweet-thread-post",
    text: `The fastest way to make a slow page feel fast is usually not to make it faster. It is to stop it moving. Reserve space for images, fonts, and ads before they load. Same load time, completely different experience.`,
  },
  {
    id: "meeting-summary",
    label: "Meeting summary",
    description: "Concise notes with decisions and owners for a shared channel.",
    goalId: "social-post",
    text: `Decisions from today: we ship the search rewrite behind a flag on Thursday, Priya owns the rollout plan, and we hold the pricing page redesign until after the launch. Open question: whether the old endpoint stays available for one release or two. Answer needed by Wednesday.`,
  },
  {
    id: "press-release",
    label: "Press release",
    description: "A short announcement written in a formal register.",
    goalId: "blog-post",
    text: `Example Studio today announced the general availability of its collaborative annotation workspace, following a six-month preview with more than two hundred teams.

The workspace allows distributed teams to mark up screenshots, designs, and documents in a shared browser session without installing software. During the preview period, participating teams reported a reduction in the number of clarification messages exchanged during design review, and several reported replacing a recurring meeting entirely.

"Most review tools assume everyone is looking at the same thing at the same time," said the company's head of product. "In practice, review happens across time zones and half-finished thoughts. We built for that instead."

The workspace is available immediately on all paid plans at no additional cost. A free tier supporting up to three active documents is available to individual users. The company also announced that an export API will enter preview in the following quarter.`,
  },
  {
    id: "readme-intro",
    label: "README introduction",
    description: "Technical prose with code-adjacent terms and short sentences.",
    goalId: "blog-post",
    text: `This package turns a plain object into a validated configuration at startup, and fails loudly if anything is missing.

Most configuration libraries validate lazily, which means a typo in a rarely used key surfaces in production three weeks later. This one reads the whole schema on first import, checks every field, and throws a single error listing everything that is wrong rather than stopping at the first problem.

It has no runtime dependencies and works in Node and in the browser. Types are inferred from the schema, so the object you get back is fully typed without a separate declaration. There is no plugin system and no support for remote configuration sources; both are deliberate omissions to keep the surface small.

Install it, define a schema, and call parse once at the top of your entry point.`,
  },
  {
    id: "microcopy-set",
    label: "UI microcopy",
    description: "Very short interface strings, useful for character-level checks.",
    goalId: "seo-title",
    text: `Save changes and continue`,
  },
  {
    id: "mixed-punctuation",
    label: "Punctuation stress test",
    description: "Hyphens, ellipses, quotes, and numerals that can distort naive counting.",
    goalId: "assignment-500",
    text: `The state-of-the-art model, trained on 1,280,000 samples, reached 94.7% accuracy… or so the press release claimed.

"We didn't cherry-pick," the lead author said. "It's reproducible; the notebook's in the repo."

Reviewers disagreed. Re-running the pipeline end-to-end gave 91.2%, a three-and-a-half-point gap. The difference came down to well-known preprocessing choices: whether hyphenated tokens count as one word or two, and how e.g., i.e., and Dr. are handled at sentence boundaries.

None of this is fraud. It is a reminder that "how many" is a question about method, not just arithmetic.`,
  },
];

export function getWordCounterGoal(id: string): WordCounterGoal {
  return WORD_COUNTER_GOALS.find((goal) => goal.id === id) ?? WORD_COUNTER_GOALS[0]!;
}
