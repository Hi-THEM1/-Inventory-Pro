class InventoryStorage {
  constructor() {
    this.key = 'inv_v2_products';
    this.activityKey = 'inv_v2_activity';
    this._init();
  }

  _init() {
    if (!localStorage.getItem(this.key) || !localStorage.getItem(this.activityKey)) {
      this.resetToSeed();
    }
  }

  resetToSeed() {
    const seed = utils.generateSeedData();
    localStorage.setItem(this.key, JSON.stringify(seed.products));
    localStorage.setItem(this.activityKey, JSON.stringify(seed.activities));
  }

  clearAll() {
    localStorage.removeItem(this.key);
    localStorage.removeItem(this.activityKey);
  }

  getAll() {
    let data = localStorage.getItem(this.key);
    if (data) {
      return JSON.parse(data);
    } else {
      return [];
    }
  }
  
  getById(id) {
    let products = this.getAll();
    for (let i = 0; i < products.length; i++) {
      if (products[i].id === id) {
        return products[i];
      }
    }
    return null;
  }
  
  findBySKU(sku) {
    let products = this.getAll();
    let upperSku = sku.toUpperCase();
    for (let i = 0; i < products.length; i++) {
      if (products[i].sku === upperSku) {
        return products[i];
      }
    }
    return null;
  }
  
  create(productData) {
    let products = this.getAll();
    
    let product = {};
    product.id = utils.generateUUID();
    product.name = productData.name;
    product.sku = productData.sku.toUpperCase();
    product.category = productData.category;
    product.location = productData.location;
    product.quantity = productData.quantity;
    product.minStock = productData.minStock;
    product.unitCost = productData.unitCost;
    product.createdAt = Date.now();
    product.updatedAt = Date.now();
    
    products.push(product);
    localStorage.setItem(this.key, JSON.stringify(products));
    this.logActivity('create', product.name, 'Added with qty ' + product.quantity);
    return product;
  }
  
  update(id, changes) {
    let products = this.getAll();
    let foundIndex = -1;
    
    for (let i = 0; i < products.length; i++) {
      if (products[i].id === id) {
        foundIndex = i;
        break;
      }
    }
    
    if (foundIndex === -1) {
      return null;
    }
    
    let productToUpdate = products[foundIndex];
    if (changes.name !== undefined) productToUpdate.name = changes.name;
    if (changes.sku !== undefined) productToUpdate.sku = changes.sku.toUpperCase();
    if (changes.category !== undefined) productToUpdate.category = changes.category;
    if (changes.location !== undefined) productToUpdate.location = changes.location;
    if (changes.quantity !== undefined) productToUpdate.quantity = changes.quantity;
    if (changes.minStock !== undefined) productToUpdate.minStock = changes.minStock;
    if (changes.unitCost !== undefined) productToUpdate.unitCost = changes.unitCost;
    
    productToUpdate.updatedAt = Date.now();
    
    localStorage.setItem(this.key, JSON.stringify(products));
    this.logActivity('update', productToUpdate.name, 'Product details updated');
    return productToUpdate;
  }
  
  delete(id) {
    let products = this.getAll();
    let productToDelete = null;
    let filteredProducts = [];
    
    for (let i = 0; i < products.length; i++) {
      let p = products[i];
      if (p.id === id) {
        productToDelete = p;
      } else {
        filteredProducts.push(p);
      }
    }
    
    if (productToDelete === null) {
      return false;
    }
    
    localStorage.setItem(this.key, JSON.stringify(filteredProducts));
    this.logActivity('delete', productToDelete.name, 'Product removed');
    return true;
  }
  
  search(query) {
    let products = this.getAll();
    if (!query) {
      return products;
    }
    
    let q = query.toLowerCase();
    let results = [];
    
    for (let i = 0; i < products.length; i++) {
      let p = products[i];
      let nameMatch = p.name.toLowerCase().includes(q);
      let skuMatch = p.sku.toLowerCase().includes(q);
      
      if (nameMatch === true || skuMatch === true) {
        results.push(p);
      }
    }
    return results;
  }
  
  filter(criteria) {
    let allProducts = this.getAll();
    let filteredProducts = [];
    
    for (let i = 0; i < allProducts.length; i++) {
      let p = allProducts[i];
      let keep = true;
      
      if (criteria.category && criteria.category !== 'all') {
        if (p.category !== criteria.category) {
          keep = false;
        }
      }
      
      if (criteria.status && criteria.status !== 'all') {
        let isLow = false;
        if (p.quantity <= p.minStock && p.quantity > 0) {
          isLow = true;
        }
        
        let isOut = false;
        if (p.quantity === 0) {
          isOut = true;
        }
        
        if (criteria.status === 'in_stock' && isOut === true) {
          keep = false;
        }
        if (criteria.status === 'low_stock' && isLow === false) {
          keep = false;
        }
        if (criteria.status === 'out_of_stock' && isOut === false) {
          keep = false;
        }
      }
      
      if (keep === true) {
        filteredProducts.push(p);
      }
    }
    
    return filteredProducts;
  }
  
  getLowStock() {
    let products = this.getAll();
    let lowStock = [];
    for (let i = 0; i < products.length; i++) {
      let p = products[i];
      if (p.quantity <= p.minStock) {
        lowStock.push(p);
      }
    }
    return lowStock;
  }
  
  getStats() {
    let products = this.getAll();
    let lowStockCount = this.getLowStock().length;
    
    let uniqueCategories = [];
    for (let i = 0; i < products.length; i++) {
      let p = products[i];
      let hasCategory = false;
      for (let j = 0; j < uniqueCategories.length; j++) {
        if (uniqueCategories[j] === p.category) {
          hasCategory = true;
          break;
        }
      }
      if (hasCategory === false) {
        uniqueCategories.push(p.category);
      }
    }
    
    let categoriesCount = uniqueCategories.length;
    let value = utils.calculateInventoryValue(products);
    
    return {
      total: products.length,
      lowStock: lowStockCount,
      value: value,
      categories: categoriesCount
    };
  }
  
  logActivity(type, productName, details) {
    let logs = this.getActivityLog();
    
    let newLog = {
      id: utils.generateUUID(),
      type: type,
      productName: productName,
      details: details,
      timestamp: Date.now()
    };
    
    logs.unshift(newLog);
    
    if (logs.length > 50) {
      logs.length = 50;
    }
    
    localStorage.setItem(this.activityKey, JSON.stringify(logs));
  }
  
  getActivityLog() {
    let logs = localStorage.getItem(this.activityKey);
    if (logs) {
      return JSON.parse(logs);
    } else {
      return [];
    }
  }
}
