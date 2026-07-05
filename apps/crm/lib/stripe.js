import { loadStripe } from '@stripe/stripe-js'

const stripeEnabled = import.meta.env.VITE_STRIPE_ENABLED === 'true'
const stripePublicKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY

// Stripe está instalado pero inactivo hasta Fase 4
export const stripePromise = stripeEnabled && stripePublicKey
  ? loadStripe(stripePublicKey)
  : null

export { stripeEnabled }
