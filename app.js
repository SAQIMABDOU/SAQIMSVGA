import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, get, set, push } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDe-I_yBX3T1oGmKB3FdmK4kRnR-s-c6Pw",
  authDomain: "saqim-svga-stor.firebaseapp.com",
  databaseURL: "https://saqim-svga-stor-default-rtdb.firebaseio.com",
  projectId: "saqim-svga-stor",
  storageBucket: "saqim-svga-stor.firebasestorage.app",
  messagingSenderId: "355711087347",
  appId: "1:355711087347:web:4135b774d3d6e7aad7fd86",
  measurementId: "G-KHKR569DBH"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);
const auth = getAuth(app);

const productsGrid = document.getElementById('productsGrid');
const productModal = document.getElementById('productModal');
const closeModal = document.getElementById('closeModal');
const modalVideoSource = document.getElementById('modalVideoSource');
const modalVideo = document.getElementById('modalVideo');
const modalProdImg = document.getElementById('modalProdImg');
const modalProdTitle = document.getElementById('modalProdTitle');
const modalProdNo = document.getElementById('modalProdNo');
const modalProdTag = document.getElementById('modalProdTag');
const modalDuration = document.getElementById('modalDuration');
const modalPrice = document.getElementById('modalPrice');
const addToCartBtn = document.getElementById('addToCartBtn');
const relatedGrid = document.getElementById('relatedGrid');
const filterBtns = document.querySelectorAll('.filter-btn');
const homeBannersContainer = document.getElementById('homeBannersContainer');

const openCartBtn = document.getElementById('openCartBtn');
const cartModal = document.getElementById('cartModal');
const closeCartModal = document.getElementById('closeCartModal');
const cartCount = document.getElementById('cartCount');
const cartItemsList = document.getElementById('cartItemsList');
const checkoutForm = document.getElementById('checkoutForm');
const clientEmail = document.getElementById('clientEmail');
const countryCode = document.getElementById('countryCode');
const clientPhone = document.getElementById('clientPhone');

let allProducts = [];
let cartItems = [];
let currentProduct = null;
let currentUser = null;

// --- Custom Aniq Toast Notification with Fixed Auto-Dismiss ---
let toastTimer = null;

