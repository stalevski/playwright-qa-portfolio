import {
  getAuditLogRelationsQuery,
  getDownstreamSystemsQuery,
  getEventsQuery,
  getOrdersWithRelationsQuery,
  getReadModelsQuery,
} from '../queries';
import { renderHead, renderStatCard, renderThemeToggle } from '../http/render-helpers';

export type OpsCaseSeverity = 'low' | 'medium' | 'high';

export type OpsCase = {
  slug: string;
  title: string;
  severity: OpsCaseSeverity;
  summary: string;
  sourceOfTruth: string;
  observedInUi: string;
  likelyChecks: string[];
};

export const opsCases: OpsCase[] = [
  {
    slug: 'projection-lag',
    title: 'Projection Lag on Order Status',
    severity: 'high',
    summary: 'The source order can move forward while the UI still emphasizes an older projected status.',
    sourceOfTruth: 'Source DB and event feed',
    observedInUi: 'Dashboard cards and investigation summaries',
    likelyChecks: [
      'Compare order status in source DB vs read model order ledger',
      'Verify event feed contains order.status-updated',
      'Check downstream billing order status',
    ],
  },
  {
    slug: 'missing-analytics',
    title: 'Missing Analytics Event',
    severity: 'medium',
    summary:
      'A workflow can appear successful in operations data but still not be represented in the analytics replica.',
    sourceOfTruth: 'Source events vs downstream analyticsEvents',
    observedInUi: 'Sync monitor counts and alert cards',
    likelyChecks: [
      'Compare source event count against analytics replica count',
      'Identify latest missing entityId',
      'Validate downstream sync timing',
    ],
  },
  {
    slug: 'order-total-mismatch',
    title: 'Order Total Mismatch',
    severity: 'high',
    summary:
      'The storefront can create an order whose total looks right in the UI but does not fully describe multi-item cart relations.',
    sourceOfTruth: 'Orders source DB, order relations, storefront completion flow',
    observedInUi: 'Storefront completion and operations incident detail',
    likelyChecks: [
      'Validate order total against cart lines',
      'Check only first pet relation is persisted',
      'Verify billing export amount and order relation payload',
    ],
  },
];

const severityColor: Record<OpsCaseSeverity, string> = {
  low: 'var(--success)',
  medium: 'var(--warning)',
  high: 'var(--danger)',
};

export const renderOpsLayout = (options: {
  title: string;
  body: string;
  activeNav?: 'overview' | 'queue' | 'comparisons' | 'incidents';
}): string => `<!DOCTYPE html>
<html lang="en">
${renderHead(options.title)}
<body>
  <header>
    <div class="brand">
      <strong>PetHub Operations Portal</strong>
      <span>Workflow monitoring, projections, downstream replicas, and investigation practice</span>
    </div>
    <nav aria-label="Operations">
      <a href="/">Admin</a>
      <a href="/shop">Storefront</a>
      <a href="/ops" class="${options.activeNav === 'overview' ? 'active' : ''}">Overview</a>
      <a href="/ops/queue" class="${options.activeNav === 'queue' ? 'active' : ''}">Work Queue</a>
      <a href="/ops/comparisons" class="${options.activeNav === 'comparisons' ? 'active' : ''}">Comparisons</a>
      <a href="/ops/incidents" class="${options.activeNav === 'incidents' ? 'active' : ''}">Incidents</a>
      ${renderThemeToggle()}
    </nav>
  </header>
  <main>
    ${options.body}
  </main>
</body>
</html>`;

const buildOpsSummary = async () => {
  const orders = await getOrdersWithRelationsQuery();
  const audit = await getAuditLogRelationsQuery();
  const events = await getEventsQuery();
  const readModels = await getReadModelsQuery();
  const downstream = await getDownstreamSystemsQuery();
  const projectionLagCount = orders.filter((order) => {
    const ledger = readModels.orderLedger.find((entry) => entry.id === order.id);
    return ledger && ledger.status !== order.status;
  }).length;
  const analyticsGap = Math.max(events.length - downstream.analyticsEvents.length, 0);
  const billingMismatchCount = orders.filter((order) => {
    const billing = downstream.billingOrders.find((entry) => entry.orderId === order.id);
    return billing && billing.amount !== order.totalAmount;
  }).length;

  return {
    orders,
    audit,
    events,
    readModels,
    downstream,
    projectionLagCount,
    analyticsGap,
    billingMismatchCount,
    healthScore: Math.max(82, 100 - projectionLagCount * 8 - analyticsGap * 3),
  };
};

