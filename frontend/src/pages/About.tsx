import { APP_NAME } from '../utils/constants';

export default function About() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">About {APP_NAME}</h1>
        <p className="text-gray-600 mb-4">
          {APP_NAME} is a healthcare platform connecting patients with doctors. Book appointments,
          manage your profile, and access care when you need it.
        </p>
        <p className="text-gray-600">
          This is a sample About page. You can expand it with your story, team, and mission.
        </p>
      </div>
    </div>
  );
}
