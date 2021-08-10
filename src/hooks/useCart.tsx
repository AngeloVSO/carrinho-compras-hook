import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart")

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const products = [...cart]
      const productExists = products.find(product => product.id === productId)

      const stockItem = await api.get(`/stock/${productId}`)
      const amountStockItem = stockItem.data.amount
      const currentAmount = productExists ? productExists.amount : 0
      const amount = currentAmount + 1

      if(amount > amountStockItem) {
        toast.error("Quantidade solicitada fora de estoque")
        return
      }
      if(productExists) {
        productExists.amount = amount
      } else {
        const product = await api.get(`/products/${productId}`)

        const newProduct = {
          ...product.data,
          amount: 1
        }
        products.push(newProduct)
      }

      setCart(products)
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(products))
    } catch {
      toast.error('Erro na adição do produto')
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const products = [...cart]
      const productIndex = products.findIndex(product => product.id === productId)

      if(productIndex >=0) {
        products.splice(productIndex, 1)
        setCart(products)
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(products))
      } else {
        throw Error()
      }
    } catch {
      toast.error('Erro na remoção do produto')
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <= 0) {
        return
      }

      const stockItem = await api.get(`/stock/${productId}`)
      const amountStockItem = stockItem.data.amount

      if(amount > amountStockItem) {
        toast.error("Quantidade solicitada fora de estoque")
        return
      }

      const products = [...cart]
      const productExists = products.find(product => product.id === productId)

      if(productExists) {
        productExists.amount = amount
        setCart(products)
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(products))
      } else {
        throw Error()
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto')
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
