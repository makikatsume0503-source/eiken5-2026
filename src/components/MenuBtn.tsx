
import React from 'react';
import type { ReactNode } from 'react';

interface MenuBtnProps {
    title: string;
    sub: string;
    icon: ReactNode;
    color: string;
    onClick: () => void;
    badgeCount?: number;
}

const MenuBtn: React.FC<MenuBtnProps> = ({ title, sub, icon, color, onClick, badgeCount }) => (
    <button
        onClick={onClick}
        className="p-5 bg-white rounded-[35px] border-2 border-pink-50 shadow-sm hover:shadow-xl transition-all flex flex-col items-center text-center group active:scale-95 relative"
    >
        {badgeCount && badgeCount > 0 && (
            <div className="absolute top-2 right-2 bg-red-500 text-white text-[10px] font-black w-6 h-6 rounded-full flex items-center justify-center animate-pulse z-10 border-2 border-white">
                {badgeCount}
            </div>
        )}
        <div className={`${color} p-4 rounded-[22px] text-white mb-2 group-hover:scale-110 transition-transform shadow-md`}>
            {/* We assume the icon is an element that accepts size prop, 
          but for strict safety we might need to clone with explicit cast or just ensure it is passed correctly */}
            {/* React.cloneElement is used in the original code. 
          In TS, we can just render the icon if it's already an element, or use a render prop. 
          For compatibility with the original design which clones to inject size: */}
            {React.isValidElement(icon)
                ? React.cloneElement(icon as React.ReactElement<any>, { size: 28 })
                : icon}
        </div>
        <div className="font-black text-gray-700 text-sm tracking-tighter">{title}</div>
        <div className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{sub}</div>
    </button>
);

export default MenuBtn;
