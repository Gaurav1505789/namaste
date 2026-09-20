// API Configuration
const API_BASE_URL = 'https://namaste-backend-e64a.onrender.com/api';
const RAZORPAY_KEY_ID = 'your_razorpay_key_id'; // Update this from backend
const PRINT_UPI_ID = '8969292024@ptyes';

// Sample Products Data
const sampleProducts = [
    {
        id: 1,
        name: 'Pink Kawaii Notepad',
        description: 'Cute pink kawaii digital notepad with heart designs',
        price: 299,
        category: 'notebooks',
        image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=300&fit=crop'
    },
    {
        id: 2,
        name: 'Horror Ghostface Notepad',
        description: 'Dark themed horror notepad with ghostface design',
        price: 249,
        category: 'notebooks',
        image: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=400&h=300&fit=crop'
    },
    {
        id: 3,
        name: 'Hello Kitty Notepad',
        description: 'Adorable Hello Kitty themed digital notepad',
        price: 279,
        category: 'character',
        image: 'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop'
    },
    {
        id: 4,
        name: 'Disney Kawaii Notepad',
        description: 'Magical Disney character themed digital notepad',
        price: 299,
        category: 'character',
        image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop'
    },
    {
        id: 5,
        name: 'Astronauta Digital Planner',
        description: 'Space themed digital planner with astronaut designs',
        price: 349,
        category: 'planners',
        image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&h=300&fit=crop'
    },
    {
        id: 6,
        name: 'Snoopy Love Diary 💕',
        description: 'Cute Snoopy themed love diary — illustrated cover, 120 lined pages',
        price: 329,
        category: 'diaries',
        image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=400&h=300&fit=crop'
    },
    {
        id: 7,
        name: 'Floral Dream Diary 🌸',
        description: 'Watercolour floral diary cover with monthly spreads and habit tracker',
        price: 359,
        category: 'diaries',
        image: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&h=300&fit=crop'
    },
    {
        id: 8,
        name: 'Galaxy Journal Diary ✨',
        description: 'Deep-space galaxy diary with creative writing prompts and art pages',
        price: 379,
        category: 'diaries',
        image: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?w=400&h=300&fit=crop'
    },
    {
        id: 9,
        name: 'Botanical Sketchbook 🌿',
        description: 'Creative botanical art diary with blank pages for sketching & painting',
        price: 399,
        category: 'diaries',
        image: 'https://images.unsplash.com/photo-1490750967868-88df5691cc84?w=400&h=300&fit=crop'
    },
    {
        id: 10,
        name: 'Teddy Bear Mini Notebook',
        description: 'Adorable teddy bear themed cute mini notebook',
        price: 199,
        category: 'stationery',
        image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop'
    },
    {
        id: 11,
        name: 'Premium Stationery Pack',
        description: 'Complete stationery collection with 5+ design options',
        price: 399,
        category: 'stationery',
        image: 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=400&h=300&fit=crop'
    },
    {
        id: 12,
        name: 'Crystal Cube 💎',
        description: '3D printable crystal cube — STL file included, glows under UV light',
        price: 449,
        category: '3dmodels',
        image: 'https://images.unsplash.com/photo-1558591710-4b4a1ae0f665?w=400&h=300&fit=crop',
        model3d: { type: 'cube', color: 0x7eceff }
    },
    {
        id: 13,
        name: 'Rose Flower Vase 🌹',
        description: '3D printable elegant rose vase — perfect home decor gift',
        price: 499,
        category: '3dmodels',
        image: 'https://images.unsplash.com/photo-1490750967868-88df5691cc84?w=400&h=300&fit=crop',
        model3d: { type: 'torus', color: 0xff6b9d }
    },
    {
        id: 14,
        name: 'Moon Lamp 🌙',
        description: '3D printable moon surface lamp — STL file with hollow interior for LED',
        price: 549,
        category: '3dmodels',
        image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=400&h=300&fit=crop',
        model3d: { type: 'sphere', color: 0xf5deb3 }
    }
];

