import React from 'react';
import { motion } from 'motion/react';
import { X, ArrowLeft } from 'lucide-react';
import { useOverscrollBounce } from '../hooks/useOverscrollBounce';

interface FaqModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FaqModal: React.FC<FaqModalProps> = ({
  isOpen,
  onClose
}) => {
  const { containerRef } = useOverscrollBounce<HTMLDivElement>();

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
      transition={{ duration: 0.15, ease: "easeOut" }}
      className="fixed inset-0 z-50 flex flex-col bg-[#09050A] overflow-y-auto h-[var(--vv-height,100dvh)] max-h-[var(--vv-height,100dvh)]"
    >
      <div 
        ref={containerRef}
        className="w-full max-w-2xl mx-auto flex-1 flex flex-col pt-[54px] pb-[74px] px-4 sm:px-6 relative overflow-y-auto no-scrollbar touch-pan-y overscroll-contain"
      >
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-[2.5rem] leading-none tracking-tight font-bold text-white">
            FAQ
          </h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-white hover:text-[#777777] transition-colors focus:outline-none"
          >
            <X className="w-8 h-8 stroke-[3]" />
          </button>
        </div>

        <div className="space-y-10 text-white pb-20">
          
          <section className="space-y-3">
            <h3 className="text-xl font-bold text-[#d7ae4c]">What is Lisburn, and what makes it different?</h3>
            <p className="text-[15px] font-normal leading-relaxed text-[#A0A0A0]">
              Traditional calendars are built for fixed schedules, but many tasks; like changing your car oil, watering plants, or replacing air filters, happen irregularly. Lisburn takes the mental load out of tracking these tasks. Instead of strictly planning when something is <span className="italic">due</span>, Lisburn counts the days <span className="italic">since</span> you last did it. Whenever you're curious about when you last did something, just open the app!
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-xl font-bold text-[#d7ae4c]">How do I use Tasks?</h3>
            <p className="text-[15px] font-normal leading-relaxed text-[#A0A0A0]">
              You can add a task by tapping the "+" icon on the top right of the main page. From there, you can customize the task's name, choose a matching icon, write a brief description, and set the date you last did it.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-xl font-bold text-[#d7ae4c]">What are References?</h3>
            <p className="text-[15px] font-normal leading-relaxed text-[#A0A0A0]">
              A Reference is a helpful note attached to a specific completion date. For example, if you log an oil change, you could add "57,000 miles" as your reference.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-[15px] font-normal leading-relaxed text-[#A0A0A0]">
              <li>Every time you complete a task, tap "Mark done today" to log a new date and an optional reference.</li>
              <li>You can view all your past history by tapping on a task from the main screen.</li>
              <li>Made a mistake? You can easily edit or delete past dates and references directly from the task's history.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h3 className="text-xl font-bold text-[#d7ae4c]">Can Lisburn notify me when it's time to do a task again?</h3>
            <p className="text-[15px] font-normal leading-relaxed text-[#A0A0A0]">
              Yes! When adding or editing a task, you can set a reminder interval (e.g., "Every 3 Months"). When a task passes this interval, its time will turn red on your dashboard to show it's overdue. Make sure you have Notifications enabled in Settings to get a reminder.
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-xl font-bold text-[#d7ae4c]">Sorting, Syncing, and Backups</h3>
            <ul className="space-y-4 text-[15px] font-normal leading-relaxed text-[#A0A0A0]">
              <li>
                <strong className="text-white">Sorting:</strong> Tap the sort icon (next to Settings on the top left) to organize your tasks in various ways.
              </li>
              <li>
                <strong className="text-white">Account & Cloud Sync:</strong> Log in with your Google account to securely save your data. Everything automatically syncs across your devices in real-time, and there's a "Sync Now" button in Settings if you ever want to force a refresh.
              </li>
              <li>
                <strong className="text-white">Backup & Restore:</strong> If you prefer to stay offline, you can manually export and import your tasks as a JSON file in Settings.
              </li>
            </ul>
          </section>

        </div>
      </div>
    </motion.div>
  );
};
