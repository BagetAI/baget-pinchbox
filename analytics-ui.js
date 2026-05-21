/**
 * Pinchbox Analytics Real-Time Inspector Panel (ESTABLISHED 2026)
 * A visually elegant console drawer rendered in the corner of the screen for checking event payloads.
 */

const PinchboxAnalyticsUI = (() => {
  let isExpanded = false;

  function render() {
    // Avoid double rendering
    if (document.getElementById('pinchbox-analytics-inspector')) return;

    const container = document.createElement('div');
    container.id = 'pinchbox-analytics-inspector';
    container.className = 'no-print';
    container.style.cssText = `
      position: fixed;
      bottom: 16px;
      right: 16px;
      z-index: 99999;
      font-family: 'Lato', system-ui, -apple-system, sans-serif;
      font-size: 11px;
      background: #1C1C1E;
      color: #F7F4EF;
      border: 2px solid #C85A32;
      border-radius: 4px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5);
      width: 320px;
      max-height: 400px;
      display: flex;
      flex-direction: column;
      overflow: hidden;
      transition: all 0.25s ease-in-out;
    `;

    // Collapsed vs Expanded state styling
    if (!isExpanded) {
      container.style.width = '140px';
      container.style.height = '34px';
    } else {
      container.style.width = '350px';
      container.style.height = '400px';
    }

    container.innerHTML = `
      <!-- Header -->
      <div id="analytics-inspector-header" style="
        background: #C85A32;
        color: #F7F4EF;
        padding: 8px 12px;
        font-weight: bold;
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        user-select: none;
      ">
        <span style="letter-spacing: 0.5px; text-transform: uppercase;">Tracking Console</span>
        <span style="font-size: 14px; font-family: monospace;">${isExpanded ? '▼' : '▲'}</span>
      </div>

      <!-- Main Body -->
      <div id="analytics-inspector-body" style="
        display: ${isExpanded ? 'flex' : 'none'};
        flex-direction: column;
        height: calc(100% - 34px);
        background: #1C1C1E;
      ">
        <!-- Controls -->
        <div style="padding: 8px; border-b: 1px solid #C85A32; display: flex; justify-content: space-between; background: #2C2C2E;">
          <span style="color: #768A7F; font-weight: bold;">Verified Logs</span>
          <button id="analytics-clear-btn" style="
            background: #6B2D3E;
            color: #F4ECD8;
            border: 1px solid #4A3728;
            padding: 2px 6px;
            border-radius: 2px;
            cursor: pointer;
            font-size: 9px;
            text-transform: uppercase;
          ">Clear Logs</button>
        </div>

        <!-- Event List -->
        <div id="analytics-inspector-list" style="
          flex-grow: 1;
          overflow-y: auto;
          padding: 8px;
          display: flex;
          flex-direction: column;
          gap: 6px;
        ">
          <!-- Injected dynamically -->
        </div>
      </div>
    `;

    document.body.appendChild(container);

    // Event Listeners
    document.getElementById('analytics-inspector-header').addEventListener('click', () => {
      isExpanded = !isExpanded;
      if (!isExpanded) {
        container.style.width = '140px';
        container.style.height = '34px';
        document.getElementById('analytics-inspector-body').style.display = 'none';
        document.getElementById('analytics-inspector-header').querySelector('span:last-child').textContent = '▲';
      } else {
        container.style.width = '350px';
        container.style.height = '400px';
        document.getElementById('analytics-inspector-body').style.display = 'flex';
        document.getElementById('analytics-inspector-header').querySelector('span:last-child').textContent = '▼';
        updateList();
      }
    });

    document.getElementById('analytics-clear-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('Clear tracking history?')) {
        PinchboxAnalytics.clearHistory();
      }
    });

    updateList();
  }

  function updateList() {
    const listEl = document.getElementById('analytics-inspector-list');
    if (!listEl) return;

    const history = PinchboxAnalytics.getHistory();
    if (history.length === 0) {
      listEl.innerHTML = `
        <div style="color: #768A7F; text-align: center; padding-top: 20px; font-style: italic;">
          No events tracked yet. Click components or selections to log payloads.
        </div>
      `;
      return;
    }

    listEl.innerHTML = history.slice().reverse().map((ev, index) => {
      let badgeColor = '#E5A93B'; // gold
      if (ev.event === 'checkout_success') badgeColor = '#10B981'; // green
      if (ev.event === 'checkout_initiated') badgeColor = '#C85A32'; // terracotta
      if (ev.event === 'page_view') badgeColor = '#768A7F'; // sage

      return `
        <div style="border: 1px solid #333; border-radius: 3px; background: #2C2C2E; padding: 6px; cursor: pointer;" onclick="this.querySelector('.ev-details').style.display = this.querySelector('.ev-details').style.display === 'none' ? 'block' : 'none'">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <span style="font-weight: bold; color: ${badgeColor}; text-transform: uppercase;">${ev.event}</span>
            <span style="color: #999; font-size: 9px;">${new Date(ev.timestamp).toLocaleTimeString()}</span>
          </div>
          <div class="ev-details" style="display: none; border-top: 1px dashed #555; margin-top: 4px; padding-top: 4px; font-family: monospace; white-space: pre-wrap; font-size: 9px; color: #D1D1D6; max-height: 150px; overflow-y: auto;">
${JSON.stringify(ev.properties, null, 2)}
          </div>
        </div>
      `;
    }).join('');
  }

  // Auto initialize and listen
  document.addEventListener('DOMContentLoaded', () => {
    render();
  });

  return {
    update: () => {
      updateList();
    }
  };
})();
