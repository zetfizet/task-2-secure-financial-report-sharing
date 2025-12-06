# 🔐 Secure Data Sharing System

A full-stack web application for secure file sharing between organizations and consultants using hybrid encryption (RSA-2048 + AES-256-CBC). Organizations can upload encrypted files, and consultants can request access with approval-based decryption.

![Version](https://img.shields.io/badge/version-2.3-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)
![MongoDB](https://img.shields.io/badge/mongodb-%3E%3D6.0-green)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Security](#-security)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [API Endpoints](#-api-endpoints)
- [Usage Flow](#-usage-flow)
- [Security Notes](#-security-notes)
- [Contributing](#-contributing)
- [License](#-license)



## ✨ Features

### **Core Features:**
- 🔐 **Hybrid Encryption**: RSA-2048 for key exchange + AES-256-CBC for file encryption
- 📁 **File Upload**: Support for any file type (max 10MB)
- 👥 **Role-Based Access**: Organization and Consultant roles
- ✅ **Access Control**: Request-approval workflow for file access
- 🔑 **Secure Key Management**: Private keys encrypted with user passwords
- 📥 **Secure Download**: End-to-end encrypted file transmission

### **UI/UX Features:**
- 🎨 **Modern UI**: Clean and professional interface with soft colors
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile
- 🔔 **Toast Notifications**: Real-time feedback for all actions
- 🌐 **Intuitive Dashboard**: Separate dashboards for organizations and consultants
- 🚀 **Fast Performance**: Optimized frontend with React + Vite

### **Security Features:**
- 🛡️ **End-to-End Encryption**: Files never stored in plaintext
- 🔒 **JWT Authentication**: Secure token-based authentication
- 🔐 **Password-Protected Keys**: Private keys encrypted with user passwords
- ✅ **Access Logging**: Track all file access requests
- 🚫 **No Data Leakage**: Separate database for encryption keys



## 🛠 Tech Stack

### **Backend:**
| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | Runtime environment |
| **Express.js** | 4.18+ | Web framework |
| **MongoDB** | 6.0+ | Database (user data, files metadata) |
| **Mongoose** | 8.0+ | MongoDB ODM |
| **JWT** | 9.0+ | Authentication tokens |
| **Multer** | 1.4+ | File upload handling |
| **Node-RSA** | 1.1+ | RSA encryption |
| **Crypto** | Built-in | AES encryption |
| **bcryptjs** | 2.4+ | Password hashing |

### **Frontend:**
| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.2+ | UI framework |
| **Vite** | 5.0+ | Build tool & dev server |
| **Axios** | 1.6+ | HTTP client |
| **React Router** | 6.0+ | (Optional) Client-side routing |

### **Development Tools:**
- **nodemon**: Auto-restart on code changes
- **ESLint**: Code linting
- **Prettier**: Code formatting

### **Key Security Features:**
- **RSA-2048**: Asymmetric encryption for key exchange
- **AES-256-CBC**: Symmetric encryption for files
- **Password-Protected Keys**: Private keys never stored in plaintext
- **JWT Tokens**: Secure session management
- **Bcrypt**: Password hashing with salt
- **Separate Databases**: User data and encryption keys isolated

---

## 📁 Project Structure

```
secure-data-sharing/
│
├── backend/
│   ├── config/
│   │   └── db.js                    # Database connections
│   │
│   ├── controllers/
│   │   ├── authController.js        # Authentication logic
│   │   ├── reportController.js      # File upload/management
│   │   └── accessController.js      # Access requests/approval
│   │
│   ├── middleware/
│   │   └── auth.js                  # JWT verification
│   │
│   ├── models/
│   │   ├── User.js                  # User model (name, role, public key)
│   │   ├── Report.js                # File metadata
│   │   ├── AccessRequest.js         # Access request model
│   │   └── PrivateKey.js            # Encrypted private keys
│   │
│   ├── routes/
│   │   ├── auth.js                  # Auth routes
│   │   ├── reports.js               # Report routes
│   │   └── access.js                # Access routes
│   │
│   ├── services/
│   │   └── encryptionService.js     # RSA + AES encryption
│   │
│   ├── uploads/                     # Temporary file storage
│   ├── .env                         # Environment variables
│   ├── .env.example                 # Environment template
│   ├── server.js                    # Express app entry point
│   └── package.json                 # Backend dependencies
│
├── frontend/
│   ├── public/
│   │   └── vite.svg                 # App icon
│   │
│   ├── src/
│   │   ├── components/
│   │   │   ├── OrganizationDashboard.jsx
│   │   │   ├── ConsultantDashboard.jsx
│   │   │   ├── AccessRequestButton.jsx
│   │   │   ├── ApproveButton.jsx
│   │   │   └── NotificationContainer.jsx
│   │   │
│   │   ├── services/
│   │   │   └── api.js               # Axios instance + API calls
│   │   │
│   │   ├── App.jsx                  # Main app component
│   │   ├── App.css                  # Global styles
│   │   ├── main.jsx                 # React entry point
│   │   └── index.css                # Base styles
│   │
│   ├── .env                         # Frontend env variables
│   ├── .env.example                 # Frontend env template
│   ├── vite.config.js               # Vite configuration
│   └── package.json                 # Frontend dependencies
│
├── .gitignore
├── README.md                        # This file
└── LICENSE
```


## 📦 Prerequisites

Before you begin, ensure you have installed:

- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher)
- **MongoDB** (v6.0 or higher)
  - Local installation, or
  - MongoDB Atlas account (cloud)

### **Check Versions:**
```bash
node --version    # Should be >= 18.0.0
npm --version     # Should be >= 9.0.0
mongo --version   # Should be >= 6.0
```

## 🚀 Installation

### **1. Clone Repository**
```bash
git clone https://github.com/yourusername/secure-data-sharing.git
cd secure-data-sharing
```

### **2. Backend Setup**
```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env with your configuration
nano .env  # or use your preferred editor
```

**Backend `.env` Configuration:**
```env
# Server
PORT=5000
NODE_ENV=development

# MongoDB URIs
MONGODB_URI=mongodb://localhost:27017/secure_data_sharing
MONGODB_KEYS_URI=mongodb://localhost:27017/encryption_keys

# JWT Secret (generate a strong random string)
JWT_SECRET=your_super_secret_jwt_key_min_32_characters

# File Upload
MAX_FILE_SIZE=10485760  # 10MB in bytes
UPLOAD_PATH=./uploads
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### **3. Frontend Setup**
```bash
# Navigate to frontend folder (from project root)
cd frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Edit .env
nano .env
```

**Frontend `.env` Configuration:**
```env
VITE_API_URL=http://localhost:5000/api
```

---

## ⚙️ Configuration

### **MongoDB Setup:**

#### **Option A: Local MongoDB**
```bash
# Start MongoDB service
sudo systemctl start mongod     # Linux
brew services start mongodb-community  # macOS

# Verify MongoDB is running
mongosh
```

#### **Option B: MongoDB Atlas (Cloud)**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a cluster
3. Get connection string
4. Update `.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/secure_data_sharing
MONGODB_KEYS_URI=mongodb+srv://username:password@cluster.mongodb.net/encryption_keys
```

### **CORS Configuration** (if frontend on different domain):
In `backend/server.js`, update CORS settings:
```javascript
const corsOptions = {
  origin: 'http://your-frontend-domain.com',
  credentials: true
};
app.use(cors(corsOptions));
```

---

## 🏃 Running the Application

### **Development Mode:**

#### **Option 1: Run Separately**

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Server running on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Frontend running on http://localhost:5173
```

#### **Option 2: Run Concurrently (from root)**
```bash
# Install concurrently (if not already)
npm install -g concurrently

# Run both
concurrently "cd backend && npm run dev" "cd frontend && npm run dev"
```

### **Production Mode:**

**Build Frontend:**
```bash
cd frontend
npm run build
# Creates optimized build in dist/ folder
```

**Server Frontend (Option 1 - Static Server):**
```bash
# Install serve globally
npm install -g serve

# Server the build
serve -s dist -p 3000
```

**Serve Frontend (Option 2 - From Backend):**
```javascript
// In backend/server.js, add:
const path = require('path');

// After all routes
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
  });
}
```

**Start Backend:**
```bash
cd backend
NODE_ENV=production npm start
```

---

## 📝 Usage Flow

### **1. Organization Workflow:**

```
1. Register/Login as Organization
   ↓
2. Upload File
   - Select file (max 10MB)
   - Add title & description
   - Enter password
   - File encrypted with AES-256
   - AES key encrypted with RSA public key
   ↓
3. View Access Requests
   - See pending requests from consultants
   ↓
4. Approve/Reject Requests
   - Enter password to decrypt AES key
   - Re-encrypt AES key with consultant's public key
   - Send approval/rejection message
   ↓
5. Download Own Files
   - Enter password to decrypt
   - Download plaintext file
```

### **2. Consultant Workflow:**

```
1. Register/Login as Consultant
   ↓
2. Browse Available Files
   - View all files uploaded by organizations
   ↓
3. Request Access
   - Select file
   - Write request message
   - Submit request
   ↓
4. Wait for Approval
   - Check request status
   - View organization's response
   ↓
5. Download Approved Files
   - Enter password to decrypt
   - Download plaintext file
```

---

## 🔐 Security Notes

### **Best Practices:**

1. **Strong Passwords:**
   - Minimum 8 characters
   - Mix of uppercase, lowercase, numbers, symbols
   - Never share passwords

2. **JWT Tokens:**
   - Stored in localStorage
   - Automatically included in API requests
   - Expires after session (configurable)

3. **File Size Limit:**
   - Maximum 10MB per file
   - Prevents DoS attacks
   - Configurable in backend

4. **Database Security:**
   - User data & encryption keys in separate databases
   - Private keys encrypted with user passwords
   - No plaintext storage of sensitive data

5. **HTTPS in Production:**
   - Always use HTTPS in production
   - Prevents man-in-the-middle attacks
   - Use SSL/TLS certificates

6. **Environment Variables:**
   - Never commit `.env` files to Git
   - Use different secrets for dev/staging/production
   - Rotate secrets regularly
---

**Built with ❤️ and 🔐 for secure data sharing**

**Version 2.3** - Last Updated: December 2024