window.showToast = function(title, message, type = "success") {
    const toast = document.getElementById('customToast');
    const toastTitle = document.getElementById('toastTitle');
    const toastMsg = document.getElementById('toastMsg');
    const toastIcon = document.getElementById('toastIcon');

    if (toast && toastMsg) {
        toastTitle.textContent = title || "Notice";
        toastMsg.textContent = message;
        
        if (type === "error") {
            toast.className = "error show";
            if (toastIcon) toastIcon.className = "fa-solid fa-triangle-exclamation";
        } else {
            toast.className = "show";
            if (toastIcon) toastIcon.className = "fa-solid fa-circle-check";
        }

        // إلغاء أي مؤقت سابق باش ما يبقاش الإشعار معلق
        if (toastTimer) clearTimeout(toastTimer);

        // إخفاء الإشعار تلقائياً بعد 3 ثواني بالضبط
        toastTimer = setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
};

// Track Auth State & Load Persistent Cart from Firebase Database
onAuthStateChanged(auth, async (user) => {
    const loginBtn = document.querySelector('.login-btn');
    if (user) {
        currentUser = user;
        if (loginBtn) {
            loginBtn.textContent = user.displayName || user.email.split('@')[0];
            loginBtn.style.background = "#252ed3";
            loginBtn.setAttribute('href', '#');
        }
        await loadUserCart(user.uid);
    } else {
        currentUser = null;
        cartItems = [];
        updateCartUI();
        if (loginBtn) {
            loginBtn.textContent = "Login";
            loginBtn.style.background = "#4f46e5";
            loginBtn.setAttribute('href', 'login.html');
        }
    }
});

async function loadUserCart(userId) {
    try {
        const cartRef = ref(db, `carts/${userId}`);
        const snap = await get(cartRef);
        cartItems = snap.exists() ? (snap.val() || []) : [];
        updateCartUI();
    } catch (error) {
        console.error("Error loading cart:", error);
    }
}

async function saveCartToFirebase() {
    if (currentUser) {
        try {
            const cartRef = ref(db, `carts/${currentUser.uid}`);
            await set(cartRef, cartItems);
        } catch (error) {
            console.error("Error saving cart:", error);
        }
    }
}

// 1. Load Banners Slider
async function loadBanners() {
    try {
        const snap = await get(ref(db, 'banners'));
        if (snap.exists() && homeBannersContainer) {
            homeBannersContainer.innerHTML = "";
            const banners = Object.values(snap.val());
            if (banners.length === 0) return;

            banners.forEach((banner, index) => {
                const a = document.createElement('a');
                a.href = `page.html?slug=${banner.slug}`;
                a.style.display = index === 0 ? "block" : "none";
                a.className = "banner-slide-link";
                
                const img = document.createElement('img');
                img.src = banner.image;
                img.alt = banner.title;
                img.className = "banner-img";
                if (index === 0) img.classList.add("active-banner");

                a.appendChild(img);
                homeBannersContainer.appendChild(a);
            });

            if (banners.length > 1) {
                let currentIndex = 0;
                const slideLinks = homeBannersContainer.querySelectorAll('.banner-slide-link');
                setInterval(() => {
                    slideLinks[currentIndex].style.display = "none";
                    slideLinks[currentIndex].querySelector('img').classList.remove("active-banner");
                    currentIndex = (currentIndex + 1) % slideLinks.length;
                    slideLinks[currentIndex].style.display = "block";
                    slideLinks[currentIndex].querySelector('img').classList.add("active-banner");
                }, 5000);
            }
        }
    } catch (e) {
        console.error("Error loading banners: ", e);
    }
}

// 2. Load Products
async function loadProducts() {
    try {
        const snapshot = await get(ref(db, 'products'));
        if (snapshot.exists()) {
            allProducts = Object.values(snapshot.val());
            renderProducts(allProducts);
        } else if (productsGrid) {
            productsGrid.innerHTML = `<p style="color:#8c90ad; text-align:center; grid-column:1/-1;">No products available.</p>`;
        }
    } catch (error) {
        console.error("Error loading products: ", error);
    }
}

function renderProducts(products) {
    if (!productsGrid) return;
    productsGrid.innerHTML = "";
    if (products.length === 0) {
        productsGrid.innerHTML = `<p style="color:#8c90ad; text-align:center; grid-column: 1/-1; padding:30px;">No products found.</p>`;
        return;
    }

    products.forEach(prod => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-img-container">
                <img src="${prod.image}" alt="${prod.title}" onerror="this.src='https://via.placeholder.com/150'">
                <video src="${prod.video}" muted loop preload="none"></video>
            </div>
            <div class="product-details">
                <h4 class="product-title">${prod.title}</h4>
                <p class="product-subtitle">${prod.subtitle || prod.tag}</p>
                <div class="product-footer">
                    <span>${prod.no}</span>
                    <span class="product-price">${prod.price}</span>
                </div>
            </div>
        `;

        const vid = card.querySelector('video');
        card.addEventListener('mouseenter', () => {
            vid.play().catch(e => console.log("Autoplay prevented:", e));
        });

        card.addEventListener('mouseleave', () => {
            vid.pause();
            vid.currentTime = 0;
        });

        card.addEventListener('click', () => {
            openModal(prod);
        });

        productsGrid.appendChild(card);
    });
}

filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const category = btn.textContent.trim().toLowerCase();
        if (category === 'all') {
            renderProducts(allProducts);
        } else {
            renderProducts(allProducts.filter(p => p.tag && p.tag.toLowerCase().includes(category)));
        }
    });
});

function openModal(prod) {
    currentProduct = prod;
    modalProdTitle.textContent = prod.title;
    modalProdNo.textContent = prod.no;
    modalProdTag.textContent = prod.tag || "gift";
    modalDuration.textContent = prod.duration || "2s";
    modalPrice.textContent = prod.price;
    modalProdImg.src = prod.image;
    modalVideoSource.src = prod.video;
    modalVideo.load();
    modalVideo.play().catch(err => console.log("Modal video play error:", err));
    renderRelatedItems(prod);
    productModal.classList.add('active');
}

function renderRelatedItems(currentProd) {
    if (!relatedGrid) return;
    relatedGrid.innerHTML = "";
    let related = allProducts.filter(p => p.tag === currentProd.tag && p.no !== currentProd.no);
    if (related.length < 4) {
        related = [...related, ...allProducts.filter(p => p.no !== currentProd.no && !related.includes(p))];
    }
    related.slice(0, 4).forEach(relProd => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'related-item';
        itemDiv.innerHTML = `<img src="${relProd.image}" alt="${relProd.title}">`;
        itemDiv.addEventListener('click', () => openModal(relProd));
        relatedGrid.appendChild(itemDiv);
    });
}

// 3. Add to Cart with Toast
if (addToCartBtn) {
    addToCartBtn.onclick = async () => {
        if (!currentProduct) return;
        
        if (!currentUser) {
            showToast("Login Required", "Please login first to save items to your cart!", "error");
            setTimeout(() => { window.location.href = "login.html"; }, 1500);
            return;
        }

        const isAlreadyInCart = cartItems.some(item => item.no === currentProduct.no);

        if (isAlreadyInCart) {
            showToast("Notice", "هذا المنتج موجود بالفعل في السلة الخاصة بك!", "error");
            productModal.classList.remove('active');
            if (modalVideo) modalVideo.pause();
            return;
        }

        cartItems.push(currentProduct);
        updateCartUI();
        await saveCartToFirebase();

        showToast("Added to Cart", "Product added to cart successfully!");
        productModal.classList.remove('active');
        if (modalVideo) modalVideo.pause();
    };
}

// 4. Update Cart UI
function updateCartUI() {
    if (!cartCount || !cartItemsList) return;
    cartCount.textContent = cartItems.length;
    cartItemsList.innerHTML = "";
    
    if (cartItems.length === 0) {
        cartItemsList.innerHTML = `<p style="color:#8c90ad; text-align:center; padding:20px;">Your cart is empty.</p>`;
        return;
    }
    
    cartItems.forEach((item, index) => {
        cartItemsList.innerHTML += `
            <div class="cart-item-card">
                <div class="cart-item-info">
                    <img src="${item.image}">
                    <div><h4>${item.title}</h4><p>${item.price} - ${item.no}</p></div>
                </div>
                <button class="remove-cart-item" data-index="${index}"><i class="fa-solid fa-trash"></i></button>
            </div>`;
    });

    document.querySelectorAll('.remove-cart-item').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const idx = e.currentTarget.getAttribute('data-index');
            cartItems.splice(idx, 1);
            updateCartUI();
            await saveCartToFirebase();
            showToast("Removed", "Item removed from cart.");
        });
    });
}

if (openCartBtn && cartModal && closeCartModal) {
    openCartBtn.addEventListener('click', () => cartModal.classList.add('active'));
    closeCartModal.addEventListener('click', () => cartModal.classList.remove('active'));
}

if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (cartItems.length === 0) {
            showToast("Empty Cart", "Please add items to your cart first!", "error");
            return;
        }

        const email = clientEmail.value;
        const phone = countryCode.value + clientPhone.value;

        let message = `🛒 *New Order / Request*\n\n📧 *Email:* ${email}\n📱 *Phone:* ${phone}\n`;
        if (currentUser) message += `👤 *UID:* ${currentUser.uid}\n`;
        message += `\n📦 *Products:*\n`;
        cartItems.forEach((item, i) => { message += `${i + 1}. ${item.title} (${item.no}) - ${item.price}\n`; });

        try {
            await push(ref(db, 'orders'), {
                userId: currentUser ? currentUser.uid : "Guest",
                email, phone, items: cartItems, createdAt: new Date().toISOString()
            });
            window.open(`https://wa.me/212660010075?text=${encodeURIComponent(message)}`, '_blank');
            
            cartItems = [];
            updateCartUI();
            await saveCartToFirebase();

            cartModal.classList.remove('active');
            checkoutForm.reset();
            showToast("Order Confirmed!", "Order submitted and saved successfully!");
        } catch (error) {
            console.error("Error saving order: ", error);
            showToast("Error", "Failed to submit order.", "error");
        }
    });
}

if (closeModal) {
    closeModal.addEventListener('click', () => {
        productModal.classList.remove('active');
        modalVideo.pause();
    });
}

window.addEventListener('click', (e) => {
    if (e.target === productModal) { productModal.classList.remove('active'); modalVideo.pause(); }
    if (e.target === cartModal) { cartModal.classList.remove('active'); }
});

loadBanners();
loadProducts();