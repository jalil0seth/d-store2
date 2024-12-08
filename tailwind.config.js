/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.{js,ts,jsx,tsx}',
    ],
    darkMode: 'class',
    theme: {
      extend: {
        colors: {
          primary: {
            DEFAULT: '#007BFF',
            50: '#E6F3FF',
            100: '#CCE7FF',
            200: '#99CFFF',
            300: '#66B7FF',
            400: '#339FFF',
            500: '#007BFF',
            600: '#0062CC',
            700: '#004A99',
            800: '#003166',
            900: '#001933'
          },
          secondary: {
            DEFAULT: '#6C757D',
            50: '#F8F9FA',
            100: '#E9ECEF',
            200: '#DEE2E6',
            300: '#CED4DA',
            400: '#ADB5BD',
            500: '#6C757D',
            600: '#495057',
            700: '#343A40',
            800: '#212529',
            900: '#000000'
          },
          accent: {
            DEFAULT: '#28A745',
            50: '#E3F8E5',
            100: '#C8F1CC',
            200: '#91E399',
            300: '#5AD666',
            400: '#28A745',
            500: '#1E7E34',
            600: '#145523',
            700: '#0A2C12',
            800: '#000000',
            900: '#000000'
          }
        },
        fontFamily: {
          sans: ['Inter', 'system-ui', 'sans-serif'],
          body: ['Roboto', 'system-ui', 'sans-serif']
        },
        spacing: {
          section: '4rem',
          component: '2rem'
        },
        animation: {
          'slide-up': 'slideUp 0.5s ease-out',
          'slide-down': 'slideDown 0.5s ease-out',
          'fade-in': 'fadeIn 0.5s ease-out',
          'float': 'float 3s ease-in-out infinite',
        },
        keyframes: {
          slideUp: {
            '0%': { transform: 'translateY(100%)', opacity: 0 },
            '100%': { transform: 'translateY(0)', opacity: 1 },
          },
          slideDown: {
            '0%': { transform: 'translateY(-100%)', opacity: 0 },
            '100%': { transform: 'translateY(0)', opacity: 1 },
          },
          fadeIn: {
            '0%': { opacity: 0 },
            '100%': { opacity: 1 },
          },
          float: {
            '0%, 100%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(-10px)' },
          },
        },
        backgroundImage: {
          'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
          'gradient-dots': 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)',
        },
        backgroundSize: {
          'dots-sm': '20px 20px',
          'dots-lg': '30px 30px',
        },
      },
    },
    plugins: [
      require('@tailwindcss/typography'),
    ],
}
