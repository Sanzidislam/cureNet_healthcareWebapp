import { APP_NAME } from '../utils/constants';

export default function Contact() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Contact us</h1>
        <p className="text-gray-600 mb-6">
          Get in touch with the {APP_NAME} team. This is a sample Contact page.
        </p>
        <div className="space-y-2 text-gray-600">
          <p>Email: support@curenet.example.com</p>
          <p>Phone: +1 (000) 000-0000</p>
          <p>Address: Sample Street 123, City, Country</p>
        </div>
      </div>
    </div>
  );
}
