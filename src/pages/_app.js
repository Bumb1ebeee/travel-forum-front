import "@/styles/globals.css";
import {ToastContainer} from "react-toastify";

export default function App({ Component, pageProps }) {
  return <>
      <Component {...pageProps} />
    <ToastContainer
      position="top-right"
      autoClose={3000}
      hideProgressBar={false}
      newestOnTop
      closeOnClick
      rtl={false}
      pauseOnFocusLoss
      draggable
      pauseOnHover
    />
  </>;
}
