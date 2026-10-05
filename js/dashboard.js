const dashboard = {
  init: function(container, storage, app) {
    this.container = container;
    this.storage = storage;
    this.app = app;
    this.render();
  },

  render: function() {
    let tpl = document.getElementById('tpl-dashboard').content.cloneNode(true);
    this.container.innerHTML = '';
    this.container.appendChild(tpl);
    this.renderStats();
    this.renderAlerts();
    this.renderActivity();
  },

  renderStats: function() {
    let stats = this.storage.getStats();
    let grid = document.getElementById('dashboardStats');
    if (!grid) {
      return;
    }
    
    let lowStockClass = '';
    if (stats.lowStock > 0) {
      lowStockClass = 'text-danger';
    }
    
    grid.innerHTML = `
      <div class="card stat-card">
        <span class="stat-title">Total Products</span>
        <span class="stat-value">${stats.total} <span style="font-size:18px; margin-left:4px;">📈</span></span>
      </div>
      <div class="card stat-card">
        <span class="stat-title">Low Stock Alert</span>
        <span class="stat-value ${lowStockClass}">${stats.lowStock}</span>
      </div>
      <div class="card stat-card">
        <span class="stat-title">Inventory Value</span>
        <span class="stat-value">${utils.formatCurrency(stats.value)}</span>
      </div>
      <div class="card stat-card">
        <span class="stat-title">Categories</span>
        <span class="stat-value">${stats.categories}</span>
      </div>
    `;
  },

  renderAlerts: function() {
    let alerts = this.storage.getLowStock();
    let container = document.getElementById('dashboardAlerts');
    if (!container) {
      return;
    }
    
    if (alerts.length === 0) {
      container.innerHTML = '<div style="text-align:center; padding:32px; color:var(--color-slate-500)"><span style="font-size:24px;">✅</span><br><div style="margin-top:8px;">All stock levels healthy</div></div>';
      return;
    }

    let html = `<div class="table-container"><table class="data-table" style="font-size: 13px;">
      <thead><tr><th>Name</th><th>SKU</th><th>Current</th><th>Min</th><th>Gap</th><th>Action</th></tr></thead>
      <tbody>`;
      
    for (let i = 0; i < alerts.length; i++) {
      let p = alerts[i];
      let gap = p.minStock - p.quantity;
      
      let textClass = 'text-warning';
      if (p.quantity === 0) {
        textClass = 'text-danger';
      }
      
      html = html + `<tr>
        <td><strong>${p.name}</strong></td>
        <td><span class="badge badge-category">${p.sku}</span></td>
        <td class="${textClass}"><strong>${p.quantity}</strong></td>
        <td>${p.minStock}</td>
        <td class="text-danger">-${gap}</td>
        <td><button class="btn btn-sm btn-secondary" onclick="window.appQuickAdjust('${p.id}')">Quick Restock</button></td>
      </tr>`;
    }
    
    html = html + '</tbody></table></div>';
    container.innerHTML = html;
  },

  renderActivity: function() {
    let allLogs = this.storage.getActivityLog();
    let logs = [];
    
    let maxLogs = 10;
    if (allLogs.length < 10) {
      maxLogs = allLogs.length;
    }
    
    for (let i = 0; i < maxLogs; i++) {
      logs.push(allLogs[i]);
    }
    
    let container = document.getElementById('dashboardActivity');
    if (!container) {
      return;
    }

    if (logs.length === 0) {
      container.innerHTML = '<li style="color:var(--color-slate-500)">No recent activity</li>';
      return;
    }

    let icons = { create: '➕', update: '✏️', delete: '🗑️', restock: '📦' };
    let actionLabels = { create: 'Added', update: 'Updated', delete: 'Deleted', restock: 'Restocked' };
    
    let html = '';
    for (let i = 0; i < logs.length; i++) {
      let l = logs[i];
      
      let icon = icons[l.type];
      if (icon === undefined) {
        icon = '◾';
      }
      
      let actionLabel = actionLabels[l.type];
      let timeStr = utils.formatRelativeTime(l.timestamp);
      
      let detailsString = '';
      if (l.details) {
        if (l.type === 'restock') {
          detailsString = '(' + l.details + ')';
        }
      }
      
      html = html + `<li>
        <span style="font-size: 18px; margin-right:8px;">${icon}</span>
        <div style="flex:1; align-self:center;">
          ${actionLabel} <strong>${l.productName}</strong> ${detailsString} &mdash; <span class="activity-time" style="display:inline; margin:0;">${timeStr}</span>
        </div>
      </li>`;
    }
    
    container.innerHTML = html;
  }
};
