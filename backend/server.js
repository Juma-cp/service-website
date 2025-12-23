const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5500',
    credentials: true
}));
app.use(express.json());
app.use(express.static('../frontend'));

// Stripe Checkout Session Endpoint
app.post('/api/create-checkout-session', async (req, res) => {
    try {
        const { productId, successUrl, cancelUrl } = req.body;
        
        // Define products
        const products = {
            'basic_service': {
                name: 'In-Depth Assessment',
                description: 'Detailed custom service assessment',
                price: 24700, // $247 in cents
                image: 'https://yourwebsite.com/service-image.jpg'
            },
            'with_upsell': {
                name: 'In-Depth Assessment + Priority Support',
                description: 'Detailed assessment with priority support',
                price: 29600, // $247 + $49 upsell
                image: 'https://yourwebsite.com/service-image.jpg'
            }
        };
        
        const product = products[productId] || products['basic_service'];
        
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: product.name,
                            description: product.description,
                            images: [product.image],
                        },
                        unit_amount: product.price,
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: successUrl.replace('{CHECKOUT_SESSION_ID}', '{CHECKOUT_SESSION_ID}'),
            cancel_url: cancelUrl,
            metadata: {
                productId: productId,
                customer_email: req.body.customerEmail || '',
            }
        });

        res.json({ url: session.url });
    } catch (error) {
        console.error('Stripe session error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Stripe Webhook Endpoint
app.post('/api/webhook', express.raw({type: 'application/json'}), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed':
            const session = event.data.object;
            
            // Send confirmation email to customer
            await sendConfirmationEmail(session);
            
            // Send notification to admin
            await sendAdminNotification(session);
            
            // Prepare data for Tally form (you'll redirect to Tally with this)
            console.log('Payment successful for session:', session.id);
            break;
            
        case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log('PaymentIntent was successful!');
            break;
            
        default:
            console.log(`Unhandled event type ${event.type}`);
    }

    res.json({received: true});
});

// Email functions (using Resend or Nodemailer)
async function sendConfirmationEmail(session) {
    // Implementation for Resend
    // const resend = new Resend(process.env.RESEND_API_KEY);
    
    // await resend.emails.send({
    //     from: 'service@yourwebsite.com',
    //     to: session.customer_details.email,
    //     subject: 'Your Purchase Confirmation',
    //     html: `<h1>Thank you for your purchase!</h1>
    //            <p>We've received your payment and will begin working on your assessment.</p>
    //            <p><a href="https://tally.so/your-form-link">Click here to fill out the detailed form</a></p>`
    // });
    
    console.log('Confirmation email would be sent to:', session.customer_details.email);
}

async function sendAdminNotification(session) {
    // Send notification to admin
    console.log('Admin notification for payment:', session.id, 'Amount:', session.amount_total);
}

// Serve HTML pages
app.get('/', (req, res) => {
    res.sendFile('index.html', { root: '../frontend' });
});

app.get('/services', (req, res) => {
    res.sendFile('services.html', { root: '../frontend' });
});

app.get('/consultation', (req, res) => {
    res.sendFile('consultation.html', { root: '../frontend' });
});

app.get('/assessment', (req, res) => {
    res.sendFile('assessment.html', { root: '../frontend' });
});

app.get('/samples', (req, res) => {
    res.sendFile('samples.html', { root: '../frontend' });
});

app.get('/payment', (req, res) => {
    res.sendFile('payment.html', { root: '../frontend' });
});

app.get('/success', (req, res) => {
    res.sendFile('success.html', { root: '../frontend' });
});

app.get('/cancel', (req, res) => {
    res.sendFile('cancel.html', { root: '../frontend' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Frontend: ${process.env.FRONTEND_URL || 'http://localhost:5500'}`);
});
