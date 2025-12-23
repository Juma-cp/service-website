// Mobile Navigation Toggle
const navToggle = document.getElementById('navToggle');
const navMenu = document.getElementById('navMenu');

if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        
        // Animate hamburger to X
        const spans = navToggle.querySelectorAll('span');
        if (navMenu.classList.contains('active')) {
            spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(7px, -6px)';
        } else {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    });

    // Close menu when clicking a link
    document.querySelectorAll('.nav-menu a').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            const spans = navToggle.querySelectorAll('span');
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        });
    });
}

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const targetId = this.getAttribute('href');
        if (targetId === '#') return;
        
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
            window.scrollTo({
                top: targetElement.offsetTop - 80,
                behavior: 'smooth'
            });
        }
    });
});

// Payment button handler
document.addEventListener('DOMContentLoaded', () => {
    const paymentButtons = document.querySelectorAll('.payment-button');
    
    paymentButtons.forEach(button => {
        button.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // Show loading state
            const originalText = button.textContent;
            button.textContent = 'Processing...';
            button.disabled = true;
            
            try {
                // Get the product ID from data attribute
                const productId = button.dataset.productId || 'default_service';
                
                // Call backend to create Stripe session
                const response = await fetch('/api/create-checkout-session', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        productId: productId,
                        successUrl: `${window.location.origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
                        cancelUrl: `${window.location.origin}/cancel.html`
                    })
                });
                
                const data = await response.json();
                
                if (data.url) {
                    // Redirect to Stripe Checkout
                    window.location.href = data.url;
                } else {
                    throw new Error('No checkout URL received');
                }
            } catch (error) {
                console.error('Payment error:', error);
                button.textContent = 'Error - Try Again';
                setTimeout(() => {
                    button.textContent = originalText;
                    button.disabled = false;
                }, 2000);
            }
        });
    });
});

// Upsell functionality
function showUpsell() {
    const upsellModal = document.createElement('div');
    upsellModal.className = 'upsell-modal';
    upsellModal.innerHTML = `
        <div class="upsell-content">
            <button class="close-upsell">&times;</button>
            <h3>Enhance Your Purchase</h3>
            <p>Add priority support for just $49 (normally $97)</p>
            <div class="upsell-features">
                <p><i class="fas fa-check"></i> 24-hour response time</p>
                <p><i class="fas fa-check"></i> Priority scheduling</p>
                <p><i class="fas fa-check"></i> Extended support period</p>
            </div>
            <div class="upsell-actions">
                <button class="btn btn-outline decline-upsell">No Thanks</button>
                <button class="btn btn-primary add-upsell">Add to Purchase</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(upsellModal);
    
    // Add event listeners
    upsellModal.querySelector('.close-upsell').addEventListener('click', () => {
        document.body.removeChild(upsellModal);
    });
    
    upsellModal.querySelector('.decline-upsell').addEventListener('click', () => {
        document.body.removeChild(upsellModal);
    });
    
    upsellModal.querySelector('.add-upsell').addEventListener('click', () => {
        // Handle upsell addition
        console.log('Upsell added to purchase');
        document.body.removeChild(upsellModal);
        // Redirect to modified checkout with upsell
    });
    
    // Add modal styles
    const style = document.createElement('style');
    style.textContent = `
        .upsell-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
        }
        .upsell-content {
            background-color: white;
            padding: 2rem;
            border-radius: var(--border-radius);
            max-width: 500px;
            width: 90%;
            position: relative;
        }
        .close-upsell {
            position: absolute;
            top: 1rem;
            right: 1rem;
            background: none;
            border: none;
            font-size: 1.5rem;
            cursor: pointer;
            color: var(--gray-color);
        }
        .upsell-actions {
            display: flex;
            gap: 1rem;
            margin-top: 1.5rem;
        }
        @media (max-width: 768px) {
            .upsell-actions {
                flex-direction: column;
            }
        }
    `;
    document.head.appendChild(style);
}

// Form validation for consultation form
function validateConsultationForm() {
    const form = document.getElementById('consultationForm');
    if (!form) return;
    
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const email = form.querySelector('input[type="email"]');
        const message = form.querySelector('textarea');
        let isValid = true;
        
        // Reset errors
        form.querySelectorAll('.error-message').forEach(el => el.remove());
        
        // Validate email
        if (!email.value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
            showError(email, 'Please enter a valid email address');
            isValid = false;
        }
        
        // Validate message
        if (!message.value.trim() || message.value.trim().length < 10) {
            showError(message, 'Please provide more details (at least 10 characters)');
            isValid = false;
        }
        
        if (isValid) {
            // Submit form (in real implementation, this would be AJAX)
            alert('Consultation request submitted! We\'ll contact you within 24 hours.');
            form.reset();
        }
    });
}

function showError(input, message) {
    const error = document.createElement('div');
    error.className = 'error-message';
    error.style.color = '#dc3545';
    error.style.fontSize = '0.875rem';
    error.style.marginTop = '0.25rem';
    error.textContent = message;
    input.parentNode.appendChild(error);
    input.style.borderColor = '#dc3545';
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        validateConsultationForm();
    });
} else {
    validateConsultationForm();
}
