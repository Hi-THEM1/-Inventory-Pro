const utils = {
  generateUUID: function() {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  },
  
  formatCurrency: function(n) {
    return "$" + parseFloat(n).toFixed(2);
  },
  
  formatRelativeTime: function(ts) {
    let diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) {
      return 'Just now';
    } else if (diff < 3600) {
      return Math.floor(diff / 60) + ' minutes ago';
    } else if (diff < 86400) {
      return Math.floor(diff / 3600) + ' hours ago';
    } else if (diff < 172800) {
      return '1 day ago';
    } else if (diff < 604800) {
      return Math.floor(diff / 86400) + ' days ago';
    } else if (diff < 1209600) {
      return '1 week ago';
    } else {
      let date = new Date(ts);
      return date.toLocaleDateString();
    }
  },
  
  debounce: function(fn, delay) {
    let timeoutId;
    return function(args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(function() {
        fn(args);
      }, delay);
    };
  },
  
  validateSKU: function(sku, existingArray, currentId) {
    sku = sku.trim().toUpperCase();
    let isValidPattern = /^[A-Z0-9-]{3,20}$/.test(sku);
    
    if (isValidPattern === false) {
      return false;
    }
    
    for (let i = 0; i < existingArray.length; i++) {
      let product = existingArray[i];
      if (product.sku === sku) {
        if (product.id !== currentId) {
          return false;
        }
      }
    }
    
    return true;
  },
  
  calculateInventoryValue: function(products) {
    let sum = 0;
    for (let i = 0; i < products.length; i++) {
      let product = products[i];
      let value = product.quantity * product.unitCost;
      sum = sum + value;
    }
    return sum;
  },

  generateSeedData() {
    const now = Date.now();
    const msPerHour = 60 * 60 * 1000;
    const msPerDay = 24 * msPerHour;

    const products = [
      { id: this.generateUUID(), name: 'Wireless Mouse', sku: 'ELEC-001', category: 'electronics', quantity: 45, minStock: 10, unitCost: 24.99, location: 'Warehouse A', createdAt: now - (30*msPerDay), updatedAt: now - msPerDay },
      { id: this.generateUUID(), name: 'Mechanical Keyboard', sku: 'ELEC-002', category: 'electronics', quantity: 8, minStock: 5, unitCost: 89.99, location: 'Warehouse A', createdAt: now - (20*msPerDay), updatedAt: now - (20*msPerDay) },
      { id: this.generateUUID(), name: 'USB-C Hub', sku: 'ELEC-003', category: 'electronics', quantity: 23, minStock: 15, unitCost: 34.50, location: 'Shelf B2', createdAt: now - (15*msPerDay), updatedAt: now - (4*msPerDay) },
      { id: this.generateUUID(), name: '27" Monitor', sku: 'ELEC-004', category: 'electronics', quantity: 3, minStock: 5, unitCost: 299.00, location: 'Warehouse A', createdAt: now - (10*msPerDay), updatedAt: now - (10*msPerDay) },
      
      { id: this.generateUUID(), name: 'Cotton T-Shirt', sku: 'CLTH-001', category: 'clothing', quantity: 120, minStock: 50, unitCost: 12.99, location: 'Rack C1', createdAt: now - (40*msPerDay), updatedAt: now - (5*msPerHour) },
      { id: this.generateUUID(), name: 'Denim Jeans', sku: 'CLTH-002', category: 'clothing', quantity: 67, minStock: 30, unitCost: 45.00, location: 'Rack C2', createdAt: now - (35*msPerDay), updatedAt: now - (5*msPerDay) },
      { id: this.generateUUID(), name: 'Winter Jacket', sku: 'CLTH-003', category: 'clothing', quantity: 5, minStock: 10, unitCost: 120.00, location: 'Rack C3', createdAt: now - (100*msPerDay), updatedAt: now - (100*msPerDay) },
      { id: this.generateUUID(), name: 'Running Shoes', sku: 'CLTH-004', category: 'clothing', quantity: 0, minStock: 20, unitCost: 85.50, location: 'Rack C4', createdAt: now - (25*msPerDay), updatedAt: now - (25*msPerDay) },
      
      { id: this.generateUUID(), name: 'Organic Coffee Beans', sku: 'FOOD-001', category: 'food', quantity: 89, minStock: 40, unitCost: 18.75, location: 'Pantry D', createdAt: now - (7*msPerDay), updatedAt: now - (7*msPerDay) },
      { id: this.generateUUID(), name: 'Green Tea Set', sku: 'FOOD-002', category: 'food', quantity: 12, minStock: 15, unitCost: 24.00, location: 'Pantry D', createdAt: now - (3*msPerDay), updatedAt: now - (3*msPerDay) },
      
      { id: this.generateUUID(), name: 'A4 Paper Ream', sku: 'OFFC-001', category: 'office', quantity: 200, minStock: 100, unitCost: 5.99, location: 'Storage E', createdAt: now - (60*msPerDay), updatedAt: now - (60*msPerDay) },
      { id: this.generateUUID(), name: 'Ergonomic Chair', sku: 'OFFC-002', category: 'office', quantity: 8, minStock: 5, unitCost: 350.00, location: 'Floor Display', createdAt: now - (2*msPerHour), updatedAt: now - (2*msPerHour) }
    ];

    const activities = [
      { id: this.generateUUID(), type: 'create', productName: 'Ergonomic Chair', details: 'Initial stock added', timestamp: now - (2 * msPerHour) },
      { id: this.generateUUID(), type: 'restock', productName: 'Cotton T-Shirt', details: '+50 units', timestamp: now - (5 * msPerHour) },
      { id: this.generateUUID(), type: 'update', productName: 'Wireless Mouse', details: 'Updated unit cost', timestamp: now - (1 * msPerDay) },
      { id: this.generateUUID(), type: 'delete', productName: 'Bluetooth Speaker', details: 'Removed from catalog', timestamp: now - (2 * msPerDay) },
      { id: this.generateUUID(), type: 'create', productName: 'Green Tea Set', details: 'Added to catalog', timestamp: now - (3 * msPerDay) },
      { id: this.generateUUID(), type: 'restock', productName: 'USB-C Hub', details: '+20 units', timestamp: now - (4 * msPerDay) },
      { id: this.generateUUID(), type: 'update', productName: 'Denim Jeans', details: 'Updated location', timestamp: now - (5 * msPerDay) },
      { id: this.generateUUID(), type: 'create', productName: 'Organic Coffee Beans', details: 'Added to catalog', timestamp: now - (7 * msPerDay) }
    ];

    return { products, activities };
  }
};
