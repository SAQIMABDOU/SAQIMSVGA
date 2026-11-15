// Import Firebase SDKs from CDN
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, get, set, push } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// Firebase Configuration الخاصة بك
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

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

/**
 * دالة لجلب المنتجات من Firebase Realtime Database
 */
export async function fetchProducts(defaultProducts) {
    try {
        const productsRef = ref(db, 'products');
        const snapshot = await get(productsRef);
        
        if (snapshot.exists()) {
            return Object.values(snapshot.val());
        } else {
            // إذا كانت قاعدة البيانات فارغة، نقوم بتخزين المنتجات الافتراضية أولاً
            await set(productsRef, defaultProducts);
            return defaultProducts;
        }
    } catch (error) {
        console.error("Error loading products from Firebase: ", error);
        return defaultProducts; // Fallback في حالة الخطأ
    }
}

/**
 * دالة لإضافة منتج إلى سلة المشتريات (Cart) في Firebase
 */
export async function addProductToCart(prod) {
    try {
        const cartRef = ref(db, 'cart');
        const newCartItemRef = push(cartRef);
        await set(newCartItemRef, {
            productId: prod.id || "N/A",
            title: prod.title,
            price: prod.price,
            addedAt: new Date().toISOString()
        });
        return true;
    } catch (e) {
        console.error("Error adding to cart in Firebase: ", e);
        return false;
    }
}