import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { textSpanContainsTextSpan } from 'typescript';
import { api } from '../services/api';
import { Product, Stock } from '../types';

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

    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
    const updatedCart = [...cart]; //cria imutabilidade para verificar produtos no carrinho

    const productExists = updatedCart.find(product => product.id === productId); //existe produto no carrinho?

    const stock = await api.get(`/stock/${productId}`); //variável para verificar o estoque

    const stockAmount = stock.data.amount; //Só para pegar o valor
    const currentAmount = productExists ? productExists.amount : 0; //Existe produto no carrinho? pegue o amount senão é 0
    const amount = currentAmount +1; //Quantidade desejada -> atual + 1

    if(amount > stockAmount){ //Quantidade deseja for maior que o estoque que possuo, erro de msg.
      toast.error('Quantidade solicitada fora do estoque');
      return;
    }

    if(productExists ){ //O produto existe? atualiza a quantidade
      productExists.amount = amount;
    } else{ //senão existir o produto, adiciona um novo produto que não existe no carrinho
      const product = await api.get(`/products/${productId}`);  //busca as infor do produto selecionado

      const newProduct = { //Pega os dados do produto e adiciona a quantidade 1 minima
        ...product.data,
        amount: 1
      }
      updatedCart.push(newProduct); //Joga o produto no updateCart junto com a imutabilidade
    }

    setCart(updatedCart); //Adiciona o produto ao estado do carrinho
    localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart)); //Adiciona também no localstorage
    } catch {
      toast.error('Erro na edição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try { //Verifique se existe no carrinho o produto a ser removido
      const updatedCart = [...cart]; //imutabilidade
      const productIndex = updatedCart.findIndex(product => product.id === product.id); //findIndex permite remover o item do array
   
      if(productIndex >= 0){ //se encontrou o productIndex é maior igual a 0, senão encontrar retorna -1. 
        updatedCart.splice(productIndex, 1); //o splice vai alterar o updateCart "remover", por isso, é ideal utilizar a imutabilidade
        setCart(updatedCart); //Adicionando no estado do Cart
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart)); //Salvando no localstorage
      } else{
        throw Error(); //Força o erro do catch
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <=0){ //Se a quantidade do produto for menor ou igual a zero dou um return
        return;
      }
      const stock = await api.get(`/stock/${productId}`);
      const stockAmount = stock.data.amount;

      if(amount > stockAmount){
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const updatedCart = [...cart]; 
      const productExists = updatedCart.find(product => product.id === productId);

      if(productExists){
        productExists.amount = amount;
        setCart(updatedCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart)); //Salvando no localstorage
      }
      else{
        throw Error();
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
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
