var BAKERY_CATALOG = [
    { id: 'sourdough-traditional', name: 'Country Sourdough Loaf', price: 8.50 },
    { id: 'croissant-butter', name: 'Classic Butter Croissant', price: 3.75 },
    { id: 'signature-loaf', name: 'Signature Country Sourdough Loaf', price: 8.50 },
    { id: 'cake-celebration', name: 'Vanilla Bean Layer Cake (8-inch)', price: 45.00 }
];

var userState = {
    quickTray: [],
    customerInfo: { name: '', email: '' }
};

function loadStoredData() {
    try {
        var savedTray = localStorage.getItem('northstar_quicktray');
        var savedCustomer = localStorage.getItem('northstar_customer');
        if (savedTray) userState.quickTray = JSON.parse(savedTray);
        if (savedCustomer) userState.customerInfo = JSON.parse(savedCustomer);
    } catch (e) {
        console.error('Storage load error:', e);
    }
}

function persistTrayData() {
    try {
        localStorage.setItem('northstar_quicktray', JSON.stringify(userState.quickTray));
    } catch (e) {
        console.error('Storage save error:', e);
    }
    updateHeaderBadge();
}

function persistCustomerData(name, email) {
    userState.customerInfo = { name: name, email: email };
    try {
        localStorage.setItem('northstar_customer', JSON.stringify(userState.customerInfo));
    } catch (e) {
        console.error('Customer save error:', e);
    }
}

function updateHeaderBadge() {
    var badgeElement = document.getElementById('tray-count-badge');
    if (badgeElement) {
        var totalItems = 0;
        for (var i = 0; i < userState.quickTray.length; i++) {
            totalItems += userState.quickTray[i].quantity;
        }
        badgeElement.textContent = totalItems.toString();
        badgeElement.style.display = totalItems > 0 ? 'inline-block' : 'none';
    }
}

window.toggleTrayItem = function(productId) {
    var product = null;
    for (var i = 0; i < BAKERY_CATALOG.length; i++) {
        if (BAKERY_CATALOG[i].id === productId) {
            product = BAKERY_CATALOG[i];
            break;
        }
    }
    if (!product) return;

    var existingIndex = -1;
    for (var j = 0; j < userState.quickTray.length; j++) {
        if (userState.quickTray[j].id === productId) {
            existingIndex = j;
            break;
        }
    }

    if (existingIndex > -1) {
        userState.quickTray[existingIndex].quantity += 1;
    } else {
        userState.quickTray.push({ id: product.id, name: product.name, price: product.price, quantity: 1 });
    }

    persistTrayData();
    renderQuickTrayUI();
};

window.removeFromTray = function(productId) {
    var newTray = [];
    for (var i = 0; i < userState.quickTray.length; i++) {
        if (userState.quickTray[i].id !== productId) {
            newTray.push(userState.quickTray[i]);
        }
    }
    userState.quickTray = newTray;
    persistTrayData();
    renderQuickTrayUI();
};

window.clearTray = function() {
    userState.quickTray = [];
    persistTrayData();
    renderQuickTrayUI();
};

function renderQuickTrayUI() {
    var trayContainer = document.getElementById('quick-tray-display');
    if (!trayContainer) return;

    if (userState.quickTray.length === 0) {
        trayContainer.innerHTML = '<p class="empty-tray-msg">Your Quick-Tray is currently empty. Click "Add to Pre-Order Tray" on any product below!</p>';
        return;
    }

    var totalEstimate = 0;
    var listHTML = '<ul class="tray-item-list">';

    for (var i = 0; i < userState.quickTray.length; i++) {
        var item = userState.quickTray[i];
        var itemTotal = item.price * item.quantity;
        totalEstimate += itemTotal;
        listHTML += '<li class="tray-item">' +
            '<span><strong>' + item.name + '</strong> (x' + item.quantity + ') - $' + itemTotal.toFixed(2) + '</span> ' +
            '<button type="button" class="btn-remove-item" onclick="removeFromTray(\'' + item.id + '\')">Remove</button>' +
            '</li>';
    }

    listHTML += '</ul>' +
        '<div class="tray-summary">' +
        '<p><strong>Estimated Total:</strong> $' + totalEstimate.toFixed(2) + '</p>' +
        '<button type="button" class="btn-clear-tray" onclick="clearTray()" style="margin-right:10px;">Clear Tray</button>' +
        '<a href="contact.html?action=preorder" class="btn-proceed-preorder">Transfer to Pre-Order Form</a>' +
        '</div>';

    trayContainer.innerHTML = listHTML;
}