export const renderOpsOverview = async (): Promise<string> => {
  const summary = await buildOpsSummary();
  const latestOrders = summary.orders.slice(0, 5);
  const latestEvents = summary.events.slice(0, 5);

  return renderOpsLayout({
    title: 'Operations Overview',
    activeNav: 'overview',
    body: `
      <section class="hero">
        <h1>Local workflow investigation playground</h1>
        <p>This portal is intentionally designed for backend-heavy QA work: compare source records, read models, downstream systems, and workflow evidence. Some summaries are intentionally optimistic so you still need to investigate the underlying data.</p>
      </section>
      <div class="grid stats">
        ${renderStatCard('Source Orders', summary.orders.length)}
        ${renderStatCard('Event Feed', summary.events.length)}
        ${renderStatCard('Projection Lag Alerts', summary.projectionLagCount)}
        ${renderStatCard('Ops Health Score', summary.healthScore)}
      </div>
      <div class="grid two-column">
        <section>
          <h2>Recent workflow items</h2>
          <table>
            <thead><tr><th>Order</th><th>User</th><th>Source Status</th><th>Ledger Status</th><th>Billing</th></tr></thead>
            <tbody>
              ${latestOrders
                .map((order) => {
                  const ledger = summary.readModels.orderLedger.find((entry) => entry.id === order.id);
                  const billing = summary.downstream.billingOrders.find((entry) => entry.orderId === order.id);
                  return `<tr><td>#${order.id}</td><td>${order.user?.username ?? order.userId}</td><td>${order.status}</td><td>${ledger?.status ?? 'missing'}</td><td>${billing?.orderStatus ?? 'missing'}</td></tr>`;
                })
                .join('')}
            </tbody>
          </table>
        </section>
        <section>
          <h2>Latest events</h2>
          <div class="list">
            ${latestEvents.map((event) => `<div><strong>${event.type}</strong><br /><span class="muted">${event.entityType}#${event.entityId}</span><br /><span class="muted">${event.createdAt}</span></div>`).join('')}
          </div>
        </section>
      </div>
      <div class="grid three-column">
        ${opsCases.map((incident) => `<section><span class="pill" style="background: ${severityColor[incident.severity]};">${incident.severity}</span><h3 style="margin-top: 12px;">${incident.title}</h3><p class="muted">${incident.summary}</p><a href="/ops/incidents/${incident.slug}" style="color: #93c5fd;">Open investigation</a></section>`).join('')}
      </div>`,
  });
};

export const renderOpsQueue = async (): Promise<string> => {
  const summary = await buildOpsSummary();
  const queueRows = summary.orders
    .slice(0, 10)
    .map((order, index) => {
      const ledger = summary.readModels.orderLedger.find((entry) => entry.id === order.id);
      const severity = index === 0 || ledger?.status !== order.status ? 'high' : index % 2 === 0 ? 'medium' : 'low';
      const investigation =
        ledger?.status !== order.status
          ? 'Source and projection disagree'
          : order.totalAmount > 1000
            ? 'High-value order requires downstream verification'
            : 'Routine verification';
      return `<tr><td><span class="pill" style="background: ${severityColor[severity]};">${severity}</span></td><td>#${order.id}</td><td>${order.user?.username ?? order.userId}</td><td>${order.status}</td><td>${ledger?.status ?? 'missing'}</td><td>${investigation}</td></tr>`;
    })
    .join('');

  return renderOpsLayout({
    title: 'Operations Work Queue',
    activeNav: 'queue',
    body: `
      <section class="hero">
        <h1>Work queue</h1>
        <p>A simplified operator queue for investigative testing. It intentionally blends genuine data differences with noisy prioritization so you still need to validate the underlying systems.</p>
      </section>
      <section>
        <h2>Investigations requiring validation</h2>
        <table>
          <thead><tr><th>Priority</th><th>Order</th><th>User</th><th>Source</th><th>Projection</th><th>Reason</th></tr></thead>
          <tbody>${queueRows}</tbody>
        </table>
      </section>`,
  });
};

