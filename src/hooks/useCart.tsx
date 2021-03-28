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

// Nesse contexto (CartContextData), eu tenho 4 atributos:
// 1- O cart como um array de produtos.
// 2- O addProduct como uma função que também recebe um id de produto e retorna uma Promise.
// 3- O removeProduct como função que recebe o id do produto e não retorna nada.
// 4- O updateProductAmount: ele recebe o id do produto e quantidade e não retorna nada.

interface CartContextData {
  cart: Product[]; //Carrinho de compras contém um array de produtos
  addProduct: (productId: number) => Promise<void>; //Promise: Porque faz um post?
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

//Para que toda aplicação tenha acesso ao hook, CartProvider deve ser criado e colocado no App.tsx
export function CartProvider({ children }: CartProviderProps): JSX.Element {
    //Executa em toda aplicação

    // O cart é um estado do tipo Array de produtos 
    // O <Product> vem do arquivo types que contém a interface do Produto com os seus
    // atributos id, title, price, image
    const [cart, setCart] = useState<Product[]>(() => { 

    // Criei essa variavel storagedCart para buscar os dados do meu localStorage.
    // storageCart só pode retornar String ou null, passe o mouse por cima dela.
    const storagedCart = localStorage.getItem('@RocketShoes:cart');

    // Se existir alguma informação, irá retornar String, porém, 
    // nosso carrinho é um array de produtos, tenho que converter com JSON.parse
    if (storagedCart) {
      return JSON.parse(storagedCart); //Retorna pro formato de array de produtos <Product[]>
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    //Para que possamos mostrar uma msg de erro, vamos utilizar o try/catch
    try {
      // Cria a variavel updatedCart para receber os dados do estado do carrinho.
    const updatedCart = [...cart]; //imutabilidade para evitar afetar os dados do estado principal que oferece informações a todas as funções do projeto.

    // Existe produto no carrinho? 
    // Vou chamar de product e verificar se o product.id é igual ao argumento da função productID
    // productId: id que irei receber na minha função
    // Faz um comparativo se existe o produto id
    const productExists = updatedCart.find(product => product.id === productId); 
    // console.log(productExists)


    //Vai buscar informações do produto no estoque
    // ex: loja -> id: 1, amount: 3, id: 5, amount:10
    const stock = await api.get(`/stock/${productId}`);

    const stockAmount = stock.data.amount; //Pega o valor do produto no estoque da loja.
    const currentAmount = productExists ? productExists.amount : 0; //Esse produto existe no carrinho? se for um novo produto será 0
    const amount = currentAmount +1; //Quantidade atual +1 //Após a checagem do produto no carrinho, se for 0 vai para 1 se for 5 vai para 6, +1

    if(amount > stockAmount){ //Se a quantidade deseja que passei for maior que o estoque da loja, erro de msg.
      toast.error('Quantidade solicitada fora de estoque');
      return;
    }

    if(productExists){ //O produto da loja existe no carrinho do usuário?
      productExists.amount = amount; // atualiza a quantidade do produto no carrinho -> productExist é o updatedCart, devido a imutabilidade podemos alterar os dados sem prejudicar o estado atual do cart
    } else{ //senão existir o produto no carrinho
      // Faz um get no id do produto buscando suas informações.
      const product = await api.get(`/products/${productId}`);  //busca as infor do produto selecionado

      //Cria a váriavel novoProduto, recebendo os dados do produto + a quantidade inicial
      const newProduct = { //Isso será armazenado no carrinho do usuário.
        ...product.data,
        amount: 1
      }
      updatedCart.push(newProduct); //Joga o Novo Produto no updateCart(carrinho de compras), utiliza o push para respeitar a imutabilidade, ou seja, os dados anteriores + o produtoNovo
    }

    setCart(updatedCart); //Salva no estado o updatedCart atual que é o valor anterior + o novo produto
    localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart)); //Adiciona também no localstorage para String
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try { //try para tratar erros
      const updatedCart = [...cart]; //imutabilidade para gerar uma "cópia" do carrinho de compras

      //Faz uma varredura para identificar se existe o produto, neste caso, o findIndex permite remover o produto(item) do array de produtos.
      const productIndex = updatedCart.findIndex(product => product.id === productId);
   
      if(productIndex >= 0){ // O productIndex precisa ser maior igual a 0, senão encontrar este produto retorna -1. 
        
        //o splice vai alterar o updateCart "remover", por isso, é ideal utilizar a imutabilidade
        updatedCart.splice(productIndex, 1);
        setCart(updatedCart); //Adiciona a "imutabilidade-cópia" no carrinho de compras.
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart)); //Salva no localstorage
      } else{
        throw Error(); //Força o erro do catch
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId, //Aqui eu recebi o id do produto do carrinho + a quantidade desejada
    amount,
  }: UpdateProductAmount) => {
    try {
      if(amount <=0){ //Se a quantidade do produto for menor ou igual a zero dou um return sem nada como resposta.
        return;
      }
      const stock = await api.get(`/stock/${productId}`);
      const stockAmount = stock.data.amount; //Isso é a quantidade daquele produto no estoque, a loja só tem 3 do id 1, ex.

      if(amount > stockAmount){ // A quantidade do produto solicitado é maior do que se existe no estoque da loja?
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const updatedCart = [...cart]; 
      const productExists = updatedCart.find(product => product.id === productId); //verifica se existe o produto da loja no carrinho.

      if(productExists){
        productExists.amount = amount; //Vai atualizar com a quantidade solicitada na hora do clique.
        setCart(updatedCart); //Salva a "cópia" no estado oficial.
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(updatedCart)); //Salva no localstorage
      }
      else{
        throw Error();
      }
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider //Responsável por oferecer acesso a toda aplicação, App.tsx
      value={{ cart, addProduct, removeProduct, updateProductAmount }} //Funcionalidades a serem acessadas
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData { //Responsável por oferecer acesso as funções nos componentes
  const context = useContext(CartContext);

  return context;
}
