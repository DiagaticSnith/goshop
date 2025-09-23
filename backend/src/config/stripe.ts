import Stripe from "stripe";
console.log("Stripe Secret Key:", process.env.STRIPE_SECRET_KEY?.substring(0, 5) + "...");
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
    apiVersion: "2022-11-15",
    typescript: true
});

export default stripe;
