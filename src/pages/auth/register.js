'use client';

import { useRouter } from 'next/navigation';
import RegisterForm from '@/components/auth/RegisterForm';
import MainLayout from '@/layouts/main.layout';
import Head from 'next/head';

export default function RegisterPage() {
  const router = useRouter();

  const handleSuccess = () => {
    router.push('/');
  };

  return (
    <>
      <Head>
        <title>Регистрация | Форум Путешествия по России</title>
        <meta name="description" content="Зарегистрируйтесь на сайте, чтобы получить доступ к полному функционалу." />
        <meta name="robots" content="noindex, nofollow" />
        <meta property="og:title" content="Регистрация | Форум Путешествия по России" />
        <meta property="og:description" content="Зарегистрируйтесь на сайте, чтобы получить доступ к полному функционалу." />
        <meta property="og:type" content="website" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="canonical" href="http://45.153.191.235/auth/register" />

        {/* Structured Data / Schema.org */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebPage",
            "name": "Регистрация",
            "description": "Зарегистрируйтесь на сайте, чтобы получить доступ к полному функционалу.",
            "url": "http://45.153.191.235/auth/register"
          })
        }} />
      </Head>

      <MainLayout>
        <main className="min-h-screen flex items-center justify-center">
          <div className="w-full max-w-md p-6">
            <RegisterForm onSuccess={handleSuccess} />
          </div>
        </main>
      </MainLayout>
    </>
  );
}