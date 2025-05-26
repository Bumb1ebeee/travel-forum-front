import "@/styles/globals.css";
import MainLayout from "@/layouts/main.layout";

export default function App({ Component, pageProps }) {
  return <>
    <MainLayout>
      <Component {...pageProps} />
    </MainLayout>
  </>;
}