function setupFormValidation() {
    var orderForm = document.getElementById('preorder-form');
    if (!orderForm) return;

    var nameInput = document.getElementById('customer-name');
    var emailInput = document.getElementById('customer-email');
    var detailsInput = document.getElementById('item-details');
    var requestTypeSelect = document.getElementById('request-type');

    if (nameInput && userState.customerInfo.name) nameInput.value = userState.customerInfo.name;
    if (emailInput && userState.customerInfo.email) emailInput.value = userState.customerInfo.email;

    var urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('action') === 'preorder' && userState.quickTray.length > 0 && detailsInput) {
        if (requestTypeSelect) requestTypeSelect.value = 'pre-order';
        var summaryArr = [];
        for (var i = 0; i < userState.quickTray.length; i++) {
            var item = userState.quickTray[i];
            summaryArr.push(item.quantity + 'x ' + item.name + ' ($' + (item.price * item.quantity).toFixed(2) + ')');
        }
        detailsInput.value = '[Transferred from Quick-Tray]: ' + summaryArr.join(', ');
    }

    if (nameInput) nameInput.addEventListener('input', function() { validateField(nameInput, function(v) { return v.trim().length > 0; }, 'Full Name is required.'); });
    if (emailInput) emailInput.addEventListener('input', function() { validateField(emailInput, function(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }, 'Please enter a valid email address.'); });
    if (detailsInput) detailsInput.addEventListener('input', function() { validateField(detailsInput, function(v) { return v.trim().length >= 10; }, 'Please enter at least 10 characters detailing your request.'); });

    orderForm.addEventListener('submit', function(e) {
        var isNameValid = validateField(nameInput, function(v) { return v.trim().length > 0; }, 'Full Name is required.');
        var isEmailValid = validateField(emailInput, function(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim()); }, 'Please enter a valid email address.');
        var isDetailsValid = validateField(detailsInput, function(v) { return v.trim().length >= 10; }, 'Please enter at least 10 characters detailing your request.');

        if (!isNameValid || !isEmailValid || !isDetailsValid) {
            e.preventDefault();
            var statusMsg = document.getElementById('form-status-message');
            if (statusMsg) {
                statusMsg.textContent = 'Please fix the errors highlighted above before submitting.';
                statusMsg.className = 'status-error';
            }
        } else {
            persistCustomerData(nameInput.value.trim(), emailInput.value.trim());
            alert('Thank you! Your pre-order request has been validated and submitted successfully.');
        }
    });
}

function validateField(inputElement, validationFn, errorMessage) {
    if (!inputElement) return false;
    var value = inputElement.value;
    var errorDisplay = document.getElementById(inputElement.id + '-error');
    var isValid = validationFn(value);

    if (!isValid) {
        inputElement.classList.add('input-invalid');
        inputElement.classList.remove('input-valid');
        if (errorDisplay) {
            errorDisplay.textContent = errorMessage;
            errorDisplay.style.display = 'block';
        }
    } else {
        inputElement.classList.remove('input-invalid');
        inputElement.classList.add('input-valid');
        if (errorDisplay) {
            errorDisplay.textContent = '';
            errorDisplay.style.display = 'none';
        }
    }
    return isValid;
}

document.addEventListener('DOMContentLoaded', function() {
    loadStoredData();
    updateHeaderBadge();
    renderQuickTrayUI();
    setupFormValidation();
});