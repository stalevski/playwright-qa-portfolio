import { renderAppBar, renderHead } from '../http/render-helpers';

/** Minimal HTML-escape for values interpolated into the lab templates. */
const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (char) => {
    switch (char) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return char;
    }
  });

export type LabNav =
  | 'home'
  | 'forms'
  | 'dynamic'
  | 'dialogs'
  | 'tables'
  | 'widgets'
  | 'menus'
  | 'overlays'
  | 'frames'
  | 'shadow-dom';

type LabPage = { slug: LabNav; href: string; label: string };

export const LAB_PAGES: LabPage[] = [
  { slug: 'home', href: '/lab', label: 'Overview' },
  { slug: 'forms', href: '/lab/forms', label: 'Forms' },
  { slug: 'dynamic', href: '/lab/dynamic', label: 'Dynamic content' },
  { slug: 'dialogs', href: '/lab/dialogs', label: 'Dialogs' },
  { slug: 'tables', href: '/lab/tables', label: 'Tables' },
  { slug: 'widgets', href: '/lab/widgets', label: 'Widgets' },
  { slug: 'menus', href: '/lab/menus', label: 'Menus & dropdowns' },
  { slug: 'overlays', href: '/lab/overlays', label: 'Popups & layers' },
  { slug: 'frames', href: '/lab/frames', label: 'Frames' },
  { slug: 'shadow-dom', href: '/lab/shadow-dom', label: 'Shadow DOM' },
];

export const renderLabLayout = (options: { title: string; body: string; activeNav: LabNav }): string => `<!DOCTYPE html>
<html lang="en">
${renderHead(options.title)}
<body>
  <div class="shell">
    <header class="site-header">
      ${renderAppBar({
        current: 'lab',
        title: 'QA Test Lab',
        subtitle: 'A deterministic UI playground for automation practice',
      })}
      <nav class="section-nav" aria-label="Test lab sections" data-test="lab-nav">
        ${LAB_PAGES.map(
          (page) =>
            `<a href="${page.href}" data-test="lab-nav-${page.slug}" class="${
              page.slug === options.activeNav ? 'active' : ''
            }"${page.slug === options.activeNav ? ' aria-current="page"' : ''}>${page.label}</a>`,
        ).join('\n        ')}
      </nav>
    </header>
    <main>
      ${options.body}
    </main>
  </div>
  <script src="/static/lab.js" defer></script>
