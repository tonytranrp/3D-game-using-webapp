import React, { useState, useEffect } from 'react';
import { Alert } from '@/components/ui/alert';

const GameUI = () => {
  const [points, setPoints] = useState(100);
  const [isOnRoad, setIsOnRoad] = useState(true);
  const [message, setMessage] = useState('');
  
  useEffect(() => {
    const handlePoints = (e) => {
      const { detail } = e;
      setPoints(prev => {
        const newPoints = prev + detail.points;
        if (newPoints <= 0) {
          setMessage('Test Failed - Insufficient Points');
          document.dispatchEvent(new CustomEvent('gameOver', { detail: { success: false }}));
        } else if (newPoints >= 500) {
          setMessage('Congratulations! You earned your license!');
          document.dispatchEvent(new CustomEvent('gameOver', { detail: { success: true }}));
        }
        return newPoints;
      });
    };
    
    document.addEventListener('updatePoints', handlePoints);
    return () => document.removeEventListener('updatePoints', handlePoints);
  }, []);

  return (
    <div className="fixed top-4 right-4 bg-black bg-opacity-75 p-4 rounded-lg text-white">
      <div className="mb-2">Points: {points}</div>
      {message && (
        <Alert className="mt-2">
          <p className="text-sm font-semibold">{message}</p>
        </Alert>
      )}
    </div>
  );
};

export default GameUI;