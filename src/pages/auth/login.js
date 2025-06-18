'use client';

import { useRouter } from 'next/navigation';
import LoginForm from '@/components/auth/LoginForm';
import MainLayout from '@/layouts/main.layout';
import Head from 'next/head';

export default function LoginPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/');
  };

  return (
    <>
      <Head>
        <title>Вход | Форум Путешествия по России</title>
        <meta name="description" content="Страница входа для авторизации на сайте. Введите логин и пароль." />
        <meta name="robots" content="noindex, nofollow" />
        <meta property="og:title" content="Вход | Форум Путешествия по России" />
        <meta property="og:description" content="Страница входа для авторизации на сайте. Введите логин и пароль." />
        <meta property="og:type" content="website" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="http://45.153.191.235/auth/login" />

        {/* Structured Data / Schema.org */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Вход",
            "description": "Страница входа для авторизации на сайте. Введите логин и пароль.",
            "url": "http://45.153.191.235/auth/login"
          })
        }} />
      </Head>

      <MainLayout>
        <main className="min-h-screen flex items-center justify-center">
          <div className="w-full max-w-md p-6">
            <LoginForm onSuccess={handleSuccess} />
          </div>
        </main>
      </MainLayout>
    </>
  );
}