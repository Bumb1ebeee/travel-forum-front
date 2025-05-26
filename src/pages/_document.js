import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en" >
      <Head>
        <script
          src="https://api-maps.yandex.ru/2.1/?apikey=b6a3646e-c364-4407-b0b6-05e469ce3812&lang=ru_RU"
          async
          defer
        ></script>
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
