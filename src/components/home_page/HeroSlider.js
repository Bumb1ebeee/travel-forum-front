import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

const slides = [
  {
    title: 'Делитесь своими путешествиями',
    description: 'Расскажите о своих приключениях по России, поделитесь впечатлениями и фотографиями',
    image: '/image/photo1.jpg'
  },
  {
    title: 'Получайте советы',
    description: 'Задавайте вопросы опытным путешественникам и получайте полезные рекомендации',
    image: '/image/photo2.jpg'
  },
  {
    title: 'Создавайте обсуждения',
    description: 'Общайтесь с единомышленниками, делитесь опытом и находите новых друзей',
    image: '/image/photo3.jpg'
  }
];

export default function HeroSlider() {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="relative h-[500px] w-full overflow-hidden rounded-xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          <Image
            src={slides[currentSlide].image}
            alt={slides[currentSlide].title}
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="text-center text-white">
              <h1 className="mb-4 text-4xl font-bold">{slides[currentSlide].title}</h1>
              <p className="text-xl">{slides[currentSlide].description}</p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
      
      <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`h-2 w-2 rounded-full transition-colors ${
              currentSlide === index ? 'bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </div>
    </div>
  );
} 