export const renderOpsComparisons = async (): Promise<string> => {
  const summary = await buildOpsSummary();
  return renderOpsLayout({
    title: 'Operations Comparisons',
    activeNav: 'comparisons',
    body: `
      <section class="hero">
        <h1>Cross-system comparisons</h1>
        <p>Use this view to compare source data, projections, and downstream replicas. This is the fastest way to practice the kind of end-to-end data validation you do professionally.</p>
      </section>
      <div class="grid three-column">
        <section>
          <h2>Source orders</h2>
          <div class="code">${JSON.stringify(summary.orders.slice(0, 5), null, 2)}</div>
        </section>
        <section>
          <h2>Read model ledger</h2>
          <div class="code">${JSON.stringify(summary.readModels.orderLedger.slice(0, 5), null, 2)}</div>
        </section>
        <section>
          <h2>Billing replica</h2>
          <div class="code">${JSON.stringify(summary.downstream.billingOrders.slice(0, 5), null, 2)}</div>
        </section>
      </div>
      <div class="grid two-column">
        <section>
          <h2>Comparison notes</h2>
          <div class="list">
            <div>Orders are sourced from the operational JSON database.</div>
            <div>Order ledger is a derived projection refreshed through syncDerivedStores().</div>
            <div>Billing orders represent a downstream replica of order totals and status.</div>
            <div>The storefront checkout flow can create a business-valid total with incomplete item relation fidelity.</div>
          </div>
        </section>
        <section>
          <h2>Signals to investigate</h2>
          <table>
            <thead><tr><th>Signal</th><th>Count</th></tr></thead>
            <tbody>
              <tr><td>Projection lag</td><td>${summary.projectionLagCount}</td></tr>
              <tr><td>Analytics event gap</td><td>${summary.analyticsGap}</td></tr>
              <tr><td>Billing amount mismatch</td><td>${summary.billingMismatchCount}</td></tr>
            </tbody>
          </table>
        </section>
      </div>`,
  });
};

export const renderOpsIncidents = async (): Promise<string> =>
  renderOpsLayout({
    title: 'Operations Incidents',
    activeNav: 'incidents',
    body: `
    <section class="hero">
      <h1>Known incident patterns</h1>
      <p>These scenarios are intentionally designed to train investigation habits: source-vs-projection validation, downstream gaps, and workflow integrity checks.</p>
    </section>
    <div class="grid three-column">
      ${opsCases.map((incident) => `<section><span class="pill" style="background: ${severityColor[incident.severity]};">${incident.severity}</span><h2 style="margin-top: 12px;">${incident.title}</h2><p class="muted">${incident.summary}</p><a href="/ops/incidents/${incident.slug}" style="color: #93c5fd;">Open detail</a></section>`).join('')}
    </div>`,
  });

export const renderOpsIncidentDetail = async (incident: OpsCase): Promise<string> => {
  const summary = await buildOpsSummary();
  return renderOpsLayout({
    title: incident.title,
    activeNav: 'incidents',
    body: `
      <section class="hero">
        <span class="pill" style="background: ${severityColor[incident.severity]};">${incident.severity}</span>
        <h1 style="margin-top: 12px;">${incident.title}</h1>
        <p>${incident.summary}</p>
      </section>
      <div class="grid two-column">
        <section>
          <h2>Investigation brief</h2>
          <div class="list">
            <div><strong>Source of truth</strong><br /><span class="muted">${incident.sourceOfTruth}</span></div>
            <div><strong>Observed in UI</strong><br /><span class="muted">${incident.observedInUi}</span></div>
            ${incident.likelyChecks.map((check) => `<div>${check}</div>`).join('')}
          </div>
        </section>
        <section>
          <h2>Relevant live data</h2>
          <div class="code">${JSON.stringify(
            {
              latestOrder: summary.orders[0],
              latestLedger: summary.readModels.orderLedger[0],
              latestBilling: summary.downstream.billingOrders[0],
              latestEvent: summary.events[0],
            },
            null,
            2,
          )}</div>
        </section>
      </div>
      <section>
        <h2>Suggested validation path</h2>
        <table>
          <thead><tr><th>Step</th><th>What to compare</th></tr></thead>
          <tbody>
            <tr><td>1</td><td>Source DB order vs read model order ledger</td></tr>
            <tr><td>2</td><td>Event feed vs analytics downstream replica</td></tr>
            <tr><td>3</td><td>UI summary labels vs source totals</td></tr>
            <tr><td>4</td><td>Order relation integrity through API relation endpoints</td></tr>
          </tbody>
        </table>
      </section>`,
  });
};
