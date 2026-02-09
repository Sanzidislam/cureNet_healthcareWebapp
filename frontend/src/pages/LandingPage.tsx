import { Link } from 'react-router-dom';
import { APP_NAME } from '../utils/constants';
import {
  CalendarDaysIcon,
  UserGroupIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';

const features = [
  {
    icon: CalendarDaysIcon,
    title: 'Book appointments',
    description: 'Schedule with verified doctors at your convenience.',
  },
  {
    icon: UserGroupIcon,
    title: 'Trusted doctors',
    description: 'Connect with qualified healthcare professionals.',
  },
  {
    icon: ShieldCheckIcon,
    title: 'Secure & private',
    description: 'Your data is protected and confidential.',
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600">
      <main className="px-6 pb-24">
        <section className="flex flex-col items-center justify-center py-24 text-center text-white">
          <h1 className="text-4xl font-bold mb-4">Welcome to {APP_NAME}</h1>
          <p className="text-xl text-white/90 mb-8 max-w-xl">
            Your trusted healthcare platform. Book appointments and connect with doctors.
          </p>
          <div className="flex gap-4">
            <Link
              to="/register"
              className="rounded-lg bg-white px-6 py-3 font-semibold text-indigo-600 hover:bg-gray-100"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="rounded-lg border-2 border-white px-6 py-3 font-semibold hover:bg-white/10"
            >
              Sign In
            </Link>
          </div>
        </section>

        <section className="max-w-4xl mx-auto grid gap-8 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="rounded-xl bg-white/10 p-6 text-white backdrop-blur"
            >
              <Icon className="w-10 h-10 mb-3 text-white/90" />
              <h2 className="font-semibold mb-2">{title}</h2>
              <p className="text-sm text-white/80">{description}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
