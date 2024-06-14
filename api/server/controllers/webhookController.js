const Stripe = require('stripe');
const { updateUserSubscriptionStatus } = require('../../models/userMethods'); // Adjust the path based on your project structure
const { logger } = require('~/config');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;

const handleWebhook = async (req, res) => {
  logger.info('Received a webhook event');
  // Log the request body and headers
  //console.log('Request Body:', req.body);
  //console.log('Request Headers:', req.headers);
  //console.log('sk_test:', process.env.STRIPE_SECRET_KEY);
  //console.log('wh_sec:', process.env.STRIPE_ENDPOINT_SECRET);
  let event = req.body;

  // Verify webhook signature
  if (endpointSecret) {
    const signature = req.headers['stripe-signature'];
    try {
      event = stripe.webhooks.constructEvent(req.body, signature, endpointSecret);
      logger.info('Webhook signature verified');
    } catch (err) {
      logger.error('⚠️  Webhook signature verification failed:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  } else {
    // Handle the case where there is no endpointSecret
    try {
      event = JSON.parse(req.body);
    } catch (err) {
      logger.error('⚠️  Error parsing webhook JSON:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }
  // Respond to Stripe as quickly as possible
  res.status(200).send('Received');
  try {
    // Handle the invoice.paid event
    if (event.type === 'invoice.paid') {
      const invoice = event.data.object;
      const customerId = invoice.customer;
      const subscriptionId = invoice.subscription;
      logger.info(
        `Handling invoice.paid for customer ${customerId}, subscription ${subscriptionId}`,
      );

      const updateResult = await updateUserSubscriptionStatus(customerId, 'active');
      if (!updateResult.success) {
        logger.error('[updateUserSubscriptionStatus]', updateResult.error);
        return res.status(500).send({ message: updateResult.error });
      }

      logger.info('User subscription status updated successfully');
    } else {
      // Log a warning or skip processing for other event types
      logger.warn(`Skipping event type ${event.type}`);
    }
  } catch (err) {
    logger.error('[handleWebhook]', err);
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  handleWebhook,
};
