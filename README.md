# 📝 WordWise AI - Intelligent Writing Assistant

![WordWise AI](https://img.shields.io/badge/WordWise-AI%20Powered-blue)
![React](https://img.shields.io/badge/React-18.3.1-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)
![Firebase](https://img.shields.io/badge/Firebase-v11.9.1-orange)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--3.5--turbo-green)

## 🚀 Live Demo
**Production Site**: [https://wordwise-87bc8.web.app](https://wordwise-87bc8.web.app)

## ✨ Features

### 🧠 AI-Powered Writing Analysis
- **Real-time Grammar & Spelling Correction** - Instant detection and suggestions
- **OpenAI GPT-3.5-turbo Integration** - Advanced context-aware suggestions
- **Style & Tone Analysis** - Professional writing feedback
- **Readability Scoring** - Flesch reading score and grade level analysis

### 📊 Writing Insights
- **Writing Score** - Comprehensive assessment (0-100)
- **Writing Statistics** - Word count, sentence analysis, reading time
- **Suggestion Categories** - Grammar, spelling, style, clarity, engagement
- **Intelligent Feedback** - Context-aware improvements

### 🔐 User Features
- **Firebase Authentication** - Secure Google & email sign-in
- **Document Management** - Save, edit, and organize documents
- **Real-time Sync** - Cloud-based document storage
- **Demo Mode** - Try features without signing up

### 🎨 Modern Interface
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Clean UI/UX** - Intuitive writing environment
- **Real-time Analysis** - Suggestions appear as you type
- **Professional Theme** - Modern, distraction-free design

## 🛠️ Tech Stack

- **Frontend**: React 19.1.0 + TypeScript
- **Styling**: Tailwind CSS 4.1.10
- **Backend**: Firebase (Auth, Firestore)
- **AI**: OpenAI GPT-3.5-turbo API
- **Build**: Vite 6.3.5
- **Hosting**: Firebase Hosting

## 🏃‍♂️ Quick Start

### 1. Clone & Install
```bash
git clone https://github.com/quesdilla12/worldwisetest.git
cd worldwisetest
npm install
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
VITE_OPENAI_API_KEY=sk-proj-your-openai-api-key-here
```

### 3. Firebase Configuration
- Follow setup guide in `README-FIREBASE-SETUP.md`
- Configure Firebase project
- Update `src/firebase/config.ts` with your Firebase config

### 4. Run Development Server
```bash
npm run dev
```
Visit `http://localhost:5173`

## 🔧 Configuration Guides

### 📚 Detailed Setup Instructions
- **OpenAI Setup**: See `README-OPENAI-SETUP.md`
- **Firebase Setup**: See `README-FIREBASE-SETUP.md`

### 🔑 OpenAI API Key
1. Get your API key from [OpenAI Platform](https://platform.openai.com/)
2. Add to `.env` file: `VITE_OPENAI_API_KEY=your-key-here`
3. Restart development server

### 🔥 Firebase Setup
1. Create Firebase project
2. Enable Authentication (Google, Email/Password)
3. Set up Firestore database
4. Configure hosting (optional)

## 📁 Project Structure

```
wordwise-ai/
├── src/
│   ├── components/          # React components
│   │   ├── AuthModal.tsx    # Authentication modal
│   │   ├── LandingPage.tsx  # Landing page
│   │   └── ...
│   ├── firebase/           # Firebase configuration
│   │   ├── auth.ts         # Authentication logic
│   │   ├── config.ts       # Firebase config
│   │   └── documents.ts    # Document management
│   ├── services/           # API services
│   │   ├── aiService.ts    # Local AI analysis
│   │   └── openaiService.ts # OpenAI integration
│   ├── App.tsx             # Main application
│   └── main.tsx            # Entry point
├── public/                 # Static assets
├── firebase.json           # Firebase configuration
├── package.json            # Dependencies
└── README.md              # This file
```

## 🧪 Testing

### Test the AI Features
Try typing text with various issues:
```
"i are very excited to use this AI writing assistant, its going to help me alot with my grammer and style"
```

Expected suggestions:
- "i" → "I" (capitalization)
- "are" → "am" (subject-verb agreement)
- "its" → "it's" (contraction)
- "alot" → "a lot" (spelling)
- "grammer" → "grammar" (spelling)

## 🚀 Deployment

### Firebase Hosting
```bash
npm run build
firebase deploy --only hosting
```

### Environment Variables
- Production builds automatically include environment variables
- Ensure your OpenAI API key is properly configured

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support & Issues

- **Issues**: [GitHub Issues](https://github.com/quesdilla12/worldwisetest/issues)
- **Documentation**: Check the README files in the repository
- **Firebase Setup**: See `README-FIREBASE-SETUP.md`
- **OpenAI Setup**: See `README-OPENAI-SETUP.md`

## 🙏 Acknowledgments

- **OpenAI** for GPT-3.5-turbo API
- **Firebase** for backend services
- **React Team** for the amazing framework
- **Vite** for lightning-fast development

---

⭐ Star this repo if you found it helpful!
