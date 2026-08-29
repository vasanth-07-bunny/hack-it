# 🤝 Contributing to Abhiyantrix

Thank you for your interest in contributing to **Abhiyantrix** — the unified, real-time event management platform!

## 🛠️ Development Setup

1. **Prerequisites:**
   - Node.js `>= 18.0.0`
   - npm / yarn / pnpm

2. **Clone & Install:**
   ```bash
   git clone https://github.com/vasanth-07-bunny/hac-it.git
   cd abhiyantrix
   npm install
   ```

3. **Running in Development:**
   ```bash
   # Run both backend API (Port 4000) and frontend Vite app (Port 5173)
   npm run dev
   ```

4. **Running Tests:**
   ```bash
   # Run unit & integration test suite
   npm run test:api

   # Run automated platform verification
   npm run test:e2e
   ```

5. **Building for Production:**
   ```bash
   npm run build
   ```

## 📐 Monorepo Structure

- `/apps/web`: React 18 + TypeScript + Vite + Tailwind CSS dashboard with Glassmorphic UI.
- `/apps/api`: Express.js + Socket.IO + In-Memory Relational Engine with cryptographic HMAC QR verification.
- `/packages/shared-types`: Common TypeScript interfaces, enums, and WebSocket event contracts.
- `/docs`: Architectural diagrams, user flows, ER diagrams, and REST/WebSocket API contracts.

## 📝 Commit Convention

We follow conventional commits:
- `feat:` A new feature
- `fix:` A bug fix
- `docs:` Documentation updates
- `test:` Adding or updating tests
- `refactor:` Code refactoring without behavioral changes
- `chore:` Build scripts, tooling, or package updates

## 🛡️ Security Vulnerabilities

Please review our [SECURITY.md](SECURITY.md) for responsible disclosure guidelines.
