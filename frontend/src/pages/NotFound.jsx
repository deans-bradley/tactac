import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import { Button } from '../components/common';

export default function NotFound() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-200">404</h1>
        <h2 className="text-2xl font-bold text-gray-900 mt-4">Page Not Found</h2>
        <p className="text-gray-500 mt-2 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/">
          <Button>
            <Home className="w-4 h-4 mr-2" />
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
