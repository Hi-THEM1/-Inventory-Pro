const inventory = {
  state: { query: '', category: 'all', status: 'all', sortCol: 'name', sortAsc: true, page: 1, limit: 10 },

  init: function(container, storage, app) {
    this.container = container;
    this.storage = storage;
    this.app = app;
    this.render();
  },

  render: function() {
    let tpl = document.getElementById('tpl-inventory').content.cloneNode(true);
    this.container.innerHTML = '';
    this.container.appendChild(tpl);
    
    this.bindEvents();
    this.updateTable();
  },

  bindEvents: function() {
    let self = this;
    
    document.getElementById('invSearch').addEventListener('input', utils.debounce(function(e) {
      self.state.query = e.target.value; 
      self.state.page = 1; 
      self.updateTable();
    }, 300));
    
    document.getElementById('invCategoryFilter').addEventListener('change', function(e) {
      self.state.category = e.target.value; 
      self.state.page = 1; 
      self.updateTable();
    });
    
    document.getElementById('invStatusFilter').addEventListener('change', function(e) {
      self.state.status = e.target.value; 
      self.state.page = 1; 
      self.updateTable();
    });

    let headers = document.querySelectorAll('.data-table th[data-sort]');
    for (let i = 0; i < headers.length; i++) {
      let th = headers[i];
      th.addEventListener('click', function() {
        let col = th.dataset.sort;
        if (self.state.sortCol === col) {
          self.state.sortAsc = !self.state.sortAsc;
        } else { 
          self.state.sortCol = col; 
          self.state.sortAsc = true; 
        }
        self.updateTable();
      });
    }

    document.getElementById('exportCsvBtn').addEventListener('click', function() {
      self.exportCSV();
    });
  },

  updateTable: function() {
    let criteria = { category: this.state.category, status: this.state.status };
    let filteredItems = this.storage.filter(criteria);
    
    let items = [];
    if (this.state.query) {
      let q = this.state.query.toLowerCase();
      for (let i = 0; i < filteredItems.length; i++) {
        let p = filteredItems[i];
        let nameMatch = p.name.toLowerCase().includes(q);
        let skuMatch = p.sku.toLowerCase().includes(q);
        if (nameMatch === true || skuMatch === true) {
          items.push(p);
        }
      }
    } else {
      items = filteredItems;
    }

    let col = this.state.sortCol;
    let asc = 1;
    if (this.state.sortAsc === false) {
      asc = -1;
    }
    
    items.sort(function(a, b) {
      let va = a[col]; 
      let vb = b[col];
      
      if (typeof va === 'string') { 
        va = va.toLowerCase(); 
        vb = vb.toLowerCase(); 
      }
      
      if (va < vb) {
        return -1 * asc;
      }
      if (va > vb) {
        return 1 * asc;
      }
      return 0;
    });

    let tbody = document.getElementById('inventoryTableBody');
    let pagination = document.getElementById('inventoryPagination');
    if (!tbody) {
      return;
    }

    if (items.length === 0) {
      tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding: 64px; color:var(--color-slate-500);">
        <div style="font-size:64px; margin-bottom:16px; opacity:0.8;">📦</div>
        <h3 style="color:var(--color-slate-800); margin-bottom:8px;">No products found</h3>
        <p style="margin-bottom:24px;">Start by adding your first product to the inventory.</p>
        <button class="btn btn-primary" onclick="window.location.hash='#add'">Add Product</button>
      </td></tr>`;
      pagination.innerHTML = '';
      return;
    }

    let totalPages = Math.ceil(items.length / this.state.limit);
    if (this.state.page > totalPages && totalPages > 0) {
      this.state.page = totalPages;
    }
    
    let start = (this.state.page - 1) * this.state.limit;
    let end = start + this.state.limit;
    let pageItems = items.slice(start, end);

    let html = "";
    for (let i = 0; i < pageItems.length; i++) {
      let p = pageItems[i];
      
      let maxDivisor = p.minStock;
      if (maxDivisor < 1) {
        maxDivisor = 1;
      }
      
      let pct = (p.quantity / maxDivisor) * 100;
      if (pct > 100) {
        pct = 100;
      }
      
      let colorClass = '';
      let textClass = '';
      if (p.quantity === 0) { 
        colorClass = 'danger'; 
        textClass = 'text-danger'; 
      } else if (p.quantity <= p.minStock) { 
        colorClass = 'warning'; 
        textClass = 'text-warning'; 
      }

      let rowHtml = `<tr>
        <td><strong>${p.name}</strong><br><small class="badge badge-category" style="margin-top:4px;">${p.sku}</small></td>
        <td><span class="badge badge-category">${p.category}</span></td>
        <td>
          <div class="qty-wrapper">
            <span class="${textClass}"><strong>${p.quantity}</strong></span>
            <div class="qty-bar"><div class="qty-fill ${colorClass}" style="width:${pct}%"></div></div>
          </div>
        </td>
        <td>${utils.formatCurrency(p.unitCost)}</td>
        <td>
          <button class="btn-icon" onclick="window.location.hash='#edit/${p.id}'" title="Edit">✏️</button>
          <button class="btn-icon" onclick="window.appOpenDelete('${p.id}')" title="Delete">🗑️</button>
        </td>
      </tr>`;
      html = html + rowHtml;
    }
    tbody.innerHTML = html;

    this.renderPagination(totalPages);
  },

  renderPagination: function(total) {
    if (total <= 1) { 
      document.getElementById('inventoryPagination').innerHTML = ''; 
      return; 
    }
    
    let isPrevDisabled = '';
    if (this.state.page === 1) {
      isPrevDisabled = 'disabled';
    }
    
    let isNextDisabled = '';
    if (this.state.page === total) {
      isNextDisabled = 'disabled';
    }
    
    let html = `<div style="display:flex; gap:8px; justify-content:center; padding:16px;">
      <button class="btn btn-sm btn-secondary" onclick="window.appSetPage(${this.state.page - 1})" ${isPrevDisabled}>Prev</button>`;
      
    let maxPages = total;
    if (maxPages > 5) {
      maxPages = 5;
    }
    
    for (let i = 1; i <= maxPages; i++) {
        let btnClass = 'btn-secondary';
        if (this.state.page === i) {
          btnClass = 'btn-primary';
        }
        html += `<button class="btn btn-sm ${btnClass}" onclick="window.appSetPage(${i})">${i}</button>`;
    }
    
    html += `<button class="btn btn-sm btn-secondary" onclick="window.appSetPage(${this.state.page + 1})" ${isNextDisabled}>Next</button></div>`;
    document.getElementById('inventoryPagination').innerHTML = html;
  },

  exportCSV: function() {
    let items = this.storage.getAll();
    if (items.length === 0) {
      return this.app.showToast('No data to export', 'error');
    }
    
    let d = new Date().toISOString().split('T')[0];
    let headers = ['id', 'name', 'sku', 'category', 'quantity', 'minStock', 'unitCost', 'location'];
    
    let csvString = headers.join(',') + '\n';
    
    for (let i = 0; i < items.length; i++) {
      let item = items[i];
      let rowArray = [];
      
      for (let j = 0; j < headers.length; j++) {
        let h = headers[j];
        let val = item[h];
        if (val === undefined) {
          val = '';
        }
        rowArray.push('"' + val + '"');
      }
      
      csvString = csvString + rowArray.join(',') + '\n';
    }
    
    let a = document.createElement('a');
    a.href = window.URL.createObjectURL(new Blob([csvString], { type: 'text/csv' }));
    a.download = `inventory_${d}.csv`;
    a.click();
  }
};