</body>
</html>`;

export const renderLabHome = (): string => {
  const cards = LAB_PAGES.filter((page) => page.slug !== 'home')
    .map(
      (page) => `
        <a class="product-card" href="${page.href}" data-test="lab-card-${page.slug}">
          <strong>${page.label}</strong>
          <span class="meta">${LAB_CARD_BLURB[page.slug as Exclude<LabNav, 'home'>]}</span>
          <span class="pill">Open</span>
        </a>`,
    )
    .join('\n');

  return renderLabLayout({
    title: 'QA Test Lab',
    activeNav: 'home',
    body: `
      <section class="hero">
        <h1 data-test="lab-title">QA Test Lab</h1>
        <p>A self-contained set of UI automation challenges — forms, dynamic loading, dialogs, sortable tables, interactive widgets, menus and dropdowns, popups and layered overlays, iframes and shadow DOM. Everything here is deterministic and owned by this repo, so it is safe to assert against precisely.</p>
      </section>
      <section aria-label="Challenges">
        <div class="grid three-column" data-test="lab-cards">
          ${cards}
        </div>
      </section>`,
  });
};

const LAB_CARD_BLURB: Record<Exclude<LabNav, 'home'>, string> = {
  forms: 'Every input type plus client-side validation and a success state.',
  dynamic: 'Loading spinners, add/remove elements, enable/disable controls.',
  dialogs: 'Native alert, confirm and prompt dialogs with reflected results.',
  tables: 'A searchable, column-sortable data table.',
  widgets: 'Tabs, accordion, modal, tooltip, progress bar, toast and clipboard.',
  menus: 'Native, custom, cascading and multi-select dropdowns plus action, context, flyout and hamburger menus.',
  overlays: 'Popovers, a notification stack, a cookie banner, a drawer, stacked modals and reorderable z-index layers.',
  frames: 'A nested iframe that talks back to the host page.',
  'shadow-dom': 'A custom element with an encapsulated shadow root.',
};

export const renderLabForms = (): string =>
  renderLabLayout({
    title: 'QA Test Lab — Forms',
    activeNav: 'forms',
    body: `
      <section class="hero">
        <h1>Forms & validation</h1>
        <p>A single accessible form exercising every common input type. Submission is validated on the client; a success banner appears only when all required fields are valid.</p>
      </section>
      <section>
        <form data-test="lab-form" novalidate>
          <div class="field">
            <label for="form-name">Full name</label>
            <input id="form-name" name="name" type="text" data-test="form-name" required autocomplete="name" />
          </div>
          <div class="field">
            <label for="form-email">Email</label>
            <input id="form-email" name="email" type="email" data-test="form-email" required autocomplete="email" />
          </div>
          <div class="field">
            <label for="form-password">Password (min 6 characters)</label>
            <input id="form-password" name="password" type="password" data-test="form-password" required minlength="6" autocomplete="new-password" />
          </div>
          <div class="field">
            <label for="form-age">Age</label>
            <input id="form-age" name="age" type="number" data-test="form-age" min="0" max="120" />
          </div>
          <div class="field">
            <label for="form-role">Role</label>
            <select id="form-role" name="role" data-test="form-role">
              <option value="engineer">Engineer</option>
              <option value="analyst">Analyst</option>
              <option value="manager">Manager</option>
            </select>
          </div>
          <fieldset class="field">
            <legend>Preferred contact</legend>
            <div class="row">
              <label class="row" style="gap:6px"><input type="radio" name="contact" value="email" data-test="form-contact-email" checked /> Email</label>
              <label class="row" style="gap:6px"><input type="radio" name="contact" value="phone" data-test="form-contact-phone" /> Phone</label>
            </div>
          </fieldset>
          <div class="field">
            <label for="form-date">Start date</label>
            <input id="form-date" name="startDate" type="date" data-test="form-date" />
          </div>
          <div class="field">
            <label for="form-range">Experience: <span data-test="form-range-value">3</span> years</label>
            <input id="form-range" name="experience" type="range" min="0" max="10" value="3" data-test="form-range" />
          </div>
          <div class="field">
            <label for="form-comments">Comments</label>
            <textarea id="form-comments" name="comments" rows="3" data-test="form-comments"></textarea>
          </div>
          <div class="field">
            <label for="form-file">Attachment</label>
            <input id="form-file" name="attachment" type="file" data-test="form-file" />
          </div>
          <label class="row" style="gap:8px"><input type="checkbox" name="terms" data-test="form-terms" required /> I accept the terms</label>
          <div class="row">
            <button type="submit" data-test="form-submit">Submit</button>
            <button type="reset" class="button secondary" data-test="form-reset">Reset</button>
          </div>
        </form>
        <div class="lab-result" role="status" aria-live="polite" data-test="form-result" hidden></div>
      </section>`,
  });

export const renderLabDynamic = (): string =>
  renderLabLayout({
    title: 'QA Test Lab — Dynamic content',
    activeNav: 'dynamic',
    body: `
      <section class="hero">
        <h1>Dynamic content</h1>
        <p>Asynchronous loading, adding and removing elements, and toggling control state — the everyday "wait for it" scenarios.</p>
      </section>
      <section class="stack">
        <div class="panel stack">
          <h2>Deferred loading</h2>
          <p class="muted">Click load; a spinner appears, then content arrives after a short, fixed delay.</p>
          <div class="row">
            <button type="button" data-test="dynamic-start">Load content</button>
          </div>
          <div class="lab-spinner" data-test="dynamic-loading" role="status" hidden><span class="sr-only">Loading…</span></div>
          <div class="lab-result" data-test="dynamic-content" hidden>Content loaded</div>
        </div>
        <div class="panel stack">
          <h2>Add &amp; remove elements</h2>
          <p class="muted">Each added row is a button that removes itself when clicked.</p>
          <div class="row">
            <button type="button" data-test="add-element">Add element</button>
          </div>
          <div class="list" data-test="elements-container"></div>
        </div>
        <div class="panel stack">
          <h2>Enable &amp; disable</h2>
          <div class="row">
            <label for="dynamic-input" class="sr-only">Toggleable input</label>
            <input id="dynamic-input" type="text" data-test="dynamic-input" placeholder="Disabled until enabled" disabled />
            <button type="button" class="button secondary" data-test="toggle-enable">Enable input</button>
          </div>
          <p class="muted" data-test="enable-state">disabled</p>
        </div>
      </section>`,
  });

export const renderLabDialogs = (): string =>
  renderLabLayout({
    title: 'QA Test Lab — Dialogs',
    activeNav: 'dialogs',
    body: `
      <section class="hero">
        <h1>JavaScript dialogs</h1>
        <p>Native <code>alert</code>, <code>confirm</code> and <code>prompt</code> dialogs. The outcome of each is reflected into the result region for assertions.</p>
      </section>
      <section class="stack">
        <div class="row">
          <button type="button" data-test="dialog-alert">Show alert</button>
          <button type="button" data-test="dialog-confirm">Show confirm</button>
          <button type="button" data-test="dialog-prompt">Show prompt</button>
        </div>
        <div class="lab-result" role="status" aria-live="polite" data-test="dialog-result">No dialog yet</div>
      </section>`,
  });

type LabRow = { name: string; role: string; amount: number };

const LAB_TABLE_ROWS: LabRow[] = [
  { name: 'Ada Lovelace', role: 'Engineer', amount: 320 },
  { name: 'Grace Hopper', role: 'Manager', amount: 540 },
  { name: 'Alan Turing', role: 'Engineer', amount: 410 },
  { name: 'Katherine Johnson', role: 'Analyst', amount: 280 },
  { name: 'Margaret Hamilton', role: 'Engineer', amount: 615 },
  { name: 'Edsger Dijkstra', role: 'Analyst', amount: 190 },
];

export const renderLabTables = (): string => {
  const rows = LAB_TABLE_ROWS.map(
    (row) => `
        <tr data-test="table-row">
          <td data-test="cell-name">${escapeHtml(row.name)}</td>
          <td data-test="cell-role">${escapeHtml(row.role)}</td>
          <td data-test="cell-amount">${row.amount}</td>
        </tr>`,
  ).join('\n');

  return renderLabLayout({
    title: 'QA Test Lab — Tables',
    activeNav: 'tables',
    body: `
      <section class="hero">
        <h1>Searchable, sortable table</h1>
        <p>Filter rows with the search box and sort any column by clicking its header. Sorting toggles ascending and descending.</p>
      </section>
      <section class="stack">
        <div class="field" style="max-width:320px">
          <label for="table-search">Search</label>
          <input id="table-search" type="search" data-test="table-search" placeholder="Filter by any column" />
        </div>
        <table data-test="data-table">
          <thead>
            <tr>
              <th scope="col"><button type="button" class="lab-sort" data-test="sort-name" data-key="name" aria-label="Sort by name">Name <span aria-hidden="true" class="lab-sort-icon"></span></button></th>
              <th scope="col"><button type="button" class="lab-sort" data-test="sort-role" data-key="role" aria-label="Sort by role">Role <span aria-hidden="true" class="lab-sort-icon"></span></button></th>
              <th scope="col"><button type="button" class="lab-sort" data-test="sort-amount" data-key="amount" aria-label="Sort by amount">Amount <span aria-hidden="true" class="lab-sort-icon"></span></button></th>
            </tr>
          </thead>
          <tbody data-test="table-body">${rows}
          </tbody>
        </table>
        <p class="muted" data-test="table-empty" hidden>No rows match your search.</p>
      </section>`,
  });
};

export const renderLabWidgets = (): string =>
  renderLabLayout({
    title: 'QA Test Lab — Widgets',
    activeNav: 'widgets',
    body: `
      <section class="hero">
        <h1>Interactive widgets</h1>
        <p>Tabs, an accordion, a modal dialog, a hover tooltip, an animated progress bar, a toast, clipboard copy and key-press capture.</p>
      </section>
      <section class="stack">
        <div class="panel stack">
          <h2>Tabs</h2>
          <div class="lab-tabs" role="tablist" aria-label="Example tabs">
            <button type="button" role="tab" id="tab-1" data-test="tab-1" aria-controls="panel-1" aria-selected="true">First</button>
            <button type="button" role="tab" id="tab-2" data-test="tab-2" aria-controls="panel-2" aria-selected="false">Second</button>
            <button type="button" role="tab" id="tab-3" data-test="tab-3" aria-controls="panel-3" aria-selected="false">Third</button>
          </div>
          <div role="tabpanel" id="panel-1" data-test="panel-1" aria-labelledby="tab-1">First panel content</div>
          <div role="tabpanel" id="panel-2" data-test="panel-2" aria-labelledby="tab-2" hidden>Second panel content</div>
          <div role="tabpanel" id="panel-3" data-test="panel-3" aria-labelledby="tab-3" hidden>Third panel content</div>
        </div>

        <div class="panel stack">
          <h2>Accordion</h2>
          <h3 class="lab-accordion-h"><button type="button" class="lab-accordion" data-test="accordion-1" aria-expanded="false" aria-controls="accordion-panel-1">Section one</button></h3>
          <div id="accordion-panel-1" data-test="accordion-panel-1" hidden>Panel one body</div>
          <h3 class="lab-accordion-h"><button type="button" class="lab-accordion" data-test="accordion-2" aria-expanded="false" aria-controls="accordion-panel-2">Section two</button></h3>
          <div id="accordion-panel-2" data-test="accordion-panel-2" hidden>Panel two body</div>
        </div>

        <div class="panel stack">
          <h2>Modal dialog</h2>
          <div class="row">
            <button type="button" data-test="open-modal">Open modal</button>
          </div>
          <div class="lab-modal-backdrop" data-test="modal-backdrop" hidden></div>
          <div class="lab-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" data-test="modal" hidden>
            <h2 id="modal-title">Modal title</h2>
            <p>This is a modal dialog. Close it to continue.</p>
            <div class="row">
              <button type="button" data-test="close-modal">Close</button>
            </div>
          </div>
        </div>

        <div class="panel stack">
          <h2>Tooltip</h2>
          <span class="lab-tooltip-host" data-test="hover-target" tabindex="0" aria-describedby="tooltip">Hover or focus me</span>
          <span class="lab-tooltip" id="tooltip" role="tooltip" data-test="tooltip" hidden>Tooltip text</span>
        </div>

        <div class="panel stack">
          <h2>Progress bar</h2>
          <div class="row">
            <button type="button" data-test="progress-start">Start progress</button>
          </div>
          <div class="lab-progress" role="progressbar" aria-label="Demo progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" data-test="progress-bar">
            <div class="lab-progress-fill" data-test="progress-fill"></div>
          </div>
          <p class="muted"><span data-test="progress-value">0</span>%</p>
        </div>

        <div class="panel stack">
          <h2>Toast</h2>
          <div class="row">
            <button type="button" data-test="show-toast">Show toast</button>
          </div>
        </div>

        <div class="panel stack">
          <h2>Copy to clipboard</h2>
          <div class="row">
            <label for="copy-source" class="sr-only">Text to copy</label>
            <input id="copy-source" type="text" value="QA Lab clipboard" data-test="copy-source" readonly />
            <button type="button" class="button secondary" data-test="copy-button">Copy</button>
          </div>
          <p class="muted" role="status" aria-live="polite" data-test="copy-status"></p>
        </div>

        <div class="panel stack">
          <h2>Key press</h2>
          <label for="key-input">Type a key</label>
          <input id="key-input" type="text" data-test="key-input" placeholder="Press any key" />
          <p class="muted">Last key: <span data-test="key-display">none</span></p>
        </div>
      </section>`,
  });

export const renderLabOverlays = (): string =>
  renderLabLayout({
    title: 'QA Test Lab — Popups & layers',
    activeNav: 'overlays',
    body: `
      <section class="hero">
        <h1>Popups &amp; layers</h1>
        <p>Transient surfaces that appear over the page and stack on top of each other: an anchored popover, a notification stack, a cookie banner, a slide-in drawer, nested modals and a reorderable z-index stack. Everything is deterministic, so you can assert visibility, stacking order and which layer is on top.</p>
      </section>
      <section class="stack">
        <div class="panel stack">
          <h2>Anchored popover</h2>
          <p class="muted">A popover pinned to its trigger that closes on outside click or Escape.</p>
          <div class="lab-popover-anchor">
            <button type="button" data-test="popover-trigger" aria-haspopup="dialog" aria-expanded="false" aria-controls="lab-popover">Toggle popover</button>
            <div class="lab-popover" id="lab-popover" role="dialog" aria-label="Example popover" data-test="popover" hidden>
              <p>I am anchored to the button above.</p>
              <button type="button" class="button secondary" data-test="popover-close">Dismiss</button>
            </div>
          </div>
        </div>

        <div class="panel stack">
          <h2>Notification stack</h2>
          <p class="muted">Each click pushes a toast onto the stack; toasts auto-dismiss after a short, fixed delay, newest first.</p>
          <div class="row">
            <button type="button" data-test="notify-button">Notify</button>
            <button type="button" class="button secondary" data-test="notify-clear">Dismiss all</button>
          </div>
          <p class="muted">Active notifications: <span data-test="notify-count">0</span></p>
          <div class="lab-toast-stack" data-test="toast-stack" role="status" aria-live="polite"></div>
        </div>

        <div class="panel stack">
          <h2>Cookie consent</h2>
          <p class="muted">A banner that pops up over the page; the choice is reflected and the banner dismissed.</p>
          <div class="row">
            <button type="button" data-test="cookie-show">Show cookie banner</button>
          </div>
          <p class="muted">Consent: <span data-test="cookie-choice">none</span></p>
          <div class="lab-cookie-banner" role="region" aria-label="Cookie consent" data-test="cookie-banner" hidden>
            <p>We use cookies for deterministic testing.</p>
            <div class="row">
              <button type="button" data-test="cookie-accept">Accept</button>
              <button type="button" class="button secondary" data-test="cookie-decline">Decline</button>
            </div>
          </div>
        </div>

        <div class="panel stack">
          <h2>Slide-in drawer</h2>
          <p class="muted">An off-canvas panel with a backdrop that slides in from the edge.</p>
          <button type="button" data-test="drawer-open">Open drawer</button>
          <div class="lab-drawer-backdrop" data-test="drawer-backdrop" hidden></div>
          <aside class="lab-drawer" role="dialog" aria-modal="true" aria-label="Slide-in drawer" data-test="drawer" hidden>
            <h2>Drawer panel</h2>
            <p>Slide-in content lives here.</p>
            <button type="button" class="button secondary" data-test="drawer-close">Close drawer</button>
          </aside>
        </div>

        <div class="panel stack">
          <h2>Stacked modals</h2>
          <p class="muted">A modal that opens a second modal on top; closing the top one returns to the first.</p>
          <button type="button" data-test="layer-open-1">Open first modal</button>
          <p class="muted">Open modals: <span data-test="layer-depth">0</span></p>
          <div class="lab-layer-backdrop" data-test="layer-backdrop-1" hidden></div>
          <div class="lab-layer-modal" role="dialog" aria-modal="true" aria-label="First modal" data-test="layer-modal-1" hidden>
            <h2>First modal</h2>
            <p>This is the first layer.</p>
            <div class="row">
              <button type="button" data-test="layer-open-2">Open second modal</button>
              <button type="button" class="button secondary" data-test="layer-close-1">Close</button>
            </div>
          </div>
          <div class="lab-layer-backdrop lab-layer-backdrop-2" data-test="layer-backdrop-2" hidden></div>
          <div class="lab-layer-modal lab-layer-modal-2" role="dialog" aria-modal="true" aria-label="Second modal" data-test="layer-modal-2" hidden>
            <h2>Second modal</h2>
            <p>This layer sits on top of the first.</p>
            <button type="button" class="button secondary" data-test="layer-close-2">Close</button>
          </div>
        </div>

        <div class="panel stack">
          <h2>Z-index layers</h2>
          <p class="muted">Three overlapping cards. Bring one to the front to change the stacking order and which card is hit at the centre.</p>
          <div class="lab-zstack" data-test="zstack">
            <div class="lab-zcard lab-zcard-a" data-test="zcard-a"><strong>Card A</strong></div>
            <div class="lab-zcard lab-zcard-b" data-test="zcard-b"><strong>Card B</strong></div>
            <div class="lab-zcard lab-zcard-c is-front" data-test="zcard-c"><strong>Card C</strong></div>
          </div>
          <div class="row">
            <button type="button" class="button secondary" data-test="zfront-a">Bring A to front</button>
            <button type="button" class="button secondary" data-test="zfront-b">Bring B to front</button>
            <button type="button" class="button secondary" data-test="zfront-c">Bring C to front</button>
          </div>
          <p class="muted">Front layer: <span data-test="zstack-front">C</span></p>
        </div>
      </section>`,
  });

export const renderLabFrames = (): string =>
  renderLabLayout({
    title: 'QA Test Lab — Frames',
    activeNav: 'frames',
    body: `
      <section class="hero">
        <h1>Frames</h1>
        <p>An inline frame embedding a separate page. Interacting inside the frame updates content that is scoped to the frame's own document.</p>
      </section>
      <section>
        <iframe class="lab-frame" data-test="lab-iframe" title="Lab inner frame" src="/lab/frames/inner"></iframe>
      </section>`,
  });

export const renderLabFrameInner = (): string => `<!DOCTYPE html>
<html lang="en">
${renderHead('Lab inner frame')}
<body>
  <main style="padding:24px">
    <h1 data-test="inner-heading">Inner frame</h1>
    <p>This page lives inside the iframe.</p>
    <button type="button" data-test="inner-button">Update message</button>
    <p data-test="inner-message">Initial frame message</p>
  </main>
  <script src="/static/lab.js" defer></script>
