# Project OM 💬⚡

**Project OM** is a modern chat application built for seamless, intelligent, and secure conversations. With support for saved chats, AI-powered responses using Claude, Clerk for authentication, and a polished UI built with Next.js — this project is designed to be the foundation for your next-gen chat experience.

---

## 🚀 Features

- Chat with AI (Claude by Anthropic)
- Saved Chats & History
- Secure Authentication using Clerk
- Modern UI/UX with Next.js and Tailwind CSS
- Scalable Backend with PostgreSQL and Prisma
- Optional Python Backend
- Open Source

---

## 🛠️ Tech Stack

- **Frontend**: Next.js, Tailwind CSS
- **Backend**: Python (OpenManus), PostgreSQL, Prisma
- **Authentication**: Clerk
- **AI Integration**: Claude (Anthropic)
- **Deployment**: Vercel (Frontend), Render/Fly.io/Docker (Backend)

---

## 🧰 Getting Started

>  We are using the backend from the OpenManus open source project.
> ⚠️ **Note**: The backend is not fully functional at the moment. Please explore the `projectomclient` folder only and start contributing to this part.

### 1. Clone the Repository

```bash
git clone https://github.com/xAGI-labs/ProjectOM.git
cd projectomclient
```

### 2. Install Frontend Dependencies

```bash
cd projectomclient
npm install
```

### 3. Setup Environment Variables

Create a `.env` file inside the `projectomclient` folder with the following:

```env
DATABASE_URL="your_postgres_url"
ANTHROPIC_API_KEY="your_claude_api_key"

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_clerk_publishable_key"
CLERK_SECRET_KEY="your_clerk_secret_key"
NEXT_PUBLIC_CLERK_SIGN_IN_URL="/sign-in"
NEXT_PUBLIC_CLERK_SIGN_UP_URL="/sign-up"
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL="/"
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL="/"
CLERK_WEBHOOK_SECRET="your_clerk_webhook_secret"
```

Make sure your PostgreSQL instance is running locally or in the cloud and the `DATABASE_URL` is properly set.

---

### 4. Set Up Database

```bash
npx prisma migrate dev
```

```bash
npx prisma generate
```

To explore the database visually:

```bash
npx prisma studio
```

---

### 5. Run the Application

```bash
npm run dev
```

Open your browser and navigate to:  
http://localhost:3000

---

## 🧪 Running the Python Backend (Optional)

Only required if you're planning to use or extend the Python backend.

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

---

## 🌍 Deployment

You can easily deploy this using platforms like:

- **Frontend**: Vercel
- **Backend**: Render, Fly.io, or Docker

Make sure all your environment variables are properly set in the deployment platform settings.

---

## 🤝 Contributing

We welcome contributions from everyone! Whether you're fixing bugs, improving docs, or adding features — we’d love your help.

---

## 👥 Contributors

- [Saurav](https://github.com/sauravtom)
- [Aviraj](https://github.com/avirajkhare00)
- [Udit](https://github.com/uditkumar01)
- [Basab](https://github.com/comethrusws)
- [Niraj](https://www.github.com/jha-niraj)
- [Ujjwal](https://github.com/UzitheI)
- [Chandramani](https://github.com/Chandra2309)

### Guidelines

- Fork the repo and create a new branch:

  ```bash
  git checkout -b feature/your-feature-name
  ```

- Make your changes and commit them with clear messages.
- Ensure the application runs correctly and any existing tests pass.
- Push to your fork and open a Pull Request.

### 📜 Rules

- Be respectful and constructive in discussions.
- Avoid pushing directly to the main branch.
- For major changes or new features, open an issue to start a discussion first.
- Maintain existing coding standards (readable, consistent formatting).

---

## 📬 Contact

**GitHub Issues**: [Open an Issue](https://github.com/xAGI-labs/ProjectOM.git/issues)  
**Email**: founders@likeo.me

<!--## 📜 License-->

<!--This project is licensed under the **MIT License**.  -->
<!--See the [LICENSE](./LICENSE) file for details.-->

---

Let’s build something amazing together with **Project OM** 💬⚡  
Made with ❤️ using Next.js, Prisma, and Claude.
