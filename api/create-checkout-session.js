const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { productId, customerEmail } = req.body;
    
    // Define products
    const products = {
      'basic_service': {
        name: 'In-Depth Assessment',
        description: 'Detailed custom service assessment',
        price: 24700, // $247 in cents
      },
      'with_upsell': {
        name: 'In-Depth Assessment + Priority Support',
        description: 'Detailed assessment with priority support',
        price: 29600, // $247 + $49 upsell
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
              images: ['https://yourwebsite.com/service-image.jpg'],
            },
            unit_amount: product.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel.html`,
      customer_email: customerEmail,
      metadata: {
        productId: productId,
      }
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error('Stripe session error:', error);
    res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: error.message 
    });
  }
};
