const API_BASE_URL = 'https://namaste-backend-e64a.onrender.com/api';
const ADMIN_TOKEN_KEY = 'namasteAdminToken';

async function adminFetch(url, options = {}) {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${token || ''}`);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    let response;
    try {
        response = await fetch(url, { ...options, headers, signal: controller.signal });
    } finally {
        clearTimeout(timeout);
    }

    if (response.status === 401) {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        localStorage.removeItem('namasteAdminLoginId');
        window.location.replace('login.html');
    }

    return response;
}

// Initialize Admin Panel
document.addEventListener('DOMContentLoaded', function() {
    if (!localStorage.getItem(ADMIN_TOKEN_KEY)) {
        window.location.replace('login.html');
        return;
    }
    setupMenuLinks();
    setupProductForm();
    document.getElementById('refresh-print-queue')?.addEventListener('click', loadPrintQueue);
    loadDashboard();
    loadPrintQueue();
    setTimeout(loadPrintQueue, 2000);
    setInterval(loadPrintQueue, 15000);
});

// Setup Menu Links
function setupMenuLinks() {
    const menuLinks = document.querySelectorAll('.menu-link');
    menuLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            menuLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
            
            // Hide all pages
            const pages = document.querySelectorAll('.page');
            pages.forEach(p => p.classList.remove('active'));
            
            // Show selected page
            const pageName = this.dataset.page;
            const page = document.getElementById(pageName);
            if (page) {
                page.classList.add('active');
                
                // Load page content
                if (pageName === 'products') {
                    loadProducts();
                } else if (pageName === 'orders') {
                    loadOrders();
                } else if (pageName === 'analytics') {
                    loadAnalytics();
                } else if (pageName === 'print-queue') {
                    loadPrintQueue();
                }
            }
        });
    });
}

// Load Dashboard
function loadDashboard() {
    // Placeholder data
    const stats = {
        totalSales: 0,
        products: 0,
        orders: 0,
        customers: 0
    };
    
    // Update stat cards (in real app, fetch from API)
    document.querySelectorAll('.stat-value').forEach((el, index) => {
        const values = [stats.totalSales, stats.products, stats.orders, stats.customers];
        el.textContent = values[index];
    });
}

// Setup Product Form
function setupProductForm() {
    const form = document.getElementById('product-form');
    form?.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('product-name').value,
            description: document.getElementById('product-description').value,
            price: parseFloat(document.getElementById('product-price').value),
            category: document.getElementById('product-category').value,
            active: true
        };
        
        try {
            const response = await adminFetch(`${API_BASE_URL}/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            if (response.ok) {
                showToast('Product added successfully');
                closeProductModal();
                form.reset();
                loadProducts();
            } else {
                showToast('Error adding product', true);
            }
        } catch (error) {
            console.error('Error:', error);
            showToast('Error occurred', true);
        }
    });
}

