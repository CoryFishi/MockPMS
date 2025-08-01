# React Property Management Solution

This project is a web-based dashboard for managing property facilities and smart locks. It is built with **React** using **Vite** and **Tailwind CSS** and relies on **Supabase** for authentication and data storage.

#### Authentication Branch is current, main is behind 100+ commits

## Features

- Property management dashboard with facility, unit and visitor management
- SmartLock platform with device overview and reports
- User registration, login and password reset flows
- Role based access and admin pages
- Dark mode toggle and responsive layout

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/)
- A Supabase project (to provide API keys)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/youruser/MockPMS.git
   cd MockPMS
   ```
2. Install dependencies
   ```bash
   npm install
   ```
3. Create an `.env` file in the project root and define the following variables with your Supabase credentials & other:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_KEY=your_supabase_anon_key
   VITE_SUPABASE_SERVICE_KEY=your_supabase_service_key
   VITE_WEATHER_KEY=your_openweathermap_key
   VITE_RESEND_KEY=your_resend_key #This may be deprecated
   ```

### Running the App

Start the development server with:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

### Building for Production

Generate a production build using:
```bash
npm run build
```
The bundled output will be in the `dist` folder.

## Project Structure

```
src/
├─ app/               # App entry, global styles and Supabase client
├─ components/        # Reusable UI components
├─ context/           # React context providers
├─ features/          # Application features (admin, auth, pms, smartlock)
├─ hooks/             # Custom hooks
├─ pages/             # Route level pages
```

## License

This project is provided as-is under the MIT license.
