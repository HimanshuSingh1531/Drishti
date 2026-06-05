<div align="center">

# 👁 DRISHTI AI — दृष्टि

### *Vision Beyond Boundaries*

**AI-Powered Offline Facial Recognition & Liveness Authentication**
for Remote Field Operations

[![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactnative.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![TensorFlow Lite](https://img.shields.io/badge/TensorFlow_Lite-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white)](https://tensorflow.org/lite)
[![AWS](https://img.shields.io/badge/AWS-232F3E?style=for-the-badge&logo=amazon-aws&logoColor=white)](https://aws.amazon.com)
[![SQLite](https://img.shields.io/badge/SQLite-07405E?style=for-the-badge&logo=sqlite&logoColor=white)](https://sqlite.org)

| 📱 Platform | 🌐 Mode | 🛡 AI Engine |
|:-----------:|:-------:|:-----------:|
| Android & iOS | 100% Offline | TensorFlow Lite |

> *"Authenticating India's Workforce, Even Beyond Connectivity."*

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [The Problem](#-the-problem)
- [Our Solution](#-our-solution)
- [Getting Started](#-getting-started)
- [End-to-End Workflow](#-end-to-end-workflow)
- [Security Architecture](#-security-architecture)
- [Technology Stack](#-technology-stack)
- [Performance Goals](#-performance-goals)
- [Use Cases](#-use-cases)
- [Future Roadmap](#-future-roadmap)
- [Resources & Links](#-resources--links)
- [Troubleshooting](#-troubleshooting)

---

## 🚀 Overview

**DRISHTI (दृष्टि)** is a lightweight, offline-first workforce authentication platform built for field personnel operating in remote and zero-network environments.

It delivers **secure identity verification, attendance tracking, GPS validation, liveness detection, and encrypted local storage** — all without requiring an active internet connection.

Built specifically for Bharat's remote operations, DRISHTI ensures uninterrupted authentication where traditional systems fail. When connectivity returns, all data syncs seamlessly to AWS.

---

## ❌ The Problem

Field personnel in remote locations face constant challenges with traditional systems:

**Dependencies that fail in the field:**
- Internet access required for every action
- Password & OTP authentication
- RFID card dependency
- Manual attendance registers

**Real operational damage this causes:**
- 👻 Proxy & ghost attendance fraud
- 🔑 Credential sharing between workers
- 📡 Operational delays due to network failure
- 📍 Inability to verify remote field identity
- 📋 Audit failures from missing GPS data

---

## ✅ Our Solution

DRISHTI introduces a **multi-layer secure, offline-first authentication architecture** combining:

| Layer | Feature |
|-------|---------|
| 👁 **Face ID** | Biometric recognition without cloud |
| 🔴 **Liveness** | Anti-spoof blink & head detection |
| 📍 **GPS** | Real-time location tagging |
| ☁ **Sync** | Auto-upload when connected |

---

## 🛠 Getting Started

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

### Prerequisites

- Node.js >= 18
- React Native CLI
- Android Studio (for Android) or Xcode (for iOS)
- A physical or virtual device

### Step 1: Install Dependencies

```sh
# Using npm
npm install

# OR using Yarn
yarn install
```

### Step 2: Start Metro

Start **Metro**, the JavaScript build tool for React Native:

```sh
# Using npm
npm start

# OR using Yarn
yarn start
```

### Step 3: Build and Run

With Metro running, open a **new terminal** from the project root:

#### Android

```sh
# Using npm
npm run android

# OR using Yarn
yarn android
```

#### iOS

First, install CocoaPods dependencies (only needed on first clone or after updating native deps):

```sh
# Install Ruby bundler (first time only)
bundle install

# Install CocoaPods dependencies
bundle exec pod install
```

Then run:

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

> For more info, visit the [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

### Step 4: Modify the App

Open `App.tsx` in your editor and start building. Changes are reflected instantly via [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

**Force reload if needed:**
- **Android**: Press <kbd>R</kbd> twice, or <kbd>Ctrl</kbd>+<kbd>M</kbd> → Reload
- **iOS**: Press <kbd>R</kbd> in the simulator

---

## 🔄 End-to-End Workflow

Nine sequential steps ensure fraud-proof authentication from enrollment to cloud sync:

| Step | Name | Description |
|:----:|------|-------------|
| 1️⃣ | **Employee Registration** | Enter ID, Name, Department. Face enrolled in encrypted local SQLite DB. One-time setup, fully offline. |
| 2️⃣ | **Employee Login** | Employee enters ID & Name. System checks local database. Unregistered employees denied immediately. |
| 3️⃣ | **Facial Verification** | Captured face compared against registered profile using TFLite. Sub-1-second recognition on mid-range devices. |
| 4️⃣ | **Liveness Detection** | Blink + Smile + Head movement detection. Prevents photo/replay attacks. |
| 5️⃣ | **GPS Validation** | Real-time coordinates captured and attached to attendance record. |
| 6️⃣ | **Fraud Prevention Engine** | Multiple failures trigger detection. Unauthorized attempts logged. Temporary lock prevents brute force. |
| 7️⃣ | **Attendance Marking** | Timestamp + GPS + status recorded locally. No network needed. |
| 8️⃣ | **Offline Storage** | Encrypted SQLite stores all records. Fully functional with zero connectivity. |
| 9️⃣ | **AWS Synchronization** | On network restore, records upload to AWS DynamoDB via API Gateway. Successful records purged from local storage. |

---

## 🛡 Security Architecture

### 🔐 Multi-Layer Authentication
`Employee ID` → `Face Verify` → `Liveness` → `GPS` — four independent gates, each must pass.

### 🕵️ Anti-Spoof Protection
Detects printed photos, mobile screen replays, and synthetic face attacks in real time.

### 📦 Encrypted Local Storage
SQLite with encrypted records. All data secured at rest until network sync.

### ☁ Secure Cloud Sync
AWS API Gateway + Lambda + DynamoDB pipeline with verified transmission and local purge.

---

## 🧰 Technology Stack

| Category | Technologies |
|----------|-------------|
| 📱 **Mobile** | React Native, TypeScript |
| 🗄 **Local Storage** | SQLite (encrypted offline database) |
| 🤖 **AI / CV** | TensorFlow Lite · Face Detection · Face Recognition · Liveness Detection |
| 📷 **Camera / GPS** | Vision Camera · Expo Location / GPS Geolocation |
| ☁ **Cloud** | AWS S3 · AWS Lambda · AWS API Gateway · AWS DynamoDB |

---

## 📊 Performance Goals

| Metric | Target |
|--------|--------|
| ⚡ Recognition Speed | < 1 Second |
| 📱 Platform Support | Android & iOS |
| 🌐 Offline Capability | 100% — No network required |
| 📟 Device Requirement | Mid-Range Smartphones |
| 📡 Network Dependency | None (sync when available) |
| 🔒 Data Security | AES Encrypted SQLite |

---

## 🎯 Use Cases

| Sector | Description |
|--------|-------------|
| 🛣 **Highway Inspection** | Remote field staff on national highways |
| 🏗 **Construction Sites** | Zero-network workforce attendance |
| 🛂 **Toll Plazas** | Secure workforce management |
| 🚨 **Emergency Response** | Instant auth during deployments |
| 📊 **Survey Teams** | Rural & remote attendance tracking |
| 🏭 **Field Operations** | Any remote industrial site |

---

## 🗺 Future Roadmap

- [ ] Advanced Face Recognition Models (higher accuracy, lower latency)
- [ ] Enhanced Anti-Spoof Detection (IR + depth sensors)
- [ ] Voice + Face Multi-Modal Authentication
- [ ] Admin Dashboard with real-time monitoring
- [ ] Workforce Analytics & enterprise reporting
- [ ] Datalake 3.0 Integration
- [ ] Wearable device support for extreme field conditions

---

## 🔗 Resources & Links

| Resource | Link |
|----------|------|
| 📱 APK Download | _Coming Soon_ |
| 📄 Presentation | _Coming Soon_ |
| 🎥 Demo Video | _Coming Soon_ |
| ☁ AWS Docs | _Coming Soon_ |
| 💻 Source Code | _This Repository_ |

---

## 🐛 Troubleshooting

If you're having issues getting the app to run, check the [React Native Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

**Common issues:**

- **Metro not starting?** Try `npm start -- --reset-cache`
- **Android build failing?** Run `cd android && ./gradlew clean` then retry
- **iOS pod issues?** Run `cd ios && pod deintegrate && pod install`
- **TFLite model not loading?** Ensure model files are placed in the correct `assets/` directory

---

## 📚 Learn More

- [React Native Website](https://reactnative.dev) — learn more about React Native
- [Environment Setup](https://reactnative.dev/docs/set-up-your-environment) — set up your dev environment
- [React Native Basics](https://reactnative.dev/docs/getting-started) — guided tour of the basics
- [TensorFlow Lite](https://tensorflow.org/lite) — on-device ML framework
- [React Native Blog](https://reactnative.dev/blog) — latest official updates

---

## 📝 License

This project was built for **Hackathon 2026** by **Team DRISHTI**.

---

<div align="center">
Built with ❤️ for Bharat's remote workforce
DRISHTI AI · Hackathon 2026
Made by Mansi Bhandari & Himanshu Singh
</div>
