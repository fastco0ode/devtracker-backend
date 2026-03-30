const crypto = require('crypto');
const stripeService = require('../services/stripe.service');
const Developer = require('../../auth/schemas/developer.schema');
const Plan = require('../schemas/plan.schema');
exports.handleStripeWebhook = async (req, res, next) => {
  const signature = req.headers['stripe-signature'];
  let event;

  // 1. تحويل الـ Body من Buffer لـ JSON (عشان Postman يشتغل)
  let rawBody = req.body;
  if (Buffer.isBuffer(req.body)) {
    rawBody = JSON.parse(req.body.toString());
  }

  // 2. تخطي التوقيع للتجربة اليدوية
  if (!signature) {
    console.log("⚠️ Warning: No Signature found, bypassing for testing...");
    event = rawBody; // استخدم الـ Body اللي حولناه فوق
  } else {
    try {
      event = stripeService.constructWebhookEvent(req.body, signature);
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  }

  // 3. التحديث الفعلي
  try {
    if (event && event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const developerId = session.metadata?.developerId;

      console.log(">>> Processing Update for Dev ID:", developerId);

      const updatedUser = await Developer.findByIdAndUpdate(
        developerId,
        {
          $set: {
            "subscription.status": "active",
            "subscription.isPremium": true,
            "subscription.plan": "pro"
          }
        },
        { new: true } // السطر ده مهم جداً عشان يرجع الداتا الجديدة
      );

      // ضيف السطر ده وشوف هيطبع إيه في الـ Terminal
      console.log("Check this value in Terminal -> IsPremium:", updatedUser.subscription.isPremium);

      if (updatedUser) {
        console.log("✅✅✅ DONE: User is now Premium!");
      } else {
        console.log("❌ Developer ID not found in DB");
      }
    } else {
      console.log("ℹ️ Event received but not processed:", event?.type);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Internal Error:", error);
    res.status(500).send("Internal Error");
  }
};
exports.handlePaymobWebhook = async (req, res, next) => {
  try {
    const { obj } = req.body;
    const signature = req.query.hmac;

    if (!obj || !signature) {
      return res.status(400).send('Missing payload or signature');
    }

    const hmacFields = [
      'amount_cents',
      'created_at',
      'currency',
      'error_occured',
      'has_parent_transaction',
      'id',
      'integration_id',
      'is_3d_secure',
      'is_auth',
      'is_capture',
      'is_refunded',
      'is_standalone_payment',
      'is_voided',
      'order.id',
      'owner',
      'pending',
      'source_data.pan',
      'source_data.sub_type',
      'source_data.type',
      'success'
    ];

    const getNestedValue = (obj, path) => {
      return path.split('.').reduce((acc, part) => acc && acc[part], obj);
    };

    let concatenatedString = '';
    hmacFields.forEach(field => {
      const val = getNestedValue(obj, field);
      // For boolean strictly convert to "true" or "false"
      if (typeof val === 'boolean') {
        concatenatedString += val ? 'true' : 'false';
      } else if (val !== undefined && val !== null) {
        concatenatedString += val.toString();
      }
    });

    const calculatedHmac = crypto
      .createHmac('sha512', process.env.PAYMOB_HMAC_SECRET)
      .update(concatenatedString)
      .digest('hex');

    if (calculatedHmac !== signature) {
      return res.status(401).send('Invalid signature');
    }

    const isSuccess = obj.success === true;
    const merchantOrderId = obj.order ? obj.order.merchant_order_id : null;

    if (!merchantOrderId) {
      return res.status(400).send('Missing merchant_order_id inside Paymob order');
    }

    const developerId = merchantOrderId.split('_')[0];

    if (isSuccess) {
      await Developer.findByIdAndUpdate(developerId, {
        $set: {
          "subscription.status": "active",
          "subscription.isPremium": true,
          "subscription.paymobSubscriptionId": obj.order.id.toString(),
        }
      });
    } else {
      await Developer.findByIdAndUpdate(developerId, {
        $set: { "subscription.status": "past_due" }
      });
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Paymob Webhook Error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