let currentCategory = 'all';
let currentPaymentData = null;

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadProducts();
    setupCategoryButtons();
    setupContactForm();
    setupPrintOrderUI();
});

// Load Products
function loadProducts(category = 'all') {
    const grid = document.getElementById('products-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const filtered = category === 'all' 
        ? sampleProducts 
        : sampleProducts.filter(p => p.category === category);

    if (filtered.length === 0) {
        grid.innerHTML = '<p class="loading">कोई उत्पाद नहीं मिला | No products found</p>';
        return;
    }

    filtered.forEach(product => {
        const card = createProductCard(product);
        grid.appendChild(card);
    });
}

// Create Product Card
function createProductCard(product) {
    const card = document.createElement('div');
    card.className = 'product-card';
    const badge = product.category === '3dmodels' ? '<span class="badge-3d">🧊 3D</span>' : '';
    const actionBtn = product.model3d
        ? `<div class="product-actions">
             <button class="product-btn btn-view3d" onclick="open3DViewer(${product.id})">View 3D</button>
             <button class="product-btn" onclick="buyProduct(${product.id}, '${product.name}', ${product.price})">Buy Now</button>
           </div>`
        : `<button class="product-btn" onclick="buyProduct(${product.id}, '${product.name}', ${product.price})">Buy Now</button>`;
    card.innerHTML = `
        <div class="product-img-wrap">
            <img src="${product.image}" alt="${product.name}" class="product-image" loading="lazy">
            ${badge}
        </div>
        <div class="product-info">
            <h3 class="product-name">${product.name}</h3>
            <p class="product-description">${product.description}</p>
            <div class="product-price">₹${product.price}</div>
            ${actionBtn}
        </div>
    `;
    return card;
}

// Setup Category Buttons
function setupCategoryButtons() {
    const buttons = document.querySelectorAll('.category-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', function() {
            buttons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            currentCategory = this.dataset.category;
            loadProducts(currentCategory);
        });
    });
}

// Buy Product
function buyProduct(productId, productName, price) {
    currentPaymentData = {
        productId,
        productName,
        price
    };
    
    const details = document.getElementById('payment-details');
    details.innerHTML = `
        <p><strong>Product:</strong> <span>${productName}</span></p>
        <p><strong>Price:</strong> <span>₹${price}</span></p>
        <p><strong>Email:</strong> <span><input type="email" id="customer-email" placeholder="your@email.com" required></span></p>
        <p><strong>Name:</strong> <span><input type="text" id="customer-name" placeholder="Your Name" required></span></p>
        <p><strong>Phone:</strong> <span><input type="tel" id="customer-phone" placeholder="10 digit mobile" required></span></p>
    `;
    
    document.getElementById('payment-modal').classList.add('show');
}

// Close Payment Modal
function closePaymentModal() {
    document.getElementById('payment-modal').classList.remove('show');
}

// Close Success Modal
function closeSuccessModal() {
    document.getElementById('success-modal').classList.remove('show');
}

// Make Payment
document.getElementById('pay-btn')?.addEventListener('click', function() {
    const email = document.getElementById('customer-email').value;
    const name = document.getElementById('customer-name').value;
    const phone = document.getElementById('customer-phone').value;

    if (!email || !name || !phone) {
        showToast('Please fill all details', true);
        return;
    }

    initializeRazorpay(email, name, phone);
});

// Initialize Razorpay Payment
async function initializeRazorpay(email, name, phone) {
    try {
        const response = await fetch(`${API_BASE_URL}/payments/create-order`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                amount: currentPaymentData.price,
                productId: currentPaymentData.productId,
                customerEmail: email,
                customerName: name,
                customerPhone: phone
            })
        });

        const data = await response.json();

        const options = {
            key: RAZORPAY_KEY_ID,
            amount: data.amount,
            currency: data.currency,
            order_id: data.orderId,
            handler: function(response) {
                verifyPayment(response, email);
            },
            prefill: {
                name: name,
                email: email,
                contact: phone
            },
            theme: {
                color: '#FF6B35'
            },
            notes: {
                productName: currentPaymentData.productName
            }
        };

        const rzp = new Razorpay(options);
        rzp.open();
    } catch (error) {
        console.error('Payment initialization error:', error);
        showToast('भुगतान शुरू करने में त्रुटि | Error initializing payment', true);
    }
}

