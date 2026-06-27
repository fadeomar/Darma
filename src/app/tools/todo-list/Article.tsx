const sectionTitle =
  "mb-3 text-xl font-bold text-[var(--color-text-primary)] dark:text-[var(--color-code-text)]";

const faqs: { q: string; a: string }[] = [
  {
    q: "Can I use this to-do list without signing up?",
    a: "Yes. Darma Tasks needs no account, email, or sign-up. Open the page and start adding tasks immediately — everything runs in your browser.",
  },
  {
    q: "Are my tasks saved?",
    a: "Yes. Every task, list, board column, and template you create is stored locally in your browser with IndexedDB, so your work survives refreshes and restarts. Nothing is uploaded to a server. Clearing your browser's site data removes your tasks, so use Export for a backup.",
  },
  {
    q: "Can I export my tasks?",
    a: "Yes. From the Data menu you can export all your data or just the current list as JSON, copy a list as Markdown or plain text, and download it as a .txt or .md file. Exported JSON can be imported again later.",
  },
  {
    q: "Can I print my to-do list?",
    a: "Yes. The Print view offers five layouts — simple list, daily planner, weekly planner, checklist, and compact — and lets you choose whether to include completed tasks, notes, subtasks, tags, priorities, and due dates. The app chrome is hidden when you print, so the page is clean on A4.",
  },
  {
    q: "Can I use templates?",
    a: "Yes. The Template gallery has 20+ ready-made lists across Personal, Student, Work, Design, Developer, Teacher, NGO/Proposal, Content Creator, Travel, and Home. Preview a template, then create a new list from it in one click — the original template is never changed.",
  },
  {
    q: "What is the difference between List view and Board view?",
    a: "List view is a fast, scannable checklist with drag-to-reorder — best for a single list or daily plan. Board view is a Kanban board with To Do, Doing, Done, and Blocked columns; dragging a card between columns changes the task's status, which suits projects and workflows.",
  },
  {
    q: "Is it good for students?",
    a: "Yes. Use the Week view to plan study blocks, the Table view to track assignments by due date and status, and templates like the weekly study planner, exam preparation, and assignment checklist to get started fast.",
  },
  {
    q: "Is it good for work projects?",
    a: "Yes. Board view runs a project as a Kanban flow, Table view gives a structured overview with inline status and priority, and templates such as client onboarding, meeting agenda, and the developer release checklist cover common processes.",
  },
];

export default function TodoListArticle() {
  return (
    <div className="space-y-7 text-sm leading-7 text-[var(--color-text-secondary)] dark:text-[var(--color-text-secondary)]">
      <section>
        <h2 className={sectionTitle}>What is an online to-do list?</h2>
        <p>
          An online to-do list is a place to capture everything you need to do and organize it so
          nothing slips through the cracks. Darma Tasks is a fast, private to-do workspace: you can
          jot tasks down in seconds, set due dates and priorities, group work into lists, break big
          items into subtasks, and view the same tasks as a checklist, a table, a Kanban board, a
          weekly planner, or a printable sheet. It runs entirely in your browser — no account, no
          sign-up, and nothing uploaded.
        </p>
      </section>

      <section>
        <h2 className={sectionTitle}>Why use Darma Tasks?</h2>
        <ul className="list-inside list-disc space-y-2">
          <li><strong>Private by default</strong> — your tasks never leave your browser.</li>
          <li><strong>Six views, one set of tasks</strong> — switch between List, Table, Board, Week, Checklist, and Print without copying anything.</li>
          <li><strong>Fast capture</strong> — add a task with one keystroke and organize it later.</li>
          <li><strong>Real templates</strong> — 20+ ready-made workflows for students, teams, designers, developers, creators, and home life.</li>
          <li><strong>Yours to keep</strong> — export and import JSON, copy as Markdown or text, and print clean A4 sheets.</li>
          <li><strong>No lock-in</strong> — works offline, with a storage layer designed so cloud sync can be added later.</li>
        </ul>
      </section>

      <section>
        <h2 className={sectionTitle}>How to use each view</h2>
        <ul className="list-inside list-disc space-y-2">
          <li><strong>List view</strong> — a quick checklist with drag-to-reorder; ideal for daily planning and simple lists.</li>
          <li><strong>Table view</strong> — a structured grid you can sort by title, status, priority, due date, or update time, with inline status, priority, and due-date editing. Great for students, teachers, and admins.</li>
          <li><strong>Board view</strong> — a Kanban board (To Do, Doing, Done, Blocked); drag cards between columns to change status, or use the card menu on mobile.</li>
          <li><strong>Week view</strong> — a seven-day planner. Drag tasks onto a day (or use the per-card menu), add tasks straight to a day, navigate weeks, and see today highlighted.</li>
          <li><strong>Checklist view</strong> — a process view with a progress bar, big checkboxes, and sections; reset, complete-all, duplicate, print, and copy actions make repeatable checklists easy.</li>
          <li><strong>Print view</strong> — choose a layout and exactly what to include, then print a clean A4 sheet or download as text/Markdown.</li>
        </ul>
      </section>

      <section>
        <h2 className={sectionTitle}>Use cases</h2>
        <ul className="list-inside list-disc space-y-2">
          <li><strong>Students</strong> — weekly study planner, exam prep, and assignment tracking by due date.</li>
          <li><strong>Teachers</strong> — lesson preparation checklists and class admin.</li>
          <li><strong>Designers</strong> — design project boards, UI review checklists, and Figma handoff.</li>
          <li><strong>Developers</strong> — bug-fixing boards and release checklists.</li>
          <li><strong>Teams</strong> — client onboarding, meeting agendas, and shared process checklists.</li>
          <li><strong>Personal life</strong> — daily routines, grocery lists, travel packing, and home cleaning.</li>
          <li><strong>NGOs &amp; proposals</strong> — proposal submission and donor requirement checklists.</li>
        </ul>
      </section>

      <section>
        <h2 className={sectionTitle}>Templates</h2>
        <p>
          Jump-start a list with a ready-made template. The gallery spans Personal, Student, Work,
          Design, Developer, Teacher, NGO/Proposal, Content Creator, Travel, and Home — including a
          daily routine, weekly study planner, exam preparation, assignment and UI review checklists,
          a Figma handoff checklist, developer bug-fixing and release checklists, client onboarding,
          meeting agenda, YouTube publishing and content calendar checklists, proposal and donor
          checklists, and grocery, travel-packing, and home-cleaning lists. Preview the tasks first,
          then create a new list in one click — the original template is never modified.
        </p>
      </section>

      <section>
        <h2 className={sectionTitle}>FAQ</h2>
        <dl className="space-y-4">
          {faqs.map((faq) => (
            <div key={faq.q}>
              <dt className="font-semibold text-[var(--color-text-primary)]">{faq.q}</dt>
              <dd className="mt-1">{faq.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}
