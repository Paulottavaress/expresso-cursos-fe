import React, { useContext, useEffect } from 'react';
import { Link } from 'react-router-dom';
import CartContext from '../context/cart/cartContext';
import HelpBtn from '../components/common/HelpBtn';
import { parseType } from '../utils/ParseType';
import { addToCartAutomatically } from '../utils/AddToCartAutomatically';

const Cart = () => {
  const cartContext = useContext(CartContext);
  const {
    availableCourses,
    courses,
    subtotal,
    removeFromCart,
    setCart
  } = cartContext;

  const onRemoveBtnClick = (e) => removeFromCart(e.currentTarget.id);

  useEffect(() => {
    if (availableCourses.length > 0) {
      if (addToCartAutomatically(availableCourses)) {
        const cart = localStorage.getItem('expresso-cursos-cart');
        if (cart) setCart(JSON.parse(cart));
        window.location.pathname = 'checkout/matricula';
      };
    };
  }, [availableCourses]);

  return (
    <>
      <div className='cart container bg-primary pb-5'>
        <h1 className='text-center font-weight-bold text-secondary py-3'>Carrinho de compras</h1>
        <div className='courses-group d-flex flex-column bg-secondary p-3'>
          {(courses && courses.length > 0) ? courses.map((course, i) => (
            <div key={course[0]}>
              <div className='course d-flex'>
                <div className='img-container'>
                  <Link to={course[1].sellingPage}>
                    <img src={course[1].image} alt={course[1].name} />
                  </Link>
                </div>
                <div className='content-container'>
                  <Link to={course[1].sellingPage}>
                    <h3 className='text-light'>{course[1].name} - curso de {parseType(course[1].type)}</h3>
                  </Link>
                  <h6 className='text-light'><span className='text-success'>{course[1].value.toLocaleString('pt-br',{style: 'currency', currency: 'BRL'})}</span> de 5x sem juros</h6>
                  <h6 className='text-light'><span className='text-success'>{(course[1].value * process.env.REACT_APP_PIX_DISCOUNT).toLocaleString('pt-br',{style: 'currency', currency: 'BRL'})}</span> à vista</h6>
                  <span
                    id={course[0]}
                    className='text-primary m-0'
                    onClick={onRemoveBtnClick}
                  >
                    remover
                  </span>
                </div>
              </div>
              {(courses.length - 1 !== i) && (<hr className='primary-hr'/>)}
            </div>
          )) : (
            <div>
              <h4 className='m-0'>Seu carrinho está vazio. Adicione algum curso!</h4>
            </div>
          )}
        </div>
        <div className='subtotal-area d-flex align-items-center justify-content-between bg-secondary my-3 p-3'>
          <div className='d-flex align-items-center gap-1 flex-wrap'>
            <h4 className='m-0 text-center'>Subtotal ({courses.length} {(courses.length === 1) ? 'curso' : 'cursos'}):</h4>
            <div className='d-flex align-items-center gap-1 flex-nowrap'>
              <p className='h4 text-danger m-0 strike-through'>{(400 * courses.length).toLocaleString('pt-br',{style: 'currency', currency: 'BRL'})}</p>
              <i className='fa-solid fa-arrow-right'></i>
              <p className='h4 text-success m-0'>{(subtotal * process.env.REACT_APP_PIX_DISCOUNT).toLocaleString('pt-br',{style: 'currency', currency: 'BRL'})}</p>
            </div>
          </div>
          {(window.innerWidth > 768) && (
          <div className='btn-area d-flex'>
            <HelpBtn
              btnText='Entrar em contato'
              textSize='h6'
              wppMsg='Gostaria de tirar algumas dúvidas antes de fazer minha matrícula! Pode me ajudar?'
              phone={process.env.REACT_APP_CONTACT_NUMBER_MATEUS}
            />
            {(courses && courses.length > 0) && (
            <Link
              to='/checkout/matricula'
              className='ml-1 btn btn-success text-white'
            >
              Fazer matrícula
            </Link>
            )}
          </div>
          )}
        </div>
        {(window.innerWidth <= 768) && (
        <div className='btn-area bg-secondary my-3 p-3 d-flex justify-content-center align-items-center'>
          <HelpBtn
            btnText='Entrar em contato'
            textSize='h6'
            wppMsg='Gostaria de tirar algumas dúvidas antes de fazer minha matrícula.'
            phone={process.env.REACT_APP_CONTACT_NUMBER_MATEUS}
          />
          {(courses && courses.length > 0) && (
          <Link
            to='/checkout/matricula'
            className='ml-1 btn btn-success text-white'
          >
            Fazer matrícula
          </Link>
          )}
        </div>
        )}
      </div>
    </>
  )
}

export default Cart;