// Verify Payment
async function verifyPayment(paymentResponse, email) {
    try {
        const response = await fetch(`${API_BASE_URL}/payments/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                razorpay_order_id: paymentResponse.razorpay_order_id,
                razorpay_payment_id: paymentResponse.razorpay_payment_id,
                razorpay_signature: paymentResponse.razorpay_signature
            })
        });

        const data = await response.json();

        if (data.success) {
            closePaymentModal();
            showSuccessModal(currentPaymentData.productName, data.downloadToken);
            showToast('Payment successful!');
        } else {
            showToast('Payment verification failed', true);
        }
    } catch (error) {
        console.error('Payment verification error:', error);
        showToast('Error verifying payment', true);
    }
}

// Show Success Modal
function showSuccessModal(productName, downloadToken) {
    const modal = document.getElementById('success-modal');
    const link = document.getElementById('download-link');
    
    link.href = `${API_BASE_URL}/products/download/${downloadToken}`;
    link.textContent = `Download ${productName}`;
    
    modal.classList.add('show');
}

// Setup Contact Form
function setupContactForm() {
    const form = document.querySelector('.contact-form');
    form?.addEventListener('submit', function(e) {
        e.preventDefault();
        showToast('Thank you! We\'ll contact you soon');
        form.reset();
    });
}

function setupPrintOrderUI() {
    const printCard = document.getElementById('unlimited-prints-card');
    const printModal = document.getElementById('print-order-modal');
    const closePrintOrder = document.getElementById('close-print-order');
    const fileInput = document.getElementById('print-file-input');
    const chooseFileBtn = document.getElementById('choose-file-btn');
    const dropzone = document.getElementById('file-dropzone');
    const copiesInput = document.getElementById('copies');
    const pageRangeInput = document.getElementById('page-range');
    const manualPageCount = document.getElementById('manual-page-count');
    const upiPayLink = document.getElementById('upi-pay-link');
    const codPaymentBox = document.getElementById('cod-payment-box');
    const paymentMethodInputs = document.querySelectorAll('input[name="printPaymentMethod"]');

    const updatePaymentMethodUI = () => {
        const method = document.querySelector('input[name="printPaymentMethod"]:checked')?.value || 'upi';
        const isCod = method === 'cod';
        codPaymentBox?.classList.toggle('hidden', !isCod);
        document.querySelector('.upi-payment-box')?.classList.toggle('hidden', isCod);
    };

    paymentMethodInputs.forEach(input => input.addEventListener('change', updatePaymentMethodUI));
    updatePaymentMethodUI();
    upiPayLink?.addEventListener('click', () => {
        const amount = document.getElementById('price-total')?.textContent.replace(/[^0-9.]/g, '') || '0';
        upiPayLink.href = `paytmmp://pay?pa=${encodeURIComponent(PRINT_UPI_ID)}&pn=Namaste%20Campus%20Prints&am=${amount}&cu=INR`;
    });

    const openPrintOrder = () => {
        printModal?.classList.add('show');
        printModal?.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
    };

    const closePrintOrderModal = () => {
        closePrintOrderAndReturnHome();
    };

    printCard?.addEventListener('click', openPrintOrder);
    printCard?.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openPrintOrder();
        }
    });
    closePrintOrder?.addEventListener('click', closePrintOrderModal);
    printModal?.addEventListener('click', (event) => {
        if (event.target === printModal) closePrintOrderModal();
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && printModal?.classList.contains('show')) {
            closePrintOrderModal();
        }
    });

    chooseFileBtn?.addEventListener('click', () => fileInput.click());
    fileInput?.addEventListener('change', handleFileSelection);

    ['dragenter', 'dragover'].forEach(type => {
        dropzone?.addEventListener(type, (event) => {
            event.preventDefault();
            dropzone.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(type => {
        dropzone?.addEventListener(type, (event) => {
            event.preventDefault();
            dropzone.classList.remove('dragover');
        });
    });

    dropzone?.addEventListener('drop', (event) => {
        const file = event.dataTransfer.files[0];
        if (file) {
            fileInput.files = event.dataTransfer.files;
            handleFileSelection({ target: { files: [file] } });
        }
    });

    document.querySelectorAll('input[name="colorMode"]').forEach(radio => {
        radio.addEventListener('change', updatePrintPrice);
    });

    document.querySelectorAll('.step-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.target;
            const input = document.getElementById(target);
            const current = Number(input.value || 1);
            const next = btn.dataset.action === 'plus' ? current + 1 : Math.max(1, current - 1);
            input.value = next;
            updatePrintPrice();
        });
    });

    copiesInput?.addEventListener('input', updatePrintPrice);
    pageRangeInput?.addEventListener('input', updatePrintPrice);
    manualPageCount?.addEventListener('input', updatePrintPrice);

    document.getElementById('submit-print-order')?.addEventListener('click', submitPrintOrder);
    updatePrintPrice();
}

