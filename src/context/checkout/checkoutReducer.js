import {
  CHANGE_PAGE,
  SET_REGISTRATION_INFO,
  SET_PAYMENT_INFO
} from '../types';

export const checkoutReducer = (state, action) => {
  switch(action.type) {
    case CHANGE_PAGE:
      return {
        ...state,
        currentPage: action.payload
      };
    case SET_REGISTRATION_INFO:
      return {
        ...state,
        registrationInfo: {
          ...state.registrationInfo,
          [action.payload.target.name]: action.payload.target.value
        }
      };
    case SET_PAYMENT_INFO:
      return {
        ...state,
        paymentInfo: action.payload
      };
    default:
      return state;
  }
}