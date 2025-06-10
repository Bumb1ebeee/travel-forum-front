'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

const slides = [
  {
    title: 'Делитесь своими путешествиями',
    description: 'Расскажите о своих приключениях по России, поделитесь впечатлениями и фотографиями',
    image: '/image/photo1.jpg',
  },
  {
    title: 'Получайте советы',
    description: 'Задавайте вопросы опытным путешественникам и получайте полезные рекомендации',
    image: '/image/photo2.jpg',
  },
  {
    title: 'Создавайте обсуждения',
    description: 'Общайтесь с единомышленниками, делитесь опытом и находите новых друзей',
    image: '/image/photo3.jpg',
  },
];

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Автоматическая смена слайдов
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Проверка ширины экрана (синхронизация с SidebarLayout: 768px)
  useEffect(() => {
    const checkIsMobile = () => setIsMobile(window.innerWidth < 768);
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return (
    <div className="relative w-full overflow-hidden rounded-xl bg-black">
      <div className={`relative ${isMobile ? 'h-[250px]' : 'h-[400px] sm:h-[500px]'}`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <div className="relative w-full h-full overflow-hidden">
              <Image
                src={slides[currentSlide].image}
                alt={slides[currentSlide].title}
                fill
                style={{ objectFit: 'cover', objectPosition: 'center' }}
                className="w-full h-full"
                sizes="100vw"
                priority
              />
            </div>
            {/* Тёмный overlay */}
            <div className="absolute inset-0 bg-black/50" />

            {/* Текст поверх */}
            <div className="absolute inset-0 flex items-center justify-center px-4">
              <div className="text-center text-white max-w-lg mx-auto">
                <h1
                  className={`mb-2 font-bold leading-tight ${
                    isMobile ? 'text-lg' : 'text-3xl sm:text-4xl'
                  }`}
                >
                  {slides[currentSlide].title}
                </h1>
                <p className={`${isMobile ? 'text-xs' : 'text-base sm:text-xl'} px-2`}>
                  {slides[currentSlide].description}
                </p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Индикаторы слайдов */}
        <div className="absolute bottom-2 sm:bottom-4 left-1/2 flex -translate-x-1/2 space-x-2 z-10">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-1.5 sm:h-2 w-1.5 sm:w-2 rounded-full transition-colors ${
                currentSlide === index ? 'bg-white' : 'bg-white/50'
              }`}
              aria-label={`Перейти к слайду ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}