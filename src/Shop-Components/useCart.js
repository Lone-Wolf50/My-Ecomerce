import { useContext } from 'react';
import CartContext from './CartContext';

export default function useCart() {
    return useContext(CartContext);
}