async function handleFileSelection(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const allowed = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    const valid = allowed.includes(file.type) || ['pdf', 'jpg', 'jpeg', 'png'].includes(ext);

    if (!valid) {
        showToast('Only PDF, JPG, JPEG, PNG files are allowed.', true);
        return;
    }

    if (file.size > 25 * 1024 * 1024) {
        showToast('File size must be under 25MB.', true);
        return;
    }

    let pageCount = 1;
    if (file.type === 'application/pdf' || ext === 'pdf') {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdfLib = window.PDFLib;
            if (pdfLib) {
                const pdfDoc = await pdfLib.PDFDocument.load(arrayBuffer);
                pageCount = pdfDoc.getPageCount();
            }
        } catch (error) {
            console.error('PDF page count detection failed', error);
        }
    }

    const preview = document.getElementById('file-preview');
    const safeName = file.name.length > 28 ? file.name.slice(0, 25) + '...' : file.name;
    preview.innerHTML = `
        <div class="preview-file">
            <span class="preview-icon">${ext === 'pdf' ? '📄' : '🖼️'}</span>
            <div>
                <strong>${safeName}</strong>
                <small>${(file.size / 1024 / 1024).toFixed(2)} MB • ${ext.toUpperCase()}</small>
            </div>
        </div>
    `;
    preview.classList.remove('hidden');

    const fileState = {
        fileName: file.name,
        fileSize: file.size,
        fileType: ext || file.type,
        pageCount
    };

    document.getElementById('page-range').dataset.pageCount = String(pageCount);
    updatePrintPrice();
    window.__printFileState = fileState;
}

function updatePrintPrice() {
    const pageRangeInput = document.getElementById('page-range');
    const manualPageCount = document.getElementById('manual-page-count');
    const pagesInput = Number(pageRangeInput.dataset.pageCount || manualPageCount?.value || 1);
    const basePages = pagesInput > 1 ? pagesInput : 1;
    const rate = document.querySelector('input[name="colorMode"]:checked')?.value === 'color' ? 5 : 3;
    const copies = Number(document.getElementById('copies')?.value || 1);
    const totalPages = basePages * copies;
    const total = totalPages * rate;

    document.getElementById('price-pages').textContent = String(basePages);
    document.getElementById('price-rate').textContent = `₹${rate}`;
    document.getElementById('price-copies').textContent = String(copies);
    document.getElementById('price-total').textContent = `₹${total}`;

    if (!pageRangeInput.value || pageRangeInput.value.trim() === '' || pageRangeInput.value === 'All Pages') {
        pageRangeInput.value = 'All Pages';
    }
}

