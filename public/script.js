// ===== GLOBAL VARIABLES =====
let cart = [];
let cartCount = 0;

// ===== CART FUNCTIONS =====
function addToCart(productId, productName, price) {
    const existingItem = cart.find(item => item.id === productId);

    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: productId,
            name: productName,
            price: parseFloat(price),
            quantity: 1
        });
    }

    cartCount = cart.reduce((total, item) => total + item.quantity, 0);
    saveCartToLocalStorage();
    updateCartIcon();
    showToast(`Dodano do koszyka: ${productName}`);
}

function saveCartToLocalStorage() {
    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('cartCount', cartCount);
}

function loadCartFromLocalStorage() {
    const savedCart = localStorage.getItem('cart');
    const savedCount = localStorage.getItem('cartCount');

    if (savedCart) cart = JSON.parse(savedCart);
    if (savedCount) cartCount = parseInt(savedCount);
}

function updateCartIcon() {
    document.querySelectorAll('.cart-count').forEach(el => {
        el.textContent = cartCount;
        el.style.display = cartCount > 0 ? 'flex' : 'none';
    });
}

function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    const toastMessage = document.getElementById('toast-message');
    if (toastMessage) toastMessage.textContent = message;

    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

// ===== HEADER FUNCTIONS =====
function setupMobileMenu() {
    const menuToggle = document.querySelector('.menu-toggle');
    const navContainer = document.querySelector('.nav-container');

    if (menuToggle && navContainer) {
        menuToggle.addEventListener('click', () => {
            navContainer.classList.toggle('active');
        });
    }
}

function setupNavigation() {
    const currentPath = window.location.pathname;
    const pageName = currentPath.split('/').pop().replace('.html', '') || 'index';

    document.querySelectorAll('.nav-links a').forEach(link => {
        const linkPath = link.getAttribute('href').replace('.html', '');
        if (pageName === linkPath) {
            link.classList.add('active');
        }
    });
}

// ===== PRODUCT PAGE FUNCTIONS =====
function initProductPages() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('add-to-cart')) {
            const productCard = e.target.closest('.product-card');
            if (productCard) {
                const baseId = productCard.getAttribute('data-base-id');
                const baseName = productCard.getAttribute('data-base-name');
                const optionSelect = productCard.querySelector('.product-option');
                const selectedOption = optionSelect.options[optionSelect.selectedIndex];

                const variant = selectedOption.value;
                const price = selectedOption.getAttribute('data-price');
                const productName = `${baseName} (${selectedOption.textContent.split(' - ')[0]})`;
                const productId = `${baseId}-${variant}`;

                addToCart(productId, productName, price);
            }
        }
    });
}

// ===== CART PAGE FUNCTIONS =====
const ICONS = {
    'box': 'fa-box',
    'pallet': 'fa-pallet'
};

function getIcon(productId) {
    if (productId.startsWith('1-')) return ICONS.box;
    if (productId.startsWith('2-')) return ICONS.pallet;
    return 'fa-box';
}

function loadCart() {
    const saved = localStorage.getItem('cart');
    cart = saved ? JSON.parse(saved) : [];
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('cartCount', cart.reduce((t, item) => t + item.quantity, 0));
}

function renderCart() {
    const container = document.getElementById('cart-items');
    if (!container) return;

    const totalField = document.getElementById('cart-total');
    container.innerHTML = '';
    let total = 0;

    if (cart.length === 0) {
        container.innerHTML = '<p class="empty-cart-message">Twój koszyk jest pusty.</p>';
        if (document.querySelector('.cart-summary')) {
            document.querySelector('.cart-summary').style.display = 'none';
        }
        return;
    }

    cart.forEach((item, index) => {
        const iconClass = getIcon(item.id);
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <i class="fas ${iconClass}"></i>
            <div class="item-desc">${item.name}</div>
            <input type="number" class="quantity-input" min="1" value="${item.quantity}" data-index="${index}">
            <div class="cart-item-price"><strong>${(item.price * item.quantity).toFixed(2)} zł</strong></div>
            <button class="remove-btn" data-index="${index}"><i class="fas fa-trash"></i></button>
        `;
        container.appendChild(div);
        total += item.price * item.quantity;
    });

    if (totalField) totalField.textContent = `${total.toFixed(2)} zł`;
    addCartEventListeners();
}

function addCartEventListeners() {
    document.querySelectorAll('.quantity-input').forEach(input => {
        input.addEventListener('change', e => {
            const index = e.target.getAttribute('data-index');
            const qty = parseInt(e.target.value);
            if (qty > 0) {
                cart[index].quantity = qty;
            } else {
                cart.splice(index, 1);
            }
            saveCart();
            renderCart();
            updateCartIcon();
        });
    });

    document.querySelectorAll('.remove-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            const index = e.currentTarget.getAttribute('data-index');
            cart.splice(index, 1);
            saveCart();
            renderCart();
            updateCartIcon();
        });
    });
}
// Funkcja aktualizująca stan koszyka
function updateCartCount(count) {
  const cartCountElement = document.getElementById('cart-count');
  if (cartCountElement) {
    cartCountElement.textContent = count;
    localStorage.setItem('cartCount', count);
  }
}

updateCartCount(cartCount);
function initCartPage() {
    loadCart();
    renderCart();

    const checkoutBtn = document.getElementById('checkout-button');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', () => {
            window.location.href = 'zamowienie.html';
        });
    }
}

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', function() {
    loadCartFromLocalStorage();
    updateCartIcon();

    fetch('header.html')
    .then(response => response.text())
    .then(data => {
        const headerEl = document.getElementById('header-placeholder');
        if (headerEl) {
            headerEl.innerHTML = data;

            // Przenieś inicjalizację tutaj, aby miała dostęp do wstawionych elementów
            setupNavigation();
            setupMobileMenu();
            updateCartIcon();
        }
    })
    .catch(error => console.error('Error loading header:', error));

    fetch('footer.html')
        .then(response => response.text())
        .then(data => {
            const footerEl = document.getElementById('footer-placeholder');
            if (footerEl) footerEl.innerHTML = data;
        })
        .catch(error => console.error('Error loading footer:', error));

    const path = window.location.pathname;
    const pageName = path.split('/').pop().replace('.html', '');

    if (pageName === 'produkty' || pageName === 'karton' || pageName === 'paleta') {
        initProductPages();
    } else if (pageName === 'koszyk') {
        initCartPage();
    }

    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const email = this.querySelector('input[type="email"]').value;
            showToast(`Dziękujemy za zapisanie się na newsletter: ${email}`);
            this.reset();
        });
    }
});
