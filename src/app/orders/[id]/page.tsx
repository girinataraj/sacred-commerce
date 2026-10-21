import {notFound} from 'next/navigation';
import {uuidSchema} from '../../../features/checkout/schemas';
import {OrderExperience} from '../../../features/customer/order-experience';
import {CustomerPage} from '../../../features/customer/shared';
export default async function OrderPage({params}:{params:Promise<{id:string}>}){const parsed=uuidSchema.safeParse((await params).id);if(!parsed.success)notFound();return <CustomerPage title="Your saved order" eyebrow="Every detail, clearly recorded" description="The saved outcome and immutable prices for your own demo purchase."><OrderExperience key={parsed.data} id={parsed.data}/></CustomerPage>;}
