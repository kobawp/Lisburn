import React from 'react';
import { 
  Droplets, 
  Car, 
  Sparkles, 
  Smile, 
  Filter, 
  Wrench, 
  Heart, 
  Clock, 
  Calendar, 
  Scissors, 
  CheckCircle2, 
  Laptop, 
  Dog, 
  Shield, 
  Flame, 
  Sun, 
  Book, 
  Activity,
  LucideProps
} from 'lucide-react';
import { IconName } from '../types';

interface TaskIconProps extends LucideProps {
  name: IconName | string;
}

export const TaskIcon: React.FC<TaskIconProps> = ({ name, className = 'w-5 h-5', ...props }) => {
  if (!name) return <span className="select-none text-lg leading-none">📌</span>;

  switch (name) {
    case 'Droplets':
      return <Droplets className={className} {...props} />;
    case 'Car':
      return <Car className={className} {...props} />;
    case 'Sparkles':
      return <Sparkles className={className} {...props} />;
    case 'Smile':
      return <Smile className={className} {...props} />;
    case 'Filter':
      return <Filter className={className} {...props} />;
    case 'Wrench':
      return <Wrench className={className} {...props} />;
    case 'Heart':
      return <Heart className={className} {...props} />;
    case 'Clock':
      return <Clock className={className} {...props} />;
    case 'Calendar':
      return <Calendar className={className} {...props} />;
    case 'Scissors':
      return <Scissors className={className} {...props} />;
    case 'CheckCircle2':
      return <CheckCircle2 className={className} {...props} />;
    case 'Laptop':
      return <Laptop className={className} {...props} />;
    case 'Dog':
      return <Dog className={className} {...props} />;
    case 'Shield':
      return <Shield className={className} {...props} />;
    case 'Flame':
      return <Flame className={className} {...props} />;
    case 'Sun':
      return <Sun className={className} {...props} />;
    case 'Book':
      return <Book className={className} {...props} />;
    case 'Activity':
      return <Activity className={className} {...props} />;
    default:
      return <span className="select-none text-lg leading-none">{name}</span>;
  }
};

export const POPULAR_EMOJIS: string[] = [
  '📌', '🪴', '🚗', '🧹', '💊', '☕️', '💻', '🐶', 
  '🔧', '💧', '📅', '🔋', '🏋️', '🎨', '✈️', '🏠', 
  '🍔', '🎁', '📖', '✨', '❤️', '⚙️', '🔑', '🛒'
];

