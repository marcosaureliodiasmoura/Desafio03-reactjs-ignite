import React, { useState, useEffect } from 'react';
import { MdAddShoppingCart } from 'react-icons/md';

import { ProductList } from './styles';
import { api } from '../../services/api';
import { formatPrice } from '../../util/format';
import { useCart } from '../../hooks/useCart';

interface Product {
  id: number;
  title: string;
  price: number;
  image: string;
}

interface ProductFormatted extends Product {
  priceFormatted: string;
}

interface CartItemsAmount {
  [key: number]: number;
}

const Home = (): JSX.Element => {
  const [products, setProducts] = useState<ProductFormatted[]>([]); //Terei o formato do produto do carrinho e também o preço formatado.
  const { addProduct, cart } = useCart(); //Contextos que irei pegar do hooks

  const cartItemsAmount = cart.reduce((sumAmount, product) => {
    const newSumAmount = {...sumAmount}; //Criei um novo objeto a partir do anterior "imutabilidade"

    //Passa o objeto "newSumAmount" e acessa o seu id, acessa a chave de uma maneira dinâmica
    //Faz uma associação de todos os itens dentro do carrinho
    //ex: sapato azul(id:1) tem 2 no carrinho; sapato preto(id:3) tem 1 no carrinho
    newSumAmount[product.id ] = product.amount; 
    // console.log(newSumAmount);
    // ex do resultado: {1:2, 3:1}
    return newSumAmount;
  }, {} as CartItemsAmount)

  useEffect(() => {
    async function loadProducts() { //Carrega os produtos da loja para mostrar na tela
       const response  = await api.get<Product[]>('products'); //trás o price do json assim -> 139.9,

       const data = response.data.map(product => ({ //faz o mapeamento, o product precisa da tipagem no response <Product[]>
         ...product, //pega todos os produdos da api
         priceFormatted: formatPrice(product.price) //transforma o formato do preço
       }))      

       setProducts(data); //Adiciona todos os produtos no estado junto com a nova formatação em R$.
    }

    loadProducts();
  }, []);
      console.log(products); //Consigo enxergar o valor formatado que será apresentando na view


  function handleAddProduct(id: number) {
    addProduct(id); //Chama a função do hook e passa o id para ela, executando a regra de negócio do addProduct do hook.
  }

  return (
    <ProductList>
      {products.map(product => (
        <li key={product.id}>
        <img src={product.image} alt={product.title} />
        <strong>{product.title}</strong>
        <span>{product.priceFormatted}</span>
        <button
          type="button"
          data-testid="add-product-button"
        onClick={() => handleAddProduct(product.id)}
        >
          <div data-testid="cart-product-quantity">
            <MdAddShoppingCart size={16} color="#FFF" />
            {cartItemsAmount[product.id] || 0}
          </div>

          <span>ADICIONAR AO CARRINHO</span>
        </button>
      </li>
      ))}
    </ProductList>
  );
};

export default Home;