</body>
</html>`;

export const renderLabShadowDom = (): string =>
  renderLabLayout({
    title: 'QA Test Lab — Shadow DOM',
    activeNav: 'shadow-dom',
    body: `
      <section class="hero">
        <h1>Shadow DOM</h1>
        <p>A custom element whose content lives inside an open shadow root — a common automation edge case.</p>
      </section>
      <section>
        <qa-shadow-card data-test="shadow-host"></qa-shadow-card>
      </section>`,
  });

export const renderLabMenus = (): string =>
  renderLabLayout({
    title: 'QA Test Lab — Menus & dropdowns',
    activeNav: 'menus',
    body: `
      <section class="hero">
        <h1>Menus &amp; dropdowns</h1>
        <p>Native and custom selection controls plus the menu patterns automation engineers meet most: native single and multiple selects, dependent dropdowns, an ARIA listbox, an action menu, a right-click context menu, a flyout navigation menu, a hamburger menu and a split button.</p>
      </section>
      <section class="grid two-column">
        <div class="panel stack">
          <h2>Native select</h2>
          <div class="field" style="max-width:280px">
            <label for="native-select">Favourite pet</label>
            <select id="native-select" data-test="native-select">
              <option value="">Choose one…</option>
              <option value="dog">Dog</option>
              <option value="cat">Cat</option>
              <option value="bird">Bird</option>
              <option value="rabbit">Rabbit</option>
            </select>
          </div>
          <p class="muted" role="status" aria-live="polite">Selected: <span data-test="native-select-result">none</span></p>
        </div>

        <div class="panel stack">
          <h2>Multiple select</h2>
          <div class="field" style="max-width:280px">
            <label for="multi-select">Services (choose several)</label>
            <p class="muted" data-test="multi-select-hint" style="margin:0;font-size:13px">Hold Ctrl (⌘ on macOS) or Shift and click to select more than one.</p>
            <select id="multi-select" data-test="multi-select" multiple size="4">
              <option value="grooming">Grooming</option>
              <option value="boarding">Boarding</option>
              <option value="training">Training</option>
              <option value="walking">Walking</option>
            </select>
          </div>
          <p class="muted" role="status" aria-live="polite">Chosen: <span data-test="multi-select-result">none</span></p>
        </div>

        <div class="panel stack">
          <h2>Dependent dropdowns</h2>
          <p class="muted">Choosing a country repopulates the city list.</p>
          <div class="row">
            <div class="field" style="max-width:200px">
              <label for="country-select">Country</label>
              <select id="country-select" data-test="country-select">
                <option value="uk">United Kingdom</option>
                <option value="us">United States</option>
                <option value="de">Germany</option>
              </select>
            </div>
            <div class="field" style="max-width:200px">
              <label for="city-select">City</label>
              <select id="city-select" data-test="city-select">
                <option value="London">London</option>
                <option value="Manchester">Manchester</option>
                <option value="Bristol">Bristol</option>
              </select>
            </div>
          </div>
          <p class="muted" role="status" aria-live="polite">Location: <span data-test="cascade-result">none</span></p>
        </div>

        <div class="panel stack">
          <h2>Custom dropdown (listbox)</h2>
          <p class="muted">A button-triggered ARIA listbox — not a native <code>&lt;select&gt;</code>.</p>
          <div class="lab-menu-anchor">
            <button type="button" class="lab-menu-trigger" data-test="custom-dropdown" aria-haspopup="listbox" aria-expanded="false" aria-controls="custom-listbox">
              <span data-test="custom-dropdown-label">Select priority</span>
              <span aria-hidden="true" class="lab-caret"></span>
            </button>
            <ul class="lab-menu-popup" id="custom-listbox" role="listbox" aria-label="Priority" data-test="custom-listbox" hidden>
              <li role="option" data-test="custom-option-low" data-value="Low">Low</li>
              <li role="option" data-test="custom-option-medium" data-value="Medium">Medium</li>
              <li role="option" data-test="custom-option-high" data-value="High">High</li>
              <li role="option" data-test="custom-option-critical" data-value="Critical">Critical</li>
            </ul>
          </div>
          <p class="muted" role="status" aria-live="polite">Priority: <span data-test="custom-dropdown-result">none</span></p>
        </div>

        <div class="panel stack">
          <h2>Action menu</h2>
          <p class="muted">A button that opens a menu of actions.</p>
          <div class="lab-menu-anchor">
            <button type="button" class="lab-menu-trigger" data-test="action-menu-button" aria-haspopup="menu" aria-expanded="false" aria-controls="action-menu">
              Actions <span aria-hidden="true" class="lab-caret"></span>
            </button>
            <ul class="lab-menu-popup" id="action-menu" role="menu" aria-label="Row actions" data-test="action-menu" hidden>
              <li role="menuitem" tabindex="-1" data-test="action-menu-item-edit" data-action="Edit">Edit</li>
              <li role="menuitem" tabindex="-1" data-test="action-menu-item-duplicate" data-action="Duplicate">Duplicate</li>
              <li role="menuitem" tabindex="-1" data-test="action-menu-item-archive" data-action="Archive">Archive</li>
              <li role="menuitem" tabindex="-1" data-test="action-menu-item-delete" data-action="Delete">Delete</li>
            </ul>
          </div>
          <p class="muted" role="status" aria-live="polite">Last action: <span data-test="action-menu-result">none</span></p>
        </div>

        <div class="panel stack">
          <h2>Context menu</h2>
          <p class="muted">Right-click the area below to open a custom context menu.</p>
          <div class="lab-context-target" data-test="context-target" tabindex="0">Right-click here</div>
          <ul class="lab-menu-popup" role="menu" aria-label="Context actions" data-test="context-menu" hidden>
            <li role="menuitem" tabindex="-1" data-test="context-menu-item-cut" data-action="Cut">Cut</li>
            <li role="menuitem" tabindex="-1" data-test="context-menu-item-copy" data-action="Copy">Copy</li>
            <li role="menuitem" tabindex="-1" data-test="context-menu-item-paste" data-action="Paste">Paste</li>
          </ul>
          <p class="muted" role="status" aria-live="polite">Context action: <span data-test="context-menu-result">none</span></p>
        </div>

        <div class="panel stack">
          <h2>Flyout navigation</h2>
          <p class="muted">A menubar whose top items reveal a submenu on click or focus.</p>
          <nav aria-label="Catalogue">
            <ul class="lab-menubar" role="menubar" data-test="menubar">
              <li role="none" class="lab-menubar-item">
                <button type="button" role="menuitem" class="lab-menu-trigger" data-test="menu-top-products" aria-haspopup="true" aria-expanded="false" aria-controls="submenu-products">Products</button>
                <ul class="lab-menu-popup" id="submenu-products" role="menu" aria-label="Products" data-test="submenu-products" hidden>
                  <li role="menuitem" tabindex="-1" data-test="submenu-item-dogs" data-action="Dogs">Dogs</li>
                  <li role="menuitem" tabindex="-1" data-test="submenu-item-cats" data-action="Cats">Cats</li>
                  <li role="menuitem" tabindex="-1" data-test="submenu-item-birds" data-action="Birds">Birds</li>
                </ul>
              </li>
              <li role="none" class="lab-menubar-item">
                <button type="button" role="menuitem" class="lab-menu-trigger" data-test="menu-top-services" aria-haspopup="true" aria-expanded="false" aria-controls="submenu-services">Services</button>
                <ul class="lab-menu-popup" id="submenu-services" role="menu" aria-label="Services" data-test="submenu-services" hidden>
                  <li role="menuitem" tabindex="-1" data-test="submenu-item-grooming" data-action="Grooming">Grooming</li>
                  <li role="menuitem" tabindex="-1" data-test="submenu-item-boarding" data-action="Boarding">Boarding</li>
                </ul>
              </li>
            </ul>
          </nav>
          <p class="muted" role="status" aria-live="polite">Navigated to: <span data-test="flyout-result">none</span></p>
        </div>

        <div class="panel stack">
          <h2>Hamburger menu</h2>
          <p class="muted">A toggle that collapses navigation behind a single button.</p>
          <div class="lab-hamburger-anchor">
            <button type="button" class="lab-hamburger" data-test="hamburger-toggle" aria-haspopup="true" aria-expanded="false" aria-controls="hamburger-menu" aria-label="Open menu">
              <span aria-hidden="true">☰</span> Menu
            </button>
            <ul class="lab-menu-stack" id="hamburger-menu" data-test="hamburger-menu" hidden>
              <li><a href="/lab" data-test="hamburger-item-overview">Overview</a></li>
              <li><a href="/lab/forms" data-test="hamburger-item-forms">Forms</a></li>
              <li><a href="/lab/tables" data-test="hamburger-item-tables">Tables</a></li>
            </ul>
          </div>
        </div>

        <div class="panel stack">
          <h2>Split button</h2>
          <p class="muted">A default action plus a caret that opens alternatives; choosing one becomes the new default.</p>
          <div class="lab-split">
            <button type="button" class="lab-split-primary" data-test="split-primary">Save</button>
            <div class="lab-menu-anchor">
              <button type="button" class="lab-split-toggle" data-test="split-toggle" aria-haspopup="menu" aria-expanded="false" aria-controls="split-menu" aria-label="More save options">
                <span aria-hidden="true" class="lab-caret"></span>
              </button>
              <ul class="lab-menu-popup" id="split-menu" role="menu" aria-label="Save options" data-test="split-menu" hidden>
                <li role="menuitem" tabindex="-1" data-test="split-item-close" data-action="Save and close">Save and close</li>
                <li role="menuitem" tabindex="-1" data-test="split-item-draft" data-action="Save as draft">Save as draft</li>
                <li role="menuitem" tabindex="-1" data-test="split-item-new" data-action="Save and new">Save and new</li>
              </ul>
            </div>
          </div>
          <p class="muted" role="status" aria-live="polite">Save choice: <span data-test="split-result">none</span></p>
        </div>
      </section>`,
  });