// Load Products
async function loadProducts() {
    try {
        const response = await adminFetch(`${API_BASE_URL}/products`);
        const products = await response.json();
        
        const tbody = document.getElementById('products-tbody');
        tbody.innerHTML = '';
        
        if (products.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No products found</td></tr>';
            return;
        }
        
        products.forEach((product, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${product.name}</td>
                <td>₹${product.price}</td>
                <td>${product.category}</td>
                <td><span class="status-badge status-${product.active ? 'active' : 'inactive'}">
                    ${product.active ? 'Active' : 'Inactive'}
                </span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="editProduct('${product._id}')">Edit</button>
                        <button class="btn-delete" onclick="deleteProduct('${product._id}')">Delete</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading products:', error);
        showToast('Error loading products', true);
    }
}

// Load Orders
async function loadOrders() {
    try {
        const response = await adminFetch(`${API_BASE_URL}/orders`);
        const orders = await response.json();
        
        const tbody = document.getElementById('orders-tbody');
        tbody.innerHTML = '';
        
        if (!orders || orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">No orders found</td></tr>';
            return;
        }
        
        orders.forEach(order => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${order.orderId}</td>
                <td>${order.customerEmail}</td>
                <td>₹${order.amount}</td>
                <td><span class="status-badge status-${order.status}">
                    ${order.status}
                </span></td>
                <td>${new Date(order.createdAt).toLocaleDateString('hi-IN')}</td>
                <td>
                    <button class="btn-edit" onclick="viewOrder('${order._id}')">View</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    } catch (error) {
        console.error('Error loading orders:', error);
        showToast('Error loading orders', true);
    }
}

// Load Print Queue
async function loadPrintQueue() {
    const tbody = document.getElementById('print-queue-tbody');
    const updated = document.getElementById('queue-last-updated');
    try {
        if (tbody) tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;">Loading customer print orders...</td></tr>';
        const response = await adminFetch(`${API_BASE_URL}/print-orders/queue`);
        if (!response.ok) throw new Error(`Queue request failed (${response.status})`);
        const orders = await response.json();
        if (!tbody) return;

        if (!orders || orders.length === 0) {
            tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;">No customer print orders yet.</td></tr>';
            if (updated) updated.textContent = `Updated ${new Date().toLocaleTimeString()}`;
            return;
        }

        tbody.innerHTML = orders.map(order => `
            <tr>
                <td>${order.tokenId || '#PRNT'}</td>
                <td><strong>${order.studentName || 'Unknown'}</strong><small class="customer-meta">${order.tokenId || ''}</small></td>
                <td>${order.mobile || '-'}</td>
                <td>${order.rollNumber || '-'} / ${order.department || '-'}</td>
                <td><span class="file-name">${order.fileName || 'No file'}</span></td>
                <td>${order.colorMode === 'color' ? 'Color' : 'B&W'} · ${order.sides === 'double' ? 'Double' : 'Single'} · ${order.orientation || 'Auto'}</td>
                <td>${order.totalPages || 1}</td>
                <td>${order.copies || 1}</td>
                <td>₹${order.totalAmount || 0}</td>
                <td>
                    <small class="payment-utr">${order.paymentMethod === 'cod' ? 'Cash on Delivery' : (order.upiTransactionId || 'No UTR')}</small>
                    ${order.paymentProofPath ? `<a href="${API_BASE_URL}/print-orders/${encodeURIComponent(order._id || order.tokenId)}/payment-proof?token=${encodeURIComponent(localStorage.getItem(ADMIN_TOKEN_KEY) || '')}" target="_blank" rel="noopener" class="payment-proof-link">View Proof</a>` : '<small class="payment-utr">No proof</small>'}
                    <select class="payment-status-select" data-id="${order._id || order.tokenId}">
                        <option value="pending" ${(order.paymentStatus || 'pending') === 'pending' ? 'selected' : ''}>Pending</option>
                        <option value="paid" ${order.paymentStatus === 'paid' ? 'selected' : ''}>Paid</option>
                        <option value="rejected" ${order.paymentStatus === 'rejected' ? 'selected' : ''}>Rejected</option>
                    </select>
                </td>
                <td>
                    <select class="status-select" data-id="${order._id}" data-current="${order.status}">
                        <option value="queued" ${order.status === 'queued' ? 'selected' : ''}>Queued</option>
                        <option value="printing" ${order.status === 'printing' ? 'selected' : ''}>Printing</option>
                        <option value="late_printing" ${order.status === 'late_printing' ? 'selected' : ''}>Late Printing</option>
                        <option value="ready_for_pickup" ${order.status === 'ready_for_pickup' ? 'selected' : ''}>Ready for Pickup</option>
                        <option value="collected" ${order.status === 'collected' ? 'selected' : ''}>Collected</option>
                    </select>
                </td>
                <td>
                    <a href="${API_BASE_URL}/print-orders/${encodeURIComponent(order._id || order.tokenId)}/file?token=${encodeURIComponent(localStorage.getItem(ADMIN_TOKEN_KEY) || '')}" target="_blank" rel="noopener" class="btn-edit" ${order.filePath ? '' : 'onclick="return false;"'}>${order.filePath ? 'View File' : 'No File'}</a>
                    <button type="button" class="custom-notify-btn" data-mobile="${encodeURIComponent(order.mobile || '')}" data-name="${encodeURIComponent(order.studentName || 'customer')}" data-token="${encodeURIComponent(order.tokenId || '')}">Custom Notify</button>
                </td>
            </tr>
        `).join('');
        if (updated) updated.textContent = `Updated ${new Date().toLocaleTimeString()}`;

        document.querySelectorAll('.status-select').forEach(select => {
            select.addEventListener('change', async function() {
                const id = this.dataset.id;
                const status = this.value;
                try {
                    const response = await adminFetch(`${API_BASE_URL}/print-orders/${id}/status`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status })
                    });
                    if (!response.ok) {
                        const data = await response.json();
                        throw new Error(data.message || 'Unable to update queue');
                    }
                    showToast('Queue status updated');
                    loadPrintQueue();
                } catch (error) {
                    showToast(error.message || 'Unable to update queue', true);
                    loadPrintQueue();
                }
            });
        });

        document.querySelectorAll('.payment-status-select').forEach(select => {
            select.addEventListener('change', async function() {
                try {
                    const response = await adminFetch(`${API_BASE_URL}/print-orders/${encodeURIComponent(this.dataset.id)}/payment-status`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ paymentStatus: this.value })
                    });
                    if (!response.ok) throw new Error('Payment status update failed');
                    showToast(`Payment marked ${this.value}`);
                    loadPrintQueue();
                } catch (error) {
                    showToast('Unable to update payment status', true);
                }
            });
        });

        document.querySelectorAll('.custom-notify-btn').forEach(button => {
            button.addEventListener('click', () => {
                const mobile = decodeURIComponent(button.dataset.mobile || '').replace(/\D/g, '');
                const name = decodeURIComponent(button.dataset.name || 'customer');
                const token = decodeURIComponent(button.dataset.token || '');
                if (!mobile) {
                    showToast('This order has no mobile number', true);
                    return;
                }

                const message = window.prompt(
                    `Message for ${name} (${token})`,
                    `Hello ${name}, your print order ${token} is delayed. We will update you when it is ready.`
                );
                if (message === null || !message.trim()) return;

                const whatsappNumber = mobile.length === 10 ? `91${mobile}` : mobile;
                window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message.trim())}`, '_blank', 'noopener');
            });
        });
    } catch (error) {
        console.error('Error loading print queue:', error);
        if (tbody) tbody.innerHTML = '<tr><td colspan="12" style="text-align:center;color:#b42318;">Unable to load orders. <button type="button" class="btn-edit" onclick="loadPrintQueue()">Try again</button></td></tr>';
        if (updated) updated.textContent = 'Update failed';
    }
}

// Load Analytics
function loadAnalytics() {
    // This would typically load chart data from the API
    console.log('Loading analytics...');
}

// Open Add Product Modal
function openAddProductModal() {
    document.getElementById('modal-title').textContent = 'Add Product';
    document.getElementById('product-modal').classList.add('show');
}

// Close Product Modal
function closeProductModal() {
    document.getElementById('product-modal').classList.remove('show');
    document.getElementById('product-form').reset();
}

// Edit Product
function editProduct(productId) {
    document.getElementById('modal-title').textContent = 'Edit Product';
    document.getElementById('product-modal').classList.add('show');
    // Load product data and populate form
}

// Delete Product
async function deleteProduct(productId) {
    if (!confirm('Are you sure?')) return;
    
    try {
        const response = await adminFetch(`${API_BASE_URL}/products/${productId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showToast('Product deleted successfully');
            loadProducts();
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('त्रुटि | Error occurred', true);
    }
}

// View Order
function viewOrder(orderId) {
    alert('Order Details: ' + orderId);
}

// Save Settings
function saveSettings() {
    const settings = {
        razorpayKeyId: document.getElementById('razorpay-key-id').value,
        razorpayKeySecret: document.getElementById('razorpay-key-secret').value,
        mongodbUri: document.getElementById('mongodb-uri').value
    };
    
    // Save to localStorage (in real app, send to backend)
    localStorage.setItem('namasteSettings', JSON.stringify(settings));
    showToast('Settings saved successfully');
}

// Logout
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem(ADMIN_TOKEN_KEY);
        localStorage.removeItem('namasteAdminLoginId');
        window.location.href = 'login.html';
    }
}

// Show Toast Notification
function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: ${isError ? '#EF4444' : '#10B981'};
        color: white;
        padding: 15px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        z-index: 2000;
        animation: slideInRight 0.3s ease forwards;
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Add animation style
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);