async function submitPrintOrder() {
    const studentName = document.getElementById('student-name').value.trim();
    const phone = document.getElementById('student-phone').value.trim();
    const fileState = window.__printFileState;

    if (!studentName || !phone || !fileState) {
        showToast('Please fill student details and upload a file.', true);
        return;
    }

    try {
        const colorMode = document.querySelector('input[name="colorMode"]:checked')?.value || 'bw';
        const sides = document.querySelector('input[name="sides"]:checked')?.value || 'single';
        const orientation = document.querySelector('input[name="orientation"]:checked')?.value || 'auto';
        const copies = Number(document.getElementById('copies').value || 1);
        const pageRange = document.getElementById('page-range').value || 'All Pages';
        const rate = colorMode === 'color' ? 5 : 3;
        const pageCount = Number(document.getElementById('page-range').dataset.pageCount || document.getElementById('manual-page-count').value || 1);
        const totalPages = pageCount > 0 ? pageCount : 1;
        const amount = totalPages * rate * copies;
        const paymentMethod = document.querySelector('input[name="printPaymentMethod"]:checked')?.value || 'upi';
        const upiTransactionId = document.getElementById('upi-transaction-id').value.trim();
        if (paymentMethod === 'upi' && !upiTransactionId) {
            throw new Error('Pay using UPI and enter the transaction ID / UTR before submitting.');
        }
        const paymentProof = document.getElementById('payment-proof-input')?.files?.[0];
        if (paymentMethod === 'upi' && !paymentProof) {
            throw new Error('Upload your payment confirmation screenshot before submitting.');
        }
        if (paymentMethod === 'upi' && !['image/jpeg', 'image/png', 'image/webp'].includes(paymentProof.type)) {
            throw new Error('Payment confirmation must be a JPG, PNG, or WEBP image.');
        }
        if (paymentMethod === 'upi' && paymentProof.size > 10 * 1024 * 1024) {
            throw new Error('Payment confirmation screenshot must be under 10MB.');
        }

        const uploadForm = new FormData();
        uploadForm.append('file', document.getElementById('print-file-input').files[0]);
        const uploadResponse = await fetch(`${API_BASE_URL}/print-orders/upload`, { method: 'POST', body: uploadForm });
        const uploadData = await uploadResponse.json();
        if (!uploadResponse.ok) throw new Error(uploadData.message || 'Upload failed');

        let paymentProofData = {};
        if (paymentMethod === 'upi') {
            const proofForm = new FormData();
            proofForm.append('paymentProof', paymentProof);
            const proofResponse = await fetch(`${API_BASE_URL}/print-orders/upload`, { method: 'POST', body: proofForm });
            paymentProofData = await proofResponse.json();
            if (!proofResponse.ok) throw new Error(paymentProofData.message || 'Payment proof upload failed');
        }

        const payload = {
            studentName, mobile: phone,
            rollNumber: document.getElementById('student-roll').value,
            department: document.getElementById('student-roll').value,
            colorMode, sides, orientation, copies, totalPages, pageRange,
            specialInstructions: document.getElementById('special-instructions').value,
            fileName: uploadData.fileName, filePath: uploadData.filePath,
            fileType: uploadData.fileType, fileSize: uploadData.fileSize,
            paymentProofFileName: paymentProofData.fileName || '',
            paymentProofPath: paymentProofData.filePath || '',
            paymentProofFileType: paymentProofData.fileType || '',
            paymentProofFileSize: paymentProofData.fileSize || 0,
            totalAmount: amount, paymentMethod,
            upiTransactionId: paymentMethod === 'upi' ? upiTransactionId : '', paymentStatus: 'pending'
        };

        const orderResponse = await fetch(`${API_BASE_URL}/print-orders`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        const orderData = await orderResponse.json();
        if (!orderResponse.ok) throw new Error(orderData.message || 'Order creation failed');
        showPrintSuccessModal(orderData.tokenId, studentName, phone, amount, 'pending');
    } catch (error) {
        console.error(error);
        showToast(error.message || 'Error submitting print order', true);
    }
}

function showPrintSuccessModal(tokenId, studentName, phone, amount, paymentStatus = 'paid') {
    closePrintOrderAndReturnHome();
    const receipt = document.createElement('div');
    receipt.className = 'modal show';
    receipt.innerHTML = `
        <div class="modal-content success-content">
            <button type="button" class="modal-close-btn receipt-close" onclick="this.parentElement.parentElement.remove(); closePrintOrderAndReturnHome();" aria-label="Close receipt and return to home" title="Back to Home">
                <svg class="close-icon-svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
            <h2>✅ Print Order Submitted</h2>
            <p><strong>Pickup Token:</strong> ${tokenId}</p>
            <p><strong>Student:</strong> ${studentName}</p>
            <p><strong>Phone:</strong> ${phone}</p>
            <p><strong>Total:</strong> ₹${amount}</p>
            <p>${paymentStatus === 'pending' ? 'UPI payment is pending admin verification. Printing starts after approval.' : 'Ready for Pickup in ~10 mins. Show this token at the campus shop.'}</p>
            <button class="btn btn-primary" onclick="window.print()">Print Receipt</button>
        </div>
    `;
    document.body.appendChild(receipt);
    showToast(`Print order created: ${tokenId}`);
}

function closePrintOrderAndReturnHome() {
    const printModal = document.getElementById('print-order-modal');
    printModal?.classList.remove('show');
    printModal?.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    const homeSection = document.getElementById('home') || document.querySelector('.navbar');
    if (homeSection) homeSection.scrollIntoView({ behavior: 'smooth' });
}

// Scroll to Categories
function scrollToCategories() {
    const printService = document.querySelector('.campus-print-service');
    if (printService) printService.scrollIntoView({ behavior: 'smooth' });
}

// Show Toast Notification
function showToast(message, isError = false) {
    const toast = document.createElement('div');
    toast.className = `toast ${isError ? 'error' : ''}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ---- 3D Viewer ----
let threeRenderer, threeScene, threeCamera, threeMesh, threeAnim;
let isDragging = false, prevMouse = {};

function open3DViewer(productId) {
    const product = sampleProducts.find(p => p.id === productId);
    if (!product || !product.model3d) return;

    document.getElementById('viewer-title').textContent = product.name;
    document.getElementById('viewer-buy-btn').onclick = () => {
        closeViewerModal();
        buyProduct(product.id, product.name, product.price);
    };

    document.getElementById('viewer-modal').classList.add('show');
    initThreeJS(product.model3d);
}

function closeViewerModal() {
    document.getElementById('viewer-modal').classList.remove('show');
    if (threeAnim) { cancelAnimationFrame(threeAnim); threeAnim = null; }
    if (threeRenderer) { threeRenderer.dispose(); threeRenderer = null; }
}

function initThreeJS({ type, color }) {
    const canvas = document.getElementById('three-canvas');
    if (threeRenderer) { threeRenderer.dispose(); }

    threeRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    threeRenderer.setSize(320, 260);
    threeRenderer.setPixelRatio(window.devicePixelRatio);

    threeScene = new THREE.Scene();
    threeCamera = new THREE.PerspectiveCamera(45, 320 / 260, 0.1, 100);
    threeCamera.position.set(0, 0, 4);

    threeScene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 1);
    dir.position.set(5, 5, 5);
    threeScene.add(dir);

    const mat = new THREE.MeshPhongMaterial({ color, shininess: 90 });
    let geo;
    if (type === 'cube')   geo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
    else if (type === 'torus')  geo = new THREE.TorusGeometry(0.9, 0.35, 16, 60);
    else                   geo = new THREE.SphereGeometry(1.2, 32, 32);

    threeMesh = new THREE.Mesh(geo, mat);
    threeScene.add(threeMesh);

    // Drag to rotate
    canvas.onmousedown = e => { isDragging = true; prevMouse = { x: e.clientX, y: e.clientY }; };
    canvas.onmousemove = e => {
        if (!isDragging) return;
        threeMesh.rotation.y += (e.clientX - prevMouse.x) * 0.01;
        threeMesh.rotation.x += (e.clientY - prevMouse.y) * 0.01;
        prevMouse = { x: e.clientX, y: e.clientY };
    };
    canvas.onmouseup = () => { isDragging = false; };

    (function animate() {
        threeAnim = requestAnimationFrame(animate);
        if (!isDragging) threeMesh.rotation.y += 0.008;
        threeRenderer.render(threeScene, threeCamera);
    })();
}

// Add animation to CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideOutRight {
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);
