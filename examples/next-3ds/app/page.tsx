import { Checkout } from "./Checkout";
import css from "./styles.module.css";

export default function Home() {
  return (
    <>
      <h1 className={css.pageTitle}>Checkout</h1>
      <Checkout />
    </>
  );
}
