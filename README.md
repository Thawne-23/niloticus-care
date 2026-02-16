# NiloticusCare

A mobile application for tilapia health monitoring and disease detection using TensorFlow Lite and YOLO-based object detection.

## Overview

NiloticusCare is an innovative mobile app designed to help aquaculture professionals and tilapia farmers monitor the health of their tilapia stocks. The app uses advanced machine learning models to detect diseases and abnormalities in tilapia through image analysis, providing early detection and prevention capabilities.

## Features

- **AI-Powered Disease Detection**: Utilizes TensorFlow Lite models for real-time tilapia disease detection
- **YOLO Object Detection**: Advanced YOLO-based detection for identifying tilapia and health issues
- **Camera Integration**: Direct camera access for capturing tilapia images
- **Image Processing**: Built-in image manipulation and enhancement tools
- **Database Storage**: Local SQLite database for storing detection history and user data
- **Multi-language Support**: Internationalization support for multiple languages
- **Secure Data Storage**: Encrypted storage for sensitive user information
- **Cross-Platform**: Works on iOS, Android, and Web platforms

## Tech Stack

- **Framework**: React Native with Expo
- **Navigation**: React Navigation (Native Stack and Bottom Tabs)
- **Machine Learning**: 
  - TensorFlow.js
  - TensorFlow Lite
  - YOLO Detection Models
- **Database**: SQLite with Expo SQLite
- **Storage**: AsyncStorage and SecureStore
- **UI Components**: Expo Vector Icons, React Native SVG
- **Image Processing**: Expo Image Manipulator and Image Picker

## Installation

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn
- Expo CLI
- React Native development environment

### Setup

1. Clone the repository:
```bash
git clone https://github.com/thawne-23/niloticus-carev2.git
cd niloticus-carev2
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Run on your preferred platform:
```bash
# For Android
npm run android

# For iOS
npm run ios

# For Web
npm run web
```

## Project Structure

```
niloticus-carev2/
├── src/
│   ├── screens/           # App screens and components
│   ├── utils/            # Utility functions and helpers
│   ├── yoloDetector/     # YOLO detection logic
│   └── ...               # Other source files
├── assets/               # Static assets and model files
├── App.js               # Main app entry point
├── app.json             # Expo configuration
├── package.json         # Dependencies and scripts
└── README.md           # This file
```

## Key Dependencies

- `expo` - Core Expo framework
- `react-native` - React Native framework
- `@tensorflow/tfjs` - TensorFlow.js for ML
- `@tensorflow/tfjs-react-native` - React Native TensorFlow integration
- `expo-camera` - Camera functionality
- `expo-sqlite` - SQLite database
- `@react-navigation/native` - Navigation library

## Usage

1. **Launch the App**: Open the app on your device
2. **Capture Image**: Use the camera to capture tilapia images
3. **Analyze**: The app will automatically analyze the image for diseases
4. **View Results**: Review detection results and recommendations
5. **History**: Access previous detection history and track health trends

## Development

### Available Scripts

- `npm start` - Start the Expo development server
- `npm run android` - Run on Android device/emulator
- `npm run ios` - Run on iOS device/simulator
- `npm run web` - Run in web browser

### Building for Production

Use Expo Application Services (EAS) to build for production:

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to your Expo account
eas login

# Build for production
eas build
```

## Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## Developers

- **Leo Llarenas** - Lead Developer
- **thawne-23** - Project Owner


## Model Request

**Important**: The TensorFlow Lite model (`best_float16.tflite`) used for disease detection is not included in this repository due.

To request a copy of the TFLite model, please contact:
- **Email**: llarenasleo5@gmail.com

Please include your name, organization (if applicable), and a brief description of your intended use case when requesting the model.

## Support

For support and questions, please open an issue in the GitHub repository or contact the development team.

## Acknowledgments

- TensorFlow team for the ML framework
- Expo team for the development platform
- React Native community for the awesome framework
- All contributors and testers who helped improve this app
