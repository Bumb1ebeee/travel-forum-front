import React, { useEffect, useRef } from 'react';

const RouteMap = ({ mapStart, mapEnd }) => {
  const mapRef = useRef(null);

  useEffect(() => {
    if (mapStart && mapEnd && window.ymaps && mapRef.current) {
      ymaps.ready(() => {
        const map = new ymaps.Map(mapRef.current, {
          center: [55.751244, 37.618423], // Москва по умолчанию
          zoom: 8,
        });

        const multiRoute = new ymaps.multiRouter.MultiRoute(
          {
            referencePoints: [mapStart, mapEnd],
            params: {
              routingMode: 'auto', // Автомобильный маршрут
            },
          },
          {
            boundsAutoFit: true, // Автоматическая подгонка масштаба
          }
        );

        map.geoObjects.add(multiRoute);
      });
    }
  }, [mapStart, mapEnd]);

  return (
    <div className="mb-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-2">Маршрут</h3>
      <div ref={mapRef} className="w-full h-96 rounded-lg shadow-inner"></div>
    </div>
  );
};

export default RouteMap;