
import React from 'react';
import { Volume2, Sparkles } from 'lucide-react';

interface RabbitMascotProps {
    mood: 'normal' | 'happy' | 'sad';
    message?: string;
    onSpeak?: () => void;
}

const RabbitMascot: React.FC<RabbitMascotProps> = ({ mood, message, onSpeak }) => (
    <div className="flex flex-col items-center mb-4 transition-all">
        <div className="relative group">
            <svg width="90" height="90" viewBox="0 0 200 200">
                <ellipse cx="70" cy="50" rx="15" ry="40" fill="#FFB6C1" transform="rotate(-10 70 50)" />
                <ellipse cx="130" cy="50" rx="15" ry="40" fill="#FFB6C1" transform="rotate(10 130 50)" />
                <circle cx="100" cy="110" r="60" fill="white" stroke="#FFB6C1" strokeWidth="2" />
                {mood === 'happy' ? (
                    <><path d="M75 105 Q85 95 95 105" stroke="#4A4A4A" strokeWidth="4" fill="none" /><path d="M105 105 Q115 95 125 105" stroke="#4A4A4A" strokeWidth="4" fill="none" /></>
                ) : mood === 'sad' ? (
                    <><circle cx="85" cy="110" r="4" fill="#4A4A4A" /><circle cx="115" cy="110" r="4" fill="#4A4A4A" /><path d="M90 135 Q100 125 110 135" stroke="#4A4A4A" strokeWidth="2" fill="none" /></>
                ) : (
                    <><circle cx="85" cy="110" r="6" fill="#4A4A4A" /><circle cx="115" cy="110" r="6" fill="#4A4A4A" /></>
                )}
                <circle cx="100" cy="122" r="4" fill="#FF69B4" />
                <path d="M90 135 Q100 145 110 135" stroke="#FF69B4" strokeWidth="2" fill="none" />
                <circle cx="65" cy="125" r="8" fill="#FFE4E1" opacity="0.8" />
                <circle cx="135" cy="125" r="8" fill="#FFE4E1" opacity="0.8" />
            </svg>
            {mood === 'happy' && <Sparkles className="absolute -top-2 -right-2 text-yellow-400 animate-pulse" size={24} />}
            {onSpeak && (
                <button
                    onClick={onSpeak}
                    className="absolute -bottom-2 -right-2 bg-pink-500 text-white p-2 rounded-full shadow-lg border-2 border-white active:scale-75 hover:bg-pink-400 transition-all z-10"
                >
                    <Volume2 size={18} />
                </button>
            )}
        </div>
        <div className="bg-white border-2 border-pink-100 rounded-2xl px-5 py-2 mt-2 shadow-sm relative text-center">
            <p className="text-pink-500 font-black text-xs leading-tight max-w-[160px]">
                {message || "30もん チャレンジ！"}
            </p>
            <div className="absolute -top-2 left-1/2 -translate-x-1/2 border-x-8 border-x-transparent border-b-8 border-b-white"></div>
        </div>
    </div>
);

export default RabbitMascot;
