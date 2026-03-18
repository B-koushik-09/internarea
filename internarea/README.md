# InternArea - Internshala Clone

InternArea is a comprehensive recruitment platform designed to help students find internships and full-time jobs. This project is a feature-rich and built using a modern full-stack architecture.

## 🚀 Features

### Authentication & Security
- **Secure Authentication**: Email/Password and Phone-based login support.
- **OTP-to-Email Flow**: Secure 6-digit OTP delivery directly to the user's registered email for both verification and password resets, ensuring compliance and trial-gateway ease.
- **Mobile Access Controls**: Time-restricted access for mobile users to enhance platform security.
- **Login History**: Tracks login devices, browsers, and IP addresses.

### Features
- **Internship & Job Discovery**: Browse and search through various categories like Big Brands, Engineering, Design, and Data Science.
- **Multilingual Support**: Real-time translation into multiple languages (Hindi, Spanish, French, etc.) with parallel API fetching and persistent caching for high performance.
- **Dynamic Content**: Listings for stipends, duration, start dates, and detailed job descriptions.
- **Application Management**: User-friendly application tracking for students.

## 🛠️ Technology Stack

### Frontend
- **Framework**: Next.js (Pages Router)
- **State Management**: Redux Toolkit
- **Styling**: Tailwind CSS
- **Animations/UI**: Lucide Icons, Swiper for interactive sliders, React Toastify for notifications.
- **Data Fetching**: Axios

### Backend
- **Server**: Node.js & Express
- **Database**: MongoDB (via Mongoose)
- **Security**: JSON Web Tokens (JWT) for session management.
- **Communication**: Brevo API for transactional emails (OTP delivery).

## 📦 Project Structure

```bash
├── backend/            
│   ├── Model/          
│   ├── Routes/         
│   └── utils/          
└── internarea/         
    ├── src/
    │   ├── Components/ 
    │   ├── Feature/    
    │   ├── pages/      
    │   └── utils/      
```

## ⚙️ Setup & Installation

### 1. Prerequisites
- Node.js installed
- MongoDB URI
- Brevo API Key (for email services)

### 2. Frontend Setup
```bash
cd internarea
npm install
npm run dev
```

### 3. Backend Setup
```bash
cd backend
npm install
node index.js
```

## 📜 Environment Variables
- `NEXT_PUBLIC_API_URL`: Points to your backend server.
- `MONGO_URI`: MongoDB connection string.
- `BREVO_API_KEY`: Key for email delivery service.
- `JWT_SECRET`: Secret for token generation.
