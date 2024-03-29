import { useState, useContext, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useMercadopago } from 'react-sdk-mercadopago';
import CartContext from '../context/cart/cartContext';
import CheckoutContext from '../context/checkout/checkoutContext';
import AlertContext from '../context/alert/alertContext';
import Registration from '../components/checkout/Registration';
import MercadoPagoPix from '../components/checkout/MercadoPagoPix';
import MercadoPagoBankSlip from '../components/checkout/MercadoPagoBankSlip';
import MercadoPagoCreditCardForm from '../components/checkout/MercadoPagoCreditCardForm';
import MercadoPagoSuccessfulPurchase from '../components/checkout/MercadoPagoSuccessfulPurchase';
import FormatPhone from '../utils/FormatPhone';
import { parseType } from '../utils/ParseType';
// import Review from '../components/checkout/Review';

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const alertContext = useContext(AlertContext);
  const { 
    setAlert,
    switchNotAllowedDialog
  } = alertContext;

  const cartContext = useContext(CartContext);
  const {
    courses,
    subtotal
  } = cartContext;

  const checkoutContext = useContext(CheckoutContext);
  const {
    registrationInfo,
    setRegistrationInfo,
    setPaymentMethod,
    paymentMethod
  } = checkoutContext;

  const [isError, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState(false);
  const [isCardInstatiated, setCardInstance] = useState(false);
  const [description, setDescription] = useState('');
  const [isRefreshed, setRefreshed] = useState(false);

  let isLoading = false;

  useEffect(() => {
    let userRegistrationInfo = localStorage.getItem('expresso-cursos-registration-info');

    if (userRegistrationInfo) {
      userRegistrationInfo = JSON.parse(userRegistrationInfo);

      switch (location.pathname) {
        case '/checkout/matricula':
          const parsedUserRegistrationInfo = Object.entries(userRegistrationInfo);

          parsedUserRegistrationInfo.forEach(info => {
            const input = document.querySelector(`[name="${info[0]}"]`);

            if (input && (!input.value || input.value === '')) {
              input.focus();
              document.execCommand('insertText', false, info[1]);
            };

            if ([
              'identificationType',
              'driversLicenseCategory',
              'country',
              'state'
            ].includes(info[0])) {
              let output = '';

              if (info[0] === 'identificationType') {
                output = (info[1] === 'PF')
                  ? 'Pessoa física'
                  : 'Pessoa jurídica'
              } else output = info[1];

              const siblingEl = input.parentElement.querySelector('div');
              
              if (siblingEl) {
                siblingEl.innerHTML = output;
                const obj = {
                  target: {}
                };
                obj.target.name = info[0];
                obj.target.value = info[1];
                setRegistrationInfo(obj);
              };
            };
          });

          if (userRegistrationInfo.addressNumber) {
            setTimeout(() => {
              let input = document.querySelector(`[name="addressNumber"]`);

              if (!input.value || input.value === '') {
                input.focus();
                document.execCommand('insertText', false, userRegistrationInfo.addressNumber);
              };

              input = document.querySelector(`[name="addressComplement"]`);

              if (!input.value || input.value === '') {
                input.focus();
                document.execCommand('insertText', false, userRegistrationInfo.addressComplement);
              };

              document.activeElement.blur();
            }, 500);
          };

          break;
        case '/checkout/pagamento':
          if (!isRefreshed) {
            const returnBtn = document.querySelector('#general-payment-previous-page');

            if (returnBtn) {
              returnBtn.click();

                const interval = setInterval(() => {
                  const isFormLoaded = (document.querySelector("[name='address']") !== null);
    
                  if (isFormLoaded) {
                    clearInterval(interval);
                    document.querySelector('.form-next-page').click();
                    setRefreshed(true);
                  };
                }, 1000)
              };
            };

          break;
      };
    } else if (location.pathname.includes('checkout/pagamento')) navigate('/checkout/matricula');
  }, [location.pathname]);

  useEffect(() => {
    const cart = localStorage.getItem('expresso-cursos-cart');

    if (!cart || JSON.parse(cart).length === 0) switchNotAllowedDialog({
      dialogTitle: 'Por favor, adicione algum dos nossos cursos ao carrinho',
      dialogText: 'Para que você possa fazer sua matrícula, é necessário clicar no botão "COMPRAR" do curso desejado. Os botões ficam na página inicial ou nas páginas de venda de cada curso.',
      dialogBtnText: 'Ver nossos cursos',
      redirectTo: '/',
      scrollTo: { scrollTo: 'courses' }
    });

    let description = '';

    courses.forEach((course, i) => {
      description += `${course[1].name} - ${parseType(course[1].type)}`;
      if (i !== (courses.length - 1)) description += ' / ';
    });

    setDescription(description);
  }, [courses]);

  useEffect(() => {
    if (isError) {
      setAlert({
        type: 'danger',
        text: errorMsg,
        time: 10000
      });
    }
  }, [isError]);

  const nextPage = (() => {
    isLoading = true;

    if (!isCardInstatiated) {
      loadCard();
      setCardInstance(true);
    };

    fetch(process.env.REACT_APP_BASE_URL + process.env.REACT_APP_POST_LEAD_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        registrationInfo,
        courses,
        subtotal
      }),
    }).then(response => {
      isLoading = false;
      return response.json();
    }).then(result => {
      isLoading = false;
      navigate('/checkout/pagamento');
    }).catch(error => {
      // add alert asking the user to get in touch via wpp cuz we are having issues
      isLoading = false;
      alert("Unexpected error\n"+JSON.stringify(error));
    });
  });

  const mercadopago = useMercadopago.v2(
    process.env.REACT_APP_MERCADO_PAGO_PUBLIC_KEY,
    { locale: 'pt-BR'}
  );

  const loadCard = (() => {
    setError(false);

    const cardForm = mercadopago.cardForm({
      amount: subtotal.toString(),
      autoMount: true,
      form: {
        id: "form-checkout",
        cardholderName: {
          id: "form-checkout__cardholderName",
          placeholder: "Titular do cartão",
        },
        cardholderEmail: {
          id: "form-checkout__cardholderEmail",
          placeholder: "E-mail",
        },
        cardNumber: {
          id: "form-checkout__cardNumber",
          placeholder: "Número do cartão",
        },
        expirationDate: {
          id: "form-checkout__expirationDate",
          placeholder: "Data de vencimento (MM/YYYY)",
        },
        securityCode: {
          id: "form-checkout__securityCode",
          placeholder: "Código de segurança",
        },
        installments: {
          id: "form-checkout__installments",
          placeholder: "Parcelas",
        },
        identificationType: {
          id: "form-checkout__identificationType",
          placeholder: "Tipo de documento",
        },
        identificationNumber: {
          id: "form-checkout__identificationNumber",
          placeholder: "Número do documento",
        },
        issuer: {
          id: "form-checkout__issuer",
          placeholder: "Banco emissor",
        },
      },
      callbacks: {
        onFormMounted: error => {
          if (error) return console.warn("Form Mounted handling error: ", error);
        },
        onSubmit: event => {
          event.preventDefault();

          const {
            paymentMethodId,
            issuerId: issuer_id,
            cardholderEmail: email,
            amount,
            token,
            installments,
            identificationNumber,
            identificationType,
          } = cardForm.getCardFormData();

          fetch(process.env.REACT_APP_BASE_URL + process.env.REACT_APP_MERCADO_PAGO_CREDIT_CARD_URL, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              registrationInfo,
              token,
              issuer_id,
              paymentMethodId,
              transactionAmount: Number(amount),
              installments: Number(installments),
              description: description,
              payer: {
                email,
                identification: {
                  type: identificationType,
                  number: identificationNumber,
                },
              },
            }),
          }).then(response => {
            isLoading = false;
            return response.json();
          }).then(result => {
            if(!result.hasOwnProperty('error_message')) {
              setError(false);
              localStorage.setItem('expresso-cursos-purchase-completed', true);
              navigate('/checkout/confirmacao-de-compra');
            } else {
              setErrorMsg(`Ocorreu um erro ao tentar realizar o pagamento. Por favor, confira seus dados e tente novamente. Se o erro persistir, entre em contato conosco pelo número ${FormatPhone(process.env.REACT_APP_CONTACT_NUMBER_MATEUS)}`)
              setError(true);
            };
            isLoading = false;
          }).catch(error => {
              isLoading = false;
              alert("Unexpected error\n"+JSON.stringify(error));
          });
        },
        onFetching: (resource) => {
          console.log("Fetching resource: ", resource);
        }
      },
    });
  });

  return (
    <div 
      id='checkout'
      className='container' 
      onSubmit={() => { isLoading = true }}
    >
      <h1 className='text-center font-weight-bold text-secondary py-3'>
        { location.pathname.includes('checkout/matricula') && 'Dados para a matrícula' }
        { location.pathname.includes('checkout/pagamento') && 'Dados para pagamento' }
        {/* { currentPage === 3 && 'Revise a sua compra' } */}
        { location.pathname.includes('checkout/confirmacao-de-compra') && 'Obrigado por comprar com a gente!' }
      </h1>
      <div className={location.pathname.includes('checkout/matricula') ?  'd-block' : 'd-none'}>
        <Registration nextPage={nextPage} />
      </div>
      <div className={location.pathname.includes('checkout/pagamento') ? 'd-block form-payment-info' : 'd-none'}>
        <div
          className={isLoading ? 'd-none' : 'payment-method bg-secondary p-3 my-3'}
          onChange={(e) => setPaymentMethod(e.target.value)}
        >
          <div className="form-radio">
            <input
              type="radio"
              value="PIX"
              name="paymentMethod"
              required
            />
            <label htmlFor="pix">PIX</label>
          </div>
          <div className="form-radio">              
            <input
              type="radio"
              value="Bank slip"
              name="paymentMethod"
              required
            />
            <label htmlFor="bank-slip">Boleto bancário</label>
          </div>
          <div className="form-radio">
            <input
              type="radio"
              value="Credit card"
              name="paymentMethod"
              required
            />
            <label htmlFor="credit-card">Cartão de crédito</label>
          </div>
        </div>
        <div className={(paymentMethod === 'PIX') ? 'pix-method' : 'd-none'}>
          <MercadoPagoPix />
        </div>
        <div className={(paymentMethod === 'Bank slip') ? 'bank slip-method' : 'd-none'}>
          <MercadoPagoBankSlip />
        </div>
        <div className={(paymentMethod === 'Credit card') ? 'credit-card-method' : 'd-none'}>
          <MercadoPagoCreditCardForm isLoading={isLoading}/>
        </div>
        {!paymentMethod && (
        <div className='btn-area d-flex align-items-center bg-secondary my-3 p-3'>
          <div className='btn-group d-flex'>
            <button
              id='general-payment-previous-page'
              className="form-previous-page contact-btn btn btn-remove d-flex align-items-center"
              type="button"
              onClick={() => navigate('/checkout/matricula')}
            >
              Voltar
            </button>
          </div>
        </div>
        )}
      </div>
      {/* { (currentPage === 3 ) &&
        <Review />
      } */}
      { location.pathname.includes('checkout/confirmacao-de-compra') &&
        <MercadoPagoSuccessfulPurchase />
      }
    </div>
  )
}

export default Checkout;