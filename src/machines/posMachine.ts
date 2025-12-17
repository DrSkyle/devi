import { createMachine, assign } from 'xstate'
import { database } from '@/database'
import { Sale } from '@/database/models'
import { addMoney } from '@/utils/currency'

export interface CartItem {
  id: string
  name: string
  price: number
  qty: number
  total: number
}

export interface PosContext {
  cart: CartItem[]
  customer: any | null
  paymentMethod: 'Cash' | 'Card' | 'Online'
  error: string | null
  grandTotal: number
}

export type PosEvent =
  | { type: 'ADD_ITEM'; item: CartItem }
  | { type: 'REMOVE_ITEM'; id: string }
  | { type: 'CHECKOUT' }
  | { type: 'CONFIRM_PAYMENT' }
  | { type: 'CANCEL' }
  | { type: 'SET_METHOD'; method: 'Cash' | 'Card' | 'Online' }
  | { type: 'CLEAR' }

export const posMachine = createMachine(
  {
    id: 'pos',
    initial: 'idle',
    types: {} as {
      context: PosContext
      events: PosEvent
    },
    context: {
      cart: [],
      customer: null,
      paymentMethod: 'Cash',
      error: null,
      grandTotal: 0,
    },
    states: {
      idle: {
        on: {
          ADD_ITEM: {
            target: 'active',
            actions: 'addToCart',
          },
        },
      },
      active: {
        on: {
          ADD_ITEM: { actions: 'addToCart' },
          REMOVE_ITEM: { actions: 'removeFromCart' },
          CHECKOUT: 'payment',
          CLEAR: { target: 'idle', actions: 'clearCart' },
        },
      },
      payment: {
        on: {
          CONFIRM_PAYMENT: 'processing',
          CANCEL: 'active',
          SET_METHOD: { actions: 'setPaymentMethod' },
        },
      },
      processing: {
        invoke: {
          src: 'saveSaleToDatabase',
          onDone: { target: 'printing' },
          onError: { target: 'payment', actions: 'setError' },
        },
      },
      printing: {
        invoke: {
          src: 'printReceipt',
          onDone: { target: 'success' },
          onError: { target: 'success' }, // If print fails, we still finished the sale
        },
      },
      success: {
        after: {
          2000: { target: 'idle', actions: 'clearCart' },
        },
      },
    },
  },
  {
    actions: {
      addToCart: assign(({ context, event }) => {
        if (event.type !== 'ADD_ITEM') return context
        const newCart = [...context.cart, event.item]
        const newTotal = newCart.reduce((sum, item) => addMoney(sum, item.total), 0)
        return {
          cart: newCart,
          grandTotal: newTotal,
        }
      }),
      removeFromCart: assign(({ context, event }) => {
        if (event.type !== 'REMOVE_ITEM') return context
        const newCart = context.cart.filter((item) => item.id !== event.id)
        const newTotal = newCart.reduce((sum, item) => addMoney(sum, item.total), 0)
        return {
          cart: newCart,
          grandTotal: newTotal,
        }
      }),
      clearCart: assign({
        cart: [],
        grandTotal: 0,
        customer: null,
        error: null,
      }),
      setPaymentMethod: assign(({ event }) => {
        if (event.type !== 'SET_METHOD') return {}
        return { paymentMethod: event.method }
      }),
      setError: assign(({ event }) => {
        return { error: (event as any).data?.message || 'Transaction failed' }
      }),
    },
  },
)
