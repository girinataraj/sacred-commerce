import { Breadcrumbs } from '../../components/ui/breadcrumbs';
import { CartExperience } from '../../features/cart/cart-experience';
export default function CartPage(){return <main id="main-content" tabIndex={-1} className="container storefront-page cart-page"><Breadcrumbs items={[{label:'Home',href:'/'},{label:'Your cart'}]}/><div className="cart-intro"><p className="eyebrow">Thoughtful offerings, saved for you</p><h1>Your shopping cart</h1><p>Review your choices and clear, current prices. Take your time — your account keeps your cart.</p></div><CartExperience/></main>;}
