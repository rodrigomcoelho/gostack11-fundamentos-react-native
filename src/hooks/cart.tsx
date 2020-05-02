import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const keyStorage = '@AppGoMarket:products';

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const product = await AsyncStorage.getItem(keyStorage);

      if (product) setProducts(JSON.parse(product));
    }

    loadProducts();
  }, []);

  useEffect(() => {
    async function saveInStorage(): Promise<void> {
      await AsyncStorage.setItem(keyStorage, JSON.stringify(products));
    }
    saveInStorage();
  }, [products]);

  const increment = useCallback(async (id: string) => {
    setProducts(oldProducts =>
      oldProducts.map(p => ({
        ...p,
        quantity: p.quantity + (p.id === id ? 1 : 0),
      })),
    );
  }, []);

  const addToCart = useCallback(
    async (product: Product) => {
      const productIndex = products.findIndex(prod => prod.id === product.id);

      if (productIndex < 0) {
        setProducts(oldProducts => [
          ...oldProducts,
          { ...product, quantity: 1 },
        ]);

        return;
      }
      await increment(product.id);
    },
    [increment, products],
  );

  const decrement = useCallback(async (id: string) => {
    setProducts(oldProducts =>
      oldProducts.map(p => {
        if (p.id === id && p.quantity <= 1) return {} as Product;
        return { ...p, quantity: p.quantity - (p.id === id ? 1 : 0) };
      }),
    );
  }, []);

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
