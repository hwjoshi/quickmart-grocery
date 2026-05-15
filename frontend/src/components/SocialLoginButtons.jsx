export default function SocialLoginButtons() {
  const backendUrl = import.meta.env.VITE_API_BASE_URL.replace('/api', '');

  const handleSocialLogin = (provider) => {
    window.location.href = `${backendUrl}/auth/${provider}`;
  };

  return (
    <div className="space-y-3 mt-6">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => handleSocialLogin('google')}
          className="flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 mr-2" />
          Google
        </button>
        <button
          onClick={() => handleSocialLogin('facebook')}
          className="flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <img src="https://www.facebook.com/favicon.ico" alt="Facebook" className="w-5 h-5 mr-2" />
          Facebook
        </button>
      </div>
    </div>
  );
}