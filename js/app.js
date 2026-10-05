

// Main application class for Inventory Pro
// Handles routing, login, dashboard, and global UI events
class App {
  constructor() {
    // Storage handler for inventory
    this.storage = new InventoryStorage();
    // Detect if current page is login
    this.isAuthPage = window.location.pathname.endsWith('index.html') || window.location.pathname === '/';
  }

  // Entry point for the app
  init() {
    if (this.isAuthPage) {
      // If already logged in, redirect to dashboard
      if (auth.check()) { window.location.href = 'dashboard.html'; return; }
      this.setupLogin();
    } else {
      if (!auth.check()) { auth.guard(); return; }
      this.setupDashboard();
    }
  }

  // Setup login form events
  setupLogin() {
    let form = document.getElementById('loginForm');
    if (!form) {
      return;
    }
    
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      let u = form.username.value;
      let p = form.password.value;
      
      if (auth.login(u, p)) {
        window.location.href = 'dashboard.html';
      } else {
        let err = document.getElementById('usernameError');
        if (err) {
          err.textContent = 'Invalid credentials';
        }
        form.classList.add('shake');
        setTimeout(function() {
          form.classList.remove('shake');
        }, 300);
      }
    });
  }

  // Setup dashboard events and routing
  setupDashboard() {
    let self = this;
    
    let logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function() {
        auth.logout();
      });
    }

    // Reset Data logic
    let resetBtn = document.getElementById('resetDataBtn');
    if (resetBtn) {
      resetBtn.addEventListener('click', function() {
        let confirmReset = confirm('Warning: This will reset all inventory back to the static demo data. Proceed?');
        if (confirmReset) {
          self.storage.resetToSeed();
          window.location.reload();
        }
      });
    }

    // Mobile Menu Toggle
    let mobileMenuBtn = document.getElementById('mobileMenuBtn');
    if (mobileMenuBtn) {
      mobileMenuBtn.addEventListener('click', function() {
        let sidebar = document.getElementById('sidebar');
        if (sidebar) {
          sidebar.classList.toggle('open');
        }
      });
    }

    // Global Search
    let globalSearch = document.getElementById('globalSearch');
    if (globalSearch) {
      globalSearch.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
          let q = e.target.value.trim();
          window.location.hash = '#inventory';
          setTimeout(function() {
            if (window.inventory) {
              inventory.state.query = q;
              inventory.state.page = 1;
              let invSearch = document.getElementById('invSearch');
              if (invSearch) {
                invSearch.value = q;
              }
              if (window.location.hash === '#inventory') {
                inventory.updateTable();
              }
            }
          }, 50);
        }
      });
    }

    window.addEventListener('hashchange', function() {
      self.router();
    });
    this.router();
    this.setupGlobals();
  }

  // Simple hash-based router
  router() {
    let hash = window.location.hash.slice(1);
    if (!hash) {
      hash = 'dashboard';
    }
    
    let parts = hash.split('/');
    let view = parts[0];
    let id = null;
    if (parts[1]) {
      id = parts[1];
    }

    // Highlight active nav link
    let navLinks = document.querySelectorAll('.nav-link');
    for (let i = 0; i < navLinks.length; i++) {
      navLinks[i].classList.remove('active');
    }
    
    let routeToMatch = view;
    if (view === 'edit') {
      routeToMatch = 'add';
    }
    
    let nav = document.querySelector('.nav-link[data-route="' + routeToMatch + '"]');
    if (nav) {
      nav.classList.add('active');
    }
    
    let sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.classList.remove('open');
    }

    // Main view container
    let container = document.getElementById('viewContainer');
    if (!container) {
      return;
    }
    
    if (view === 'dashboard') {
      dashboard.init(container, this.storage, this);
    } else if (view === 'inventory') {
      inventory.init(container, this.storage, this);
    } else if (view === 'add' || view === 'edit') {
      this.renderProductForm(container, id);
    } else {
      dashboard.init(container, this.storage, this);
    }
  }

  // Show a toast notification
  showToast(msg, type) {
    if (!type) {
      type = 'success';
    }
    let c = document.getElementById('toastContainer');
    if (!c) {
      return;
    }
    let toast = document.createElement('div');
    toast.className = 'toast ' + type;
    toast.textContent = msg;
    c.appendChild(toast);
    setTimeout(function() {
      toast.remove();
    }, 4000);
  }

  // Setup global functions for inventory actions
  setupGlobals() {
    let self = this;
    window.appSetPage = function(p) { 
      inventory.state.page = p; 
      inventory.updateTable(); 
    };
    window.appOpenDelete = function(id) { 
      self.showModal('delete', id); 
    };
    window.appQuickAdjust = function(id) { 
      self.showModal('adjust', id); 
    };
  }

  // Show modal for delete or adjust actions
  showModal(type, id) {
    let p = this.storage.getById(id);
    if (!p) {
      return;
    }
    
    let c = document.getElementById('modalContainer');
    if (!c) {
      return;
    }
    
    let self = this;

    if (type === 'delete') {
      c.innerHTML = `
        <div class="modal-overlay" id="modalOverlay">
          <div class="modal-content">
            <h3 class="modal-title">Delete ${p.name}?</h3>
            <p>This will permanently remove this product and cannot be undone.</p>
            <div class="modal-actions">
              <button class="btn btn-secondary" onclick="document.getElementById('modalContainer').innerHTML=''">Cancel</button>
              <button class="btn btn-danger" id="confirmDeleteBtn">Delete</button>
            </div>
          </div>
        </div>`;
        
      let confirmBtn = document.getElementById('confirmDeleteBtn');
      if (confirmBtn) {
        confirmBtn.addEventListener('click', function() {
          self.storage.delete(id);
          self.showToast('Product deleted');
          c.innerHTML = '';
          if (window.location.hash === '#inventory') {
            inventory.updateTable();
          } else {
            self.router();
          }
        });
      }
    } else if (type === 'adjust') {
      c.innerHTML = `
        <div class="modal-overlay" id="modalOverlay">
          <div class="modal-content">
            <h3 class="modal-title">Quick Adjust: ${p.name}</h3>
            <p>Current Quantity: <strong>${p.quantity}</strong></p>
            <form id="adjustForm" style="margin-top:16px;">
              <div class="form-group"><label>Add/Remove (e.g. 5, -2)</label><input type="number" id="adjQty" required></div>
              <div class="form-group"><label>Reason (Optional)</label><input type="text" id="adjReason"></div>
              <div class="modal-actions">
                <button type="button" class="btn btn-secondary" onclick="document.getElementById('modalContainer').innerHTML=''">Cancel</button>
                <button type="submit" class="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>`;
        
      let adjustForm = document.getElementById('adjustForm');
      if (adjustForm) {
        adjustForm.addEventListener('submit', function(e) {
          e.preventDefault();
          let qtyInput = document.getElementById('adjQty');
          let reasonInput = document.getElementById('adjReason');
          if (!qtyInput) {
            return;
          }
          
          let delta = parseInt(qtyInput.value);
          let newQty = p.quantity + delta;
          if (newQty < 0) {
            newQty = 0;
          }
          
          self.storage.update(id, { quantity: newQty });
          
          let reasonText = '';
          if (reasonInput) {
            reasonText = reasonInput.value;
          }
          self.storage.logActivity('restock', p.name, 'Quantity adjusted by ' + delta + ': ' + reasonText);
          self.showToast('Stock adjusted successfully');
          c.innerHTML = '';
          self.router();
        });
      }
    }
  }

  // Render the add/edit product form
  renderProductForm(container, evaluateId) {
    container.innerHTML = '';
    let tpl = document.getElementById('tpl-product-form');
    if (!tpl) {
      return;
    }
    container.appendChild(tpl.content.cloneNode(true));

    let isEdit = false;
    if (evaluateId) {
      isEdit = true;
    }
    
    let form = document.getElementById('productForm');
    if (!form) {
      return;
    }

    if (isEdit) {
      let p = this.storage.getById(evaluateId);
      if (!p) { 
        window.location.hash = '#inventory'; 
        return; 
      }
      document.getElementById('formTitle').textContent = 'Edit Product: ' + p.name;
      document.getElementById('productId').value = p.id;
      document.getElementById('productName').value = p.name;
      document.getElementById('productSku').value = p.sku;
      document.getElementById('productCategory').value = p.category;
      
      if (p.location) {
        document.getElementById('productLocation').value = p.location;
      } else {
        document.getElementById('productLocation').value = '';
      }
      
      document.getElementById('productQuantity').value = p.quantity;
      document.getElementById('productMinStock').value = p.minStock;
      document.getElementById('productUnitCost').value = p.unitCost;
    } else {
      document.getElementById('formTitle').textContent = 'Add New Product';
    }

    let cancelBtn = document.getElementById('cancelFormBtn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', function() {
        window.location.hash = '#inventory';
      });
    }

    // Validate fields on blur
    let inputs = form.querySelectorAll('input, select');
    for (let i = 0; i < inputs.length; i++) {
      let el = inputs[i];
      el.addEventListener('blur', function() {
        if (el.checkValidity()) {
          el.classList.remove('invalid');
        } else {
          el.classList.add('invalid');
        }
      });
    }

    // Handle form submit
    let self = this;
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      let sku = document.getElementById('productSku').value;
      
      let isValidSKU = utils.validateSKU(sku, self.storage.getAll(), evaluateId);
      if (isValidSKU === false) {
        document.getElementById('productSku').classList.add('invalid');
        self.showToast('SKU must be unique and valid format', 'error');
        form.classList.add('shake');
        setTimeout(function() {
          form.classList.remove('shake');
        }, 400);
        return;
      }

      let data = {};
      data.name = document.getElementById('productName').value;
      data.sku = sku;
      data.category = document.getElementById('productCategory').value;
      data.location = document.getElementById('productLocation').value;
      data.quantity = parseInt(document.getElementById('productQuantity').value);
      data.minStock = parseInt(document.getElementById('productMinStock').value);
      data.unitCost = parseFloat(document.getElementById('productUnitCost').value);

      if (isEdit) {
        self.storage.update(evaluateId, data);
        self.showToast('Product updated successfully');
      } else {
        self.storage.create(data);
        self.showToast('Product added successfully');
      }
      window.location.hash = '#inventory';
    });
  }
}

// Instantiate and initialize the app after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  let app = new App();
  app.init();
});
