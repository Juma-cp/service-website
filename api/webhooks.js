const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

module.exports = async (req, res) => {
  // Only accept POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

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
      
      try {
        // Send confirmation email to customer
        await sendConfirmationEmail(session);
        
        // Send notification to admin
        await sendAdminNotification(session);
        
        console.log('Payment successful for session:', session.id);
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Don't fail the webhook, just log the error
      }
      break;
      
    case 'payment_intent.succeeded':
      console.log('PaymentIntent was successful!');
      break;
      
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.status(200).json({ received: true });
};

async function sendConfirmationEmail(session) {
  if (!session.customer_email) return;
  
  const tallyFormUrl = process.env.TALLY_FORM_URL || 'https://tally.so/your-form';
  
  await resend.emails.send({
    from: 'service@yourwebsite.com',
    to: session.customer_email,
    subject: 'Your Purchase Confirmation',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Thank you for your purchase!</h2>
        <p>We've received your payment and will begin working on your assessment.</p>
        <p><strong>Next Step:</strong> Please fill out our detailed form to help us better understand your needs:</p>
        <p style="text-align: center; margin: 30px 0;">
          <a href="${tallyFormUrl}" 
             style="background-color: #4361ee; color: white; padding: 12px 24px; 
                    text-decoration: none; border-radius: 8px; font-weight: bold;">
            Complete Your Details Form
          </a>
        </p>
        <p>If you have any questions, please reply to this email.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
        <p style="font-size: 12px; color: #666;">
          Order ID: ${session.id}<br>
          Amount: $${(session.amount_total / 100).toFixed(2)}
        </p>
      </div>
    `
  });
}

async function sendAdminNotification(session) {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@yourwebsite.com';
  
  await resend.emails.send({
    from: 'service@yourwebsite.com',
    to: adminEmail,
    subject: 'New Purchase Notification',
    html: `
      <div style="font-family: Arial, sans-serif;">
        <h3>New Purchase Received</h3>
        <p><strong>Customer:</strong> ${session.customer_email || 'No email provided'}</p>
        <p><strong>Amount:</strong> $${(session.amount_total / 100).toFixed(2)}</p>
        <p><strong>Session ID:</strong> ${session.id}</p>
        <p><strong>Product:</strong> ${session.metadata.productId || 'basic_service'}</p>
        <p><a href="https://dashboard.stripe.com/payments/${session.payment_intent}">View in Stripe Dashboard</a></p>
      </div>
    `
  });
}
