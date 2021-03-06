import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import AlertContext from '../../context/alert/alertContext';
import CheckoutContext from '../../context/checkout/checkoutContext';

const Registration = ({ nextPage }) => {
  const alertContext = useContext(AlertContext);
  const { setAlert } = alertContext;

  const checkoutContext = useContext(CheckoutContext);
  const { 
    setRegistrationInfo,
    registrationInfo
  } = checkoutContext;

  const navigate = useNavigate();

  let isError = false;
  let errorMsg = '';

  const onChange = e => {
    if (e.target.name === 'zipCode' && e.target.value.length === 8 && registrationInfo.country === 'Brasil') {
      getCep(e.target.value);
    } 

    setRegistrationInfo(e);
  };

  const getCep = (cep) => {
    fetch(process.env.REACT_APP_CEP_API + cep + '/json/', {
      method: "GET"
    }).then((res) => {
      return res.json();
    }).then(data => {
      if (!data.hasOwnProperty('erro')) {
        const address = {
          target: {}
        };
        address.target.name = 'address';
        address.target.value = document.getElementById('form__address').value =`${data.logradouro}`;
        setRegistrationInfo(address);
        
        const addressComplement = {
          target: {}
        };

        addressComplement.target.name = 'addressComplement';
        addressComplement.target.value = document.getElementById('form__address-complement').value =`${data.complemento}`;
        setRegistrationInfo(addressComplement);

        const neighbourhood = {
          target: {}
        };
  
        neighbourhood.target.name = 'neighbourhood';
        neighbourhood.target.value = document.getElementById('form__neighbourhood').value =`${data.bairro}`;
        setRegistrationInfo(neighbourhood);
  
        const city = {
          target: {}
        };

        city.target.name = 'city';
        city.target.value = document.getElementById('form__city').value =`${data.localidade}`;
        setRegistrationInfo(city);

        const state = {
          target: {}
        };

        state.target.name = 'state';
        state.target.value = document.getElementById('form_state_brazil').value =`${data.uf}`;
        setRegistrationInfo(state);
      }
    }).catch((err) => {
      console.log('It was no possible to find the CEP:' + cep)
    })
  }

  const validateFields = (e) => {
    e.preventDefault();
    errorMsg = '';
    isError = true;

    const fields = Object.values(registrationInfo);

    const emptyFields = fields.filter((field) => {
      return field === '';
    });

    if (emptyFields.length >= 1 && registrationInfo.addressComplement !== '') { 
      errorMsg = 'Favor preencher todos os campos. O ??nico campo opcional ?? o de complemento.';
    } else if (registrationInfo.phoneNumber.length < 10) {
      errorMsg = 'Favor incluir o DDD. O n??mero do telefone deve conter, no m??nimo, 10 caracteres.';
    } else if (!registrationInfo.email.includes('@')) {
      errorMsg = 'Favor inserir um e-mail v??lido.';
    } else if (validateBirthday()) {
      errorMsg = 'Favor inserir a data de anivers??rio no formato DD/MM/AAAA, com as barras. Por exemplo: 01/01/2000. Voc?? precisa ser ter 21 anos completos para realizar a compra.';
    } else if (registrationInfo.identificationType === 'PF' && registrationInfo.identificationNumber.length !== 11) {
      errorMsg = 'Favor conferir o CPF inserido. O n??mero deve conter 11 caracteres, sem tra??os e pontos.';
    } else if (registrationInfo.identificationType === 'PJ' && registrationInfo.identificationNumber.length !== 14) {
      errorMsg = 'Favor conferir o CNPJ inserido. O n??mero deve conter 14 caracteres, sem tra??os e pontos.';
    } else if (registrationInfo.driversLicenseNumber.length !== 11) {
      errorMsg = 'Favor conferir o CNH inserido. O n??mero deve conter 11 caracteres, sem tra??os e pontos.';
    } else if (validateCNH()) {
      errorMsg = 'Favor inserir a de vencimento do CNH no formato DD/MM/AAAA. com as barras. Por exemplo: 01/01/2027. A sua CNH n??o pode estar vencida para realizar a compra.';
    } else if (registrationInfo.zipCode.length !== 8) {
      errorMsg = 'Favor conferir o n??mero do CEP inserido. O n??mero deve conter 8 caracteres, sem tra??os e pontos.';
    } else {
      isError = false;
    }

    if (!isError) {
      nextPage();
    } else {
      setAlert({
        type: 'danger',
        text: errorMsg,
        time: 5000
      });
    }; 
  }

  const validateBirthday = () => {
    const regex = /(((0|1)[0-9]|2[0-9]|3[0-1])\/(0[1-9]|1[0-2])\/((19|20)\d\d))$/;
    const { birthDate } = registrationInfo;

    if (regex.test(birthDate)) {
      const parts = birthDate.split("/");
      const dtDOB = new Date(parts[1] + "/" + parts[0] + "/" + parts[2]);
      const dtCurrent = new Date();

      if (dtCurrent.getFullYear() - dtDOB.getFullYear() < 21) return true;

      if (dtCurrent.getFullYear() - dtDOB.getFullYear() === 21) {
        if (dtCurrent.getMonth() < dtDOB.getMonth()) return true;

        if (dtCurrent.getMonth() === dtDOB.getMonth()) {
          if (dtCurrent.getDate() < dtDOB.getDate()) return true;
        }
      }
      return false;
    }

    return true;
  }

  const validateCNH = () => {
    const splicedDate = registrationInfo.driversLicenseExpiryDate.split('/');
    const formattedDate = moment(splicedDate[1] + '/' + splicedDate[0] + '/' + splicedDate[2]);

    if (!moment(formattedDate)._isValid) return true;

    const now = moment(new Date());
    
    const duration = moment.duration(formattedDate.diff(now));
    const days = duration.asDays();

    if (days < 0) return true;

    return false;
  }

  return (
    <form
      id="form-register"
      onSubmit={(e) => validateFields(e)}
    >
      <div className="form-basic-info bg-secondary p-3">
        <div className='form-group'>
          <div className='form-field'>
            <label
              htmlFor="form__full-name"
              className='font-weight-bold'
            >Nome completo<span className='text-danger'> *</span></label>
            <input
              id="form__full-name"
              type="text"
              name="fullName"
              required
              onChange={onChange}
            />
          </div>
          <div className='form-field'>
            <label
              htmlFor="form_phone"
              className='font-weight-bold'
            >Celular com DDD<span className='text-danger'> *</span></label>
            <input
              id="form_phone"
              type="text"
              name="phoneNumber"
              placeholder={`exemplo: ${process.env.REACT_APP_CONTACT_NUMBER_MATEUS.slice(2)}`}
              required
              onChange={onChange}
            />
          </div>
        </div>
        <div className='form-group'>
          <div className='form-field'>
            <label
              htmlFor="form-register__cardholderEmail"
              className='font-weight-bold'
            >E-mail<span className='text-danger'> *</span></label>
            <input
              id="form-register__cardholderEmail"
              type="text"
              name="email"
              required
              onChange={onChange}
            />
          </div>
          <div className='form-field'>
            <label
              htmlFor="form_birth-date"
              className='font-weight-bold'
            >Data de nascimento<span className='text-danger'> *</span></label>
            <input
              id="form_birth-date"
              type="text"
              placeholder="dd/mm/aaaa"
              name="birthDate"
              required
              onChange={onChange}
            />
          </div>
        </div>
        <div className='form-group'>
          <div className="form-field">
            <label
              htmlFor="form-register__identificationType"
              className='font-weight-bold'
            >Tipo de pessoa<span className='text-danger'> *</span></label>
            <select
              id="form-register__identificationType"
              name="identificationType"
              onChange={onChange}
            >
              <option value="PF">Pessoa f??sica</option>
              <option value="PJ">Pessoa jur??dica</option>
            </select>
          </div>
          <div className='form-field'>
            <label
              htmlFor="form-register__identificationNumber"
              className='font-weight-bold'
            >{registrationInfo.identificationType === 'PF' ? 'CPF' : 'CNPJ'}<span className='text-danger'> *</span></label>
            <input
              id="form-register__identificationNumber"
              type="number"
              name="identificationNumber"
              maxLength={registrationInfo.identificationType === 'PF' ? "11" : "14"}
              required
              onChange={onChange}
            />
          </div>
        </div>
        <div className='form-group'>
          <div className='form-field'>
            <label
              htmlFor="form_driver-license-number"
              className='font-weight-bold'
            >N??mero da CNH<span className='text-danger'> *</span></label>
            <input
              id="form_driver-license-number"
              type="text"
              name="driversLicenseNumber"
              required
              onChange={onChange}
            />
          </div>
          <div className='form-field'>
            <label
              htmlFor="form_driver-license-category"
              className='font-weight-bold'
            >Categoria da CNH<span className='text-danger'> *</span></label>
            <select
              id="form_drivers_license_category"
              name="driversLicenseCategory"
              onChange={onChange}
            >
              <option value="Categoria A">Categoria A</option>
              <option value="Categoria B">Categoria B</option>
              <option value="Categoria C">Categoria C</option>
              <option value="Categoria D">Categoria D</option>
              <option value="Categoria E">Categoria E</option>
              <option value="Categoria AB">Categoria AB</option>
              <option value="Categoria AC">Categoria AC</option>
              <option value="Categoria AD">Categoria AD</option>
              <option value="Categoria AE">Categoria AE</option>
              <option value="Permiss??o ACC">Permiss??o ACC</option>
            </select>
          </div>
          <div className='form-field'>
            <label
              htmlFor="form_driver-license-expiry-date"
              className='font-weight-bold'
            >Data de vencimento da CNH<span className='text-danger'> *</span></label>
            <input
              id="form_driver-license-expiry-date"
              type="text"
              placeholder="dd/mm/aaaa"
              name="driversLicenseExpiryDate"
              required
              onChange={onChange}
            />
          </div>
        </div>
        <div className='form-group'>
          <div className='form-field'>
            <label
              htmlFor="form__country"
              className='font-weight-bold'
            >Pa??s<span className='text-danger'> *</span></label>
            <select
              id="form__country"
              name="country"
              onChange={onChange}
            >
              <option value="Brasil">Brasil</option>
              <option value="Afeganist??o">Afeganist??o</option>
              <option value="??frica do Sul">??frica do Sul</option>
              <option value="Alb??nia">Alb??nia</option>
              <option value="Alemanha">Alemanha</option>
              <option value="Andorra">Andorra</option>
              <option value="Angola">Angola</option>
              <option value="Anguilla">Anguilla</option>
              <option value="Antilhas Holandesas">Antilhas Holandesas</option>
              <option value="Ant??rctida">Ant??rctida</option>
              <option value="Ant??gua e Barbuda">Ant??gua e Barbuda</option>
              <option value="Argentina">Argentina</option>
              <option value="Arg??lia">Arg??lia</option>
              <option value="Arm??nia">Arm??nia</option>
              <option value="Aruba">Aruba</option>
              <option value="Ar??bia Saudita">Ar??bia Saudita</option>
              <option value="Austr??lia">Austr??lia</option>
              <option value="??ustria">??ustria</option>
              <option value="Azerbaij??o">Azerbaij??o</option>
              <option value="Bahamas">Bahamas</option>
              <option value="Bahrein">Bahrein</option>
              <option value="Bangladesh">Bangladesh</option>
              <option value="Barbados">Barbados</option>
              <option value="Belize">Belize</option>
              <option value="Benim">Benim</option>
              <option value="Bermudas">Bermudas</option>
              <option value="Bielorr??ssia">Bielorr??ssia</option>
              <option value="Bol??via">Bol??via</option>
              <option value="Botswana">Botswana</option>
              <option value="Brunei">Brunei</option>
              <option value="Bulg??ria">Bulg??ria</option>
              <option value="Burkina Faso">Burkina Faso</option>
              <option value="Burundi">Burundi</option>
              <option value="But??o">But??o</option>
              <option value="B??lgica">B??lgica</option>
              <option value="B??snia e Herzegovina">B??snia e Herzegovina</option>
              <option value="Cabo Verde">Cabo Verde</option>
              <option value="Camar??es">Camar??es</option>
              <option value="Camboja">Camboja</option>
              <option value="Canad??">Canad??</option>
              <option value="Catar">Catar</option>
              <option value="Cazaquist??o">Cazaquist??o</option>
              <option value="Chade">Chade</option>
              <option value="Chile">Chile</option>
              <option value="China">China</option>
              <option value="Chipre">Chipre</option>
              <option value="Col??mbia">Col??mbia</option>
              <option value="Comores">Comores</option>
              <option value="Coreia do Norte">Coreia do Norte</option>
              <option value="Coreia do Sul">Coreia do Sul</option>
              <option value="Costa do Marfim">Costa do Marfim</option>
              <option value="Costa Rica">Costa Rica</option>
              <option value="Cro??cia">Cro??cia</option>
              <option value="Cuba">Cuba</option>
              <option value="Dinamarca">Dinamarca</option>
              <option value="Djibouti">Djibouti</option>
              <option value="Dominica">Dominica</option>
              <option value="Egito">Egito</option>
              <option value="El Salvador">El Salvador</option>
              <option value="Emirados ??rabes Unidos">Emirados ??rabes Unidos</option>
              <option value="Equador">Equador</option>
              <option value="Eritreia">Eritreia</option>
              <option value="Esc??cia">Esc??cia</option>
              <option value="Eslov??quia">Eslov??quia</option>
              <option value="Eslov??nia">Eslov??nia</option>
              <option value="Espanha">Espanha</option>
              <option value="Estados Federados da Micron??sia">Estados Federados da Micron??sia</option>
              <option value="Estados Unidos">Estados Unidos</option>
              <option value="Est??nia">Est??nia</option>
              <option value="Eti??pia">Eti??pia</option>
              <option value="Fiji">Fiji</option>
              <option value="Filipinas">Filipinas</option>
              <option value="Finl??ndia">Finl??ndia</option>
              <option value="Fran??a">Fran??a</option>
              <option value="Gab??o">Gab??o</option>
              <option value="Gana">Gana</option>
              <option value="Ge??rgia">Ge??rgia</option>
              <option value="Gibraltar">Gibraltar</option>
              <option value="Granada">Granada</option>
              <option value="Gronel??ndia">Gronel??ndia</option>
              <option value="Gr??cia">Gr??cia</option>
              <option value="Guadalupe">Guadalupe</option>
              <option value="Guam">Guam</option>
              <option value="Guatemala">Guatemala</option>
              <option value="Guernesei">Guernesei</option>
              <option value="Guiana">Guiana</option>
              <option value="Guiana Francesa">Guiana Francesa</option>
              <option value="Guin??">Guin??</option>
              <option value="Guin?? Equatorial">Guin?? Equatorial</option>
              <option value="Guin??-Bissau">Guin??-Bissau</option>
              <option value="G??mbia">G??mbia</option>
              <option value="Haiti">Haiti</option>
              <option value="Honduras">Honduras</option>
              <option value="Hong Kong">Hong Kong</option>
              <option value="Hungria">Hungria</option>
              <option value="Ilha Bouvet">Ilha Bouvet</option>
              <option value="Ilha de Man">Ilha de Man</option>
              <option value="Ilha do Natal">Ilha do Natal</option>
              <option value="Ilha Heard e Ilhas McDonald">Ilha Heard e Ilhas McDonald</option>
              <option value="Ilha Norfolk">Ilha Norfolk</option>
              <option value="Ilhas Cayman">Ilhas Cayman</option>
              <option value="Ilhas Cocos (Keeling)">Ilhas Cocos (Keeling)</option>
              <option value="Ilhas Cook">Ilhas Cook</option>
              <option value="Ilhas Fero??">Ilhas Fero??</option>
              <option value="Ilhas Ge??rgia do Sul e Sandwich do Sul">Ilhas Ge??rgia do Sul e Sandwich do Sul</option>
              <option value="Ilhas Malvinas">Ilhas Malvinas</option>
              <option value="Ilhas Marshall">Ilhas Marshall</option>
              <option value="Ilhas Menores Distantes dos Estados Unidos">Ilhas Menores Distantes dos Estados Unidos</option>
              <option value="Ilhas Salom??o">Ilhas Salom??o</option>
              <option value="Ilhas Virgens Americanas">Ilhas Virgens Americanas</option>
              <option value="Ilhas Virgens Brit??nicas">Ilhas Virgens Brit??nicas</option>
              <option value="Ilhas ??land">Ilhas ??land</option>
              <option value="Indon??sia">Indon??sia</option>
              <option value="Inglaterra">Inglaterra</option>
              <option value="??ndia">??ndia</option>
              <option value="Iraque">Iraque</option>
              <option value="Irlanda do Norte">Irlanda do Norte</option>
              <option value="Irlanda">Irlanda</option>
              <option value="Ir??">Ir??</option>
              <option value="Isl??ndia">Isl??ndia</option>
              <option value="Israel">Israel</option>
              <option value="It??lia">It??lia</option>
              <option value="I??men">I??men</option>
              <option value="Jamaica">Jamaica</option>
              <option value="Jap??o">Jap??o</option>
              <option value="Jersey">Jersey</option>
              <option value="Jord??nia">Jord??nia</option>
              <option value="Kiribati">Kiribati</option>
              <option value="Kuwait">Kuwait</option>
              <option value="Laos">Laos</option>
              <option value="Lesoto">Lesoto</option>
              <option value="Let??nia">Let??nia</option>
              <option value="Lib??ria">Lib??ria</option>
              <option value="Liechtenstein">Liechtenstein</option>
              <option value="Litu??nia">Litu??nia</option>
              <option value="Luxemburgo">Luxemburgo</option>
              <option value="L??bano">L??bano</option>
              <option value="L??bia">L??bia</option>
              <option value="Macau">Macau</option>
              <option value="Maced??nia">Maced??nia</option>
              <option value="Madag??scar">Madag??scar</option>
              <option value="Malawi">Malawi</option>
              <option value="Maldivas">Maldivas</option>
              <option value="Mali">Mali</option>
              <option value="Malta">Malta</option>
              <option value="Mal??sia">Mal??sia</option>
              <option value="Marianas Setentrionais">Marianas Setentrionais</option>
              <option value="Marrocos">Marrocos</option>
              <option value="Martinica">Martinica</option>
              <option value="Maurit??nia">Maurit??nia</option>
              <option value="Maur??cia">Maur??cia</option>
              <option value="Mayotte">Mayotte</option>
              <option value="Mold??via">Mold??via</option>
              <option value="Mong??lia">Mong??lia</option>
              <option value="Montenegro">Montenegro</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Mo??ambique">Mo??ambique</option>
              <option value="Myanmar">Myanmar</option>
              <option value="M??xico">M??xico</option>
              <option value="M??naco">M??naco</option>
              <option value="Nam??bia">Nam??bia</option>
              <option value="Nauru">Nauru</option>
              <option value="Nepal">Nepal</option>
              <option value="Nicar??gua">Nicar??gua</option>
              <option value="Nig??ria">Nig??ria</option>
              <option value="Niue">Niue</option>
              <option value="Noruega">Noruega</option>
              <option value="Nova Caled??nia">Nova Caled??nia</option>
              <option value="Nova Zel??ndia">Nova Zel??ndia</option>
              <option value="N??ger">N??ger</option>
              <option value="Om??">Om??</option>
              <option value="Palau">Palau</option>
              <option value="Palestina">Palestina</option>
              <option value="Panam??">Panam??</option>
              <option value="Papua-Nova Guin??">Papua-Nova Guin??</option>
              <option value="Paquist??o">Paquist??o</option>
              <option value="Paraguai">Paraguai</option>
              <option value="Pa??s de Gales">Pa??s de Gales</option>
              <option value="Pa??ses Baixos">Pa??ses Baixos</option>
              <option value="Peru">Peru</option>
              <option value="Pitcairn">Pitcairn</option>
              <option value="Polin??sia Francesa">Polin??sia Francesa</option>
              <option value="Pol??nia">Pol??nia</option>
              <option value="Porto Rico">Porto Rico</option>
              <option value="Portugal">Portugal</option>
              <option value="Quirguist??o">Quirguist??o</option>
              <option value="Qu??nia">Qu??nia</option>
              <option value="Reino Unido">Reino Unido</option>
              <option value="Rep??blica Centro-Africana">Rep??blica Centro-Africana</option>
              <option value="Rep??blica Checa">Rep??blica Checa</option>
              <option value="Rep??blica Democr??tica do Congo">Rep??blica Democr??tica do Congo</option>
              <option value="Rep??blica do Congo">Rep??blica do Congo</option>
              <option value="Rep??blica Dominicana">Rep??blica Dominicana</option>
              <option value="Reuni??o">Reuni??o</option>
              <option value="Rom??nia">Rom??nia</option>
              <option value="Ruanda">Ruanda</option>
              <option value="R??ssia">R??ssia</option>
              <option value="Saara Ocidental">Saara Ocidental</option>
              <option value="Saint Martin">Saint Martin</option>
              <option value="Saint-Barth??lemy">Saint-Barth??lemy</option>
              <option value="Saint-Pierre e Miquelon">Saint-Pierre e Miquelon</option>
              <option value="Samoa Americana">Samoa Americana</option>
              <option value="Samoa">Samoa</option>
              <option value="Santa Helena, Ascens??o e Trist??o da Cunha">Santa Helena, Ascens??o e Trist??o da Cunha</option>
              <option value="Santa L??cia">Santa L??cia</option>
              <option value="Senegal">Senegal</option>
              <option value="Serra Leoa">Serra Leoa</option>
              <option value="Seychelles">Seychelles</option>
              <option value="Singapura">Singapura</option>
              <option value="Som??lia">Som??lia</option>
              <option value="Sri Lanka">Sri Lanka</option>
              <option value="Suazil??ndia">Suazil??ndia</option>
              <option value="Sud??o">Sud??o</option>
              <option value="Suriname">Suriname</option>
              <option value="Su??cia">Su??cia</option>
              <option value="Su????a">Su????a</option>
              <option value="Svalbard e Jan Mayen">Svalbard e Jan Mayen</option>
              <option value="S??o Crist??v??o e Nevis">S??o Crist??v??o e Nevis</option>
              <option value="S??o Marino">S??o Marino</option>
              <option value="S??o Tom?? e Pr??ncipe">S??o Tom?? e Pr??ncipe</option>
              <option value="S??o Vicente e Granadinas">S??o Vicente e Granadinas</option>
              <option value="S??rvia">S??rvia</option>
              <option value="S??ria">S??ria</option>
              <option value="Tadjiquist??o">Tadjiquist??o</option>
              <option value="Tail??ndia">Tail??ndia</option>
              <option value="Taiwan">Taiwan</option>
              <option value="Tanz??nia">Tanz??nia</option>
              <option value="Terras Austrais e Ant??rticas Francesas">Terras Austrais e Ant??rticas Francesas</option>
              <option value="Territ??rio Brit??nico do Oceano ??ndico">Territ??rio Brit??nico do Oceano ??ndico</option>
              <option value="Timor-Leste">Timor-Leste</option>
              <option value="Togo">Togo</option>
              <option value="Tonga">Tonga</option>
              <option value="Toquelau">Toquelau</option>
              <option value="Trinidad e Tobago">Trinidad e Tobago</option>
              <option value="Tun??sia">Tun??sia</option>
              <option value="Turcas e Caicos">Turcas e Caicos</option>
              <option value="Turquemenist??o">Turquemenist??o</option>
              <option value="Turquia">Turquia</option>
              <option value="Tuvalu">Tuvalu</option>
              <option value="Ucr??nia">Ucr??nia</option>
              <option value="Uganda">Uganda</option>
              <option value="Uruguai">Uruguai</option>
              <option value="Uzbequist??o">Uzbequist??o</option>
              <option value="Vanuatu">Vanuatu</option>
              <option value="Vaticano">Vaticano</option>
              <option value="Venezuela">Venezuela</option>
              <option value="Vietname">Vietname</option>
              <option value="Wallis e Futuna">Wallis e Futuna</option>
              <option value="Zimbabwe">Zimbabwe</option>
              <option value="Z??mbia">Z??mbia</option>
            </select>
          </div>
          <div className='form-field'>
            <label
              htmlFor="form__zip-code"
              className='font-weight-bold'
            >CEP<span className='text-danger'> *</span></label>
            <input
              id="form__zip-code"
              type="text"
              name="zipCode"
              required
              onChange={onChange}
            />
          </div>
        </div>
        <div className={((registrationInfo.country === 'Brasil' && registrationInfo.zipCode.length === 8) || registrationInfo.country !== 'Brasil') ? 'd-block' : 'd-none'}>
          <div className='form-group'>
            <div className='form-field'>
              <label
                htmlFor="form__address"
                className='font-weight-bold'
              >Endere??o<span className='text-danger'> *</span></label>
              <input
                id="form__address"
                type="text"
                placeholder="Nome da rua"
                name="address"
                required={((registrationInfo.country === 'Brasil' && registrationInfo.zipCode.length === 8) || registrationInfo.country !== 'Brasil')}
                onChange={onChange}
              />
            </div>
            <div className='form-field'>
              <label
                htmlFor="form__address-number"
                className='font-weight-bold'
              >N??mero<span className='text-danger'> *</span></label>
              <input
                id="form__address-number"
                type="text"
                name="addressNumber"
                required={((registrationInfo.country === 'Brasil' && registrationInfo.zipCode.length === 8) || registrationInfo.country !== 'Brasil')}
                onChange={onChange}
              />
            </div>
            <div className='form-field'>
              <label
                htmlFor="form__address-complement"
                className='font-weight-bold'
              >Complemento (opcional)</label>
              <input
                id="form__address-complement"
                type="text"
                placeholder="Apartamento, su??te, unidade, bloco, etc... (opcional)"
                name="addressComplement"
                onChange={onChange}
              />
            </div>
          </div>
          <div className='form-group'>
            <div className='form-field'>
              <label
                htmlFor="form__neighbourhood"
                className='font-weight-bold'
              >Bairro<span className='text-danger'> *</span></label>
              <input
                id="form__neighbourhood"
                type="text"
                name="neighbourhood"
                required={((registrationInfo.country === 'Brasil' && registrationInfo.zipCode.length === 8) || registrationInfo.country !== 'Brasil')}
                onChange={onChange}
              />
            </div>
            <div className='form-field'>
              <label
                htmlFor="form__city"
                className='font-weight-bold'
              >Cidade<span className='text-danger'> *</span></label>
              <input
                id="form__city"
                type="text"
                name="city"
                required={((registrationInfo.country === 'Brasil' && registrationInfo.zipCode.length === 8) || registrationInfo.country !== 'Brasil')}
                onChange={onChange}
              />
            </div>
            <div className='form-field'>
              <label
                htmlFor={registrationInfo.country === 'Brasil' ? 'form_state_brazil' : 'form_state'}
                className='font-weight-bold'
              >Estado<span className='text-danger'> *</span></label>
              {registrationInfo.country === 'Brasil' ? (
              <select
                id="form_state_brazil"
                type="text"
                name="state"
                onChange={onChange}
              >
                <option value="AC">Acre</option>
                <option value="AL">Alagoas</option>
                <option value="AP">Amap??</option>
                <option value="AM">Amazonas</option>
                <option value="BA">Bahia</option>
                <option value="CE">Cear??</option>
                <option value="DF">Distrito Federal</option>
                <option value="ES">Esp??rito Santo</option>
                <option value="GO">Goi??s</option>
                <option value="MA">Maranh??o</option>
                <option value="MT">Mato Grosso</option>
                <option value="MS">Mato Grosso do Sul</option>
                <option value="MG">Minas Gerais</option>
                <option value="PA">Par??</option>
                <option value="PB">Para??ba</option>
                <option value="PR">Paran??</option>
                <option value="PE">Pernambuco</option>
                <option value="PI">Piau??</option>
                <option value="RJ">Rio de Janeiro</option>
                <option value="RN">Rio Grande do Norte</option>
                <option value="RS">Rio Grande do Sul</option>
                <option value="RO">Rond??nia</option>
                <option value="RR">Roraima</option>
                <option value="SC">Santa Catarina</option>
                <option value="SP">S??o Paulo</option>
                <option value="SE">Sergipe</option>
                <option value="TO">Tocantins</option>
              </select>
              ) : (
              <input
                id="form_state"
                type="text"
                name="state"
                required
                onChange={onChange}
              />
              )}
            </div>
          </div>
        </div>
      </div>
      <div className='btn-area d-flex align-items-center bg-secondary my-3 p-3'>
        <div className='btn-group d-flex'>
          <button
            className="form-previous-page contact-btn btn btn-remove d-flex align-items-center"
            type="button"
            onClick={() => navigate('/cart')}
          >
            Voltar
          </button>
          <button
            className="form-next-page btn btn-success text-white"
            type="submit"
          >
            Ir para o pagamento
          </button>
        </div>
      </div>
    </form>
  )
};

export default Registration;