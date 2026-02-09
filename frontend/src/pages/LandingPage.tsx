import { Link } from 'react-router-dom';
import {
  UserGroupIcon,
  BeakerIcon,
  CircleStackIcon,
  UserIcon,
  CpuChipIcon,
  HeartIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';

const HERO_IMAGE = 'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/v0o8XbXdnI/0ngpry2q_expires_30_days.png';
const FEATURE_LEFT = 'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/v0o8XbXdnI/z3yn2juq_expires_30_days.png';
const FEATURE_CENTER = 'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/v0o8XbXdnI/p01zq15x_expires_30_days.png';
const FEATURE_RIGHT = 'https://storage.googleapis.com/tagjs-prod.appspot.com/v1/v0o8XbXdnI/w578ixvp_expires_30_days.png';

const FEATURES = [
  { image: FEATURE_LEFT, title: 'Find a Doctor', description: 'Browse our list of trusted doctors and choose the right one for your needs.' },
  { image: FEATURE_CENTER, title: 'View Doctor Profile', description: 'Learn about doctors\' experience, specialities and availability.' },
  { image: FEATURE_RIGHT, title: 'Book Appointment', description: 'Schedule your consultation at a time that works for you.' },
];

const SPECIALTIES = [
  { name: 'Dermatologist', icon: BeakerIcon },
  { name: 'Gastroenterologist', icon: CircleStackIcon },
  { name: 'Pediatricians', icon: UserIcon },
  { name: 'Neurologist', icon: CpuChipIcon },
  { name: 'Gynecologist', icon: HeartIcon },
  { name: 'General', icon: AcademicCapIcon },
];

const TOP_DOCTORS = [
  { name: 'Dr. Richard James', specialty: 'General physician', available: true },
  { name: 'Dr. Richard James', specialty: 'General physician', available: true },
  { name: 'Dr. Richard James', specialty: 'General physician', available: false },
  { name: 'Dr. Richard James', specialty: 'General physician', available: true },
  { name: 'Dr. Richard James', specialty: 'General physician', available: true },
];

export default function LandingPage() {
  return (
    <div className="flex flex-col bg-white min-h-screen">
      {/* ================= HERO ================= */}
      <section className="flex flex-wrap items-start justify-center gap-6 max-w-[1200px] w-full mx-auto px-4 mb-24 mt-6">
        <div className="flex flex-col md:flex-row items-start self-stretch w-full rounded-[30px] border-[10px] border-[#3990D7] overflow-hidden bg-white">
          <div className="flex flex-col mt-[55px] ml-[46px] mr-[45px] mb-8 md:mb-0">
            <h1 className="text-[#3890D7] text-4xl md:text-[33px] font-bold max-w-[365px] mb-6 leading-tight">
              Healthcare, Simplified for Everyone
            </h1>
            <p className="text-black text-lg max-w-[320px] mb-[38px]">
              Simply browse through our extensive list of trusted doctors,
              schedule your appointment hassle-free.
            </p>
            <Link
              to="/register"
              className="inline-flex justify-center bg-[#3990D7] text-white text-lg font-bold py-2.5 px-8 rounded-[47px] hover:bg-[#2d7ab8] transition-colors"
            >
              Explore now
            </Link>
          </div>
          <img
            src={HERO_IMAGE}
            className="flex-1 min-w-[280px] max-w-full h-auto md:h-[400px] mt-6 object-contain"
            alt="Healthcare professionals"
          />
        </div>
      </section>

      {/* ================= PROVIDING THE BEST MEDICAL SERVICES ================= */}
      <section className="flex flex-col items-center mb-16 px-4">
        <h2 className="text-[#3990D7] text-1xl md:text-[44px] font-bold text-center mb-4">
          Providing the best medical services
        </h2>
        <p className="text-gray-600 text-xl md:text-2xl text-center max-w-[528px] mb-12">
          Simply browse through our extensive list of trusted doctors,
          schedule your appointment hassle-free.
        </p>
        <div className="flex flex-col md:flex-row justify-center items-stretch gap-8 max-w-[1200px] w-full">
          {FEATURES.map(({ image, title, description }) => (
            <div
              key={title}
              className="flex flex-col items-center rounded-2xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <img src={image} alt={title} className="w-full max-w-[284px] h-[200px] md:h-[240px] object-contain" />
              <h3 className="text-[#3990D7] font-bold text-lg mt-4 mb-2">{title}</h3>
              <p className="text-gray-600 text-sm text-center">{description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= FIND BY SPECIALITY ================= */}
      <section className="flex flex-col items-center bg-white py-8 mb-16 px-4">
        <h2 className="text-[#2196F3] text-3xl md:text-[44px] font-bold text-center mb-2">
          Find by Speciality
        </h2>
        <p className="text-[#495565] text-xl md:text-[27px] mb-8 text-center">
          Browse through our list of specialized doctors
        </p>
        <div className="flex  justify-center gap-4 mb-8 max-w-5xl">
          {SPECIALTIES.map(({ name, icon: Icon }) => (
            <div
              key={name}
              className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white px-8 py-6 min-w-[140px] shadow-sm hover:shadow-md hover:border-[#3990D7] transition-all"
            >
              <Icon className="w-12 h-12 text-[#3990D7] mb-2" />
              <span className="text-gray-700 font-medium text-center text-sm md:text-base">{name}</span>
            </div>
          ))}
        </div>
        <Link
          to="/app/doctors"
          className="bg-[#EAEFFF] text-gray-700 text-xl font-medium py-[17px] px-[84px] rounded-[50px] hover:bg-[#d5dcff] transition-colors"
        >
          more
        </Link>
      </section>

      {/* ================= TOP DOCTORS TO BOOK ================= */}
      <section className="flex flex-col items-center py-8 mb-16 px-4">
        <h2 className="text-[#2196F3] text-3xl md:text-[44px] font-bold text-center mb-2">
          Top Doctors to Book
        </h2>
        <p className="text-[#495565] text-xl md:text-[27px] mb-8 text-center ">
          Simply browse through our extensive list of trusted doctors.
        </p>
        <div className="flex  justify-center gap-6 mb-8 max-w-6xl">
          {TOP_DOCTORS.map((doctor, i) => (
            <div
              key={i}
              className="flex flex-col rounded-2xl border border-gray-200 bg-white overflow-hidden w-[200px] md:w-[220px] shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="h-48 bg-gray-100 flex items-center justify-center">
                <UserGroupIcon className="w-16 h-16 text-gray-400" />
              </div>
              <div className="p-4">
                {doctor.available && (
                  <span className="inline-block text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded mb-2">
                    Available
                  </span>
                )}
                <h3 className="font-bold text-gray-900">{doctor.name}</h3>
                <p className="text-sm text-gray-600">{doctor.specialty}</p>
              </div>
            </div>
          ))}
        </div>
        <Link
          to="/app/doctors"
          className="bg-[#EAEFFF] text-gray-700 text-xl font-medium py-[17px] px-[84px] rounded-[50px] hover:bg-[#d5dcff] transition-colors"
        >
          more
        </Link>
      </section>

      {/* ================= CTA BANNER ================= */}
      <section className="flex flex-col items-center bg-[#3990D7] py-12 md:py-16 gap-8 mx-4 mb-20 rounded-xl ">
        <h2 className="text-white text-3xl md:text-[52px] font-bold text-center px-4">
          Book Appointment With 100+ Trusted Doctors
        </h2>
        <Link
          to="/register"
          className="bg-white text-gray-700 text-xl font-medium py-[17px] px-10 rounded-[50px] hover:bg-gray-100 transition-colors"
        >
          Create account
        </Link>
      </section>
    </div>
  );
}
