import { Stripe, loadStripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null>;
export const getStripe = () => {
    if (!stripePromise) {
        const publishableKey = "pk_test_51S8rrbHdUdWUYxJHx3U3ZzXviYCmGDG5xtYhGCGk5WaYh08AMmHFGB2qI96Jmn7DL5nNIPHMARr6O4Z3PhG97gi100adWEwJq6";
        if (!publishableKey) {
            console.error("Publishable Key is undefined. Check .env file.");
        }
        stripePromise = loadStripe(publishableKey);
    }
    return stripePromise;
};