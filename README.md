# CryptoGames: crypto arcade platform

A web arcade where players sign in, connect a crypto wallet and play browser mini-games. It has a NestJS API, a Next.js client, and a set of HTML5 and Three.js games.

> Early prototype of my Arcade Gaming Blockchain platform (2025).

## ✨ Features

- **Authentication API** (NestJS): email sign-up and login with bcrypt-hashed passwords, JWT and Passport, and DTO validation with class-validator. Google sign-in routes are started but not finished.
- **Database**: PostgreSQL with Prisma ORM and migrations, running in Docker
- **Wallet integration** (Next.js): connect an Ethereum wallet with ethers.js, Bitcoin support with bitcoinjs-lib, and QR-code payments
- **Mini-games**: Coin Flip, Archer (3D with Three.js), Ball and Cowboy Shooter

## 🧱 Tech stack

| Layer | Technologies |
|---|---|
| Front-end | Next.js, React, TypeScript, Framer Motion |
| Back-end | NestJS, Passport (JWT), class-validator |
| Database | PostgreSQL 15 (Docker), Prisma ORM |
| Web3 | ethers.js, bitcoinjs-lib |
| Games | HTML5 Canvas, Three.js |

## 📁 Structure

```
backend/   # NestJS API: auth, users, Prisma, docker-compose (Postgres)
client/    # Next.js front-end: auth forms, wallet component
games/     # Standalone browser games
```

## 🚀 Run locally

```bash
# API
cd backend
docker compose up -d          # starts PostgreSQL
cp .env.example .env          # set DATABASE_URL and JWT_SECRET
npm install && npx prisma migrate dev && npm run start:dev

# Client
cd ../client
npm install && npm run dev
```

## 🙏 Credits

Cowboy Shooter is adapted from an open-source project (Apache 2.0, license in `games/Cowboy-Shooter/LICENSE`).
