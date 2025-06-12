
# 🛡️ Military Asset Management System

A secure, full-stack web application for managing the movement, assignment, and expenditure of critical military assets (weapons, vehicles, ammunition) across multiple bases. Built with **React.js** (frontend), **Supabase** (PostgreSQL, Auth, RLS backend), and deployed on modern cloud infrastructure. Features real-time dashboards, role-based access, audit logging, and a military-inspired UI.

---

## 🚀 Live Demo

- **Full-Stack App:** [Live Demo](https://ppl-ai-code-interpreter-files.s3.amazonaws.com/web/direct-files/9ceea7357ce48c7bacf8562af7a17d10/47e7d623-c12b-4f2c-8313-3e3db3d27069/index.html)
- **Backend (Supabase):** [Supabase Dashboard](https://app.supabase.com/) *(requires credentials)*

---

## 🎯 Features

- **Dashboard:** Real-time metrics (opening/closing balance, net movement, assignments, expenditures) with interactive charts and breakdowns.
- **Purchases:** Record and view asset purchases per base, with filtering.
- **Transfers:** Manage and track asset transfers between bases, with full history.
- **Assignments & Expenditures:** Assign assets to personnel, record usage and returns.
- **Role-Based Access Control:**  
  - **Admin:** Full system access  
  - **Base Commander:** Access limited to assigned base  
  - **Logistics Officer:** Access to purchases and transfers only
- **Audit Logging:** All actions are logged for compliance and traceability.
- **Responsive Military UI:** Mobile-friendly, accessible, and visually themed for military use (greens, khaki, gold, strong contrast).
- **Framer Motion Animations:** Smooth transitions and interactive popups.
- **Charts & Visuals:** Asset flows and trends visualized with Chart.js.
- **Accessible & Secure:** JWT Auth, RLS, and best practices for data protection.

---

## 🏗️ Tech Stack

- **Frontend:** React.js, React Router, Framer Motion, Chart.js, Styled Components/CSS Modules
- **Backend:** Supabase (PostgreSQL, Auth, RLS, Edge Functions)
- **Deployment:** AWS S3 (frontend), Supabase Cloud (backend)
- **Other:** Docker (optional), Vite (dev server), ESLint/Prettier

---

## 🗄️ Database Schema

- `users` (id, email, role, base_id)
- `roles` (id, name)
- `bases` (id, name, location)
- `assets` (id, type, description)
- `purchases` (id, base_id, asset_id, quantity, date)
- `transfers` (id, asset_id, from_base_id, to_base_id, quantity, timestamp)
- `assignments` (id, asset_id, assigned_to, date)
- `expenditures` (id, asset_id, base_id, quantity, date)
- `logs` (id, action, user_id, table, data, timestamp)

All tables are relational with foreign keys and indexed for performance. Row Level Security (RLS) policies enforce access by user role and base.

---

## 🔐 Authentication & Security

- **Supabase Auth:** JWT-based, with custom role claims.
- **Row Level Security:** Policies restrict data access to authorized users.
- **Audit Logging:** Every action is logged to the `logs` table.
- **Input Validation & Sanitization:** Prevents SQL injection and XSS.

---

## 📦 Getting Started

### 1. Clone the Repo

```
git clone https://github.com/your-org/military-asset-management.git
cd military-asset-management
```

### 2. Setup Supabase Backend

- Create a [Supabase](https://supabase.com/) project.
- Run the SQL schema in `supabase/schema.sql`.
- Set up RLS policies as per `supabase/policies.sql`.
- Add sample data using `supabase/seed.sql`.
- Configure Auth roles in Supabase dashboard.

### 3. Configure Frontend

- Copy `.env.example` to `.env` and add your Supabase credentials.
- Install dependencies:

```
npm install
```

- Start the local dev server:

```
npm run dev
```

### 4. Deploy

- **Frontend:** Deploy to AWS S3, Render, or Vercel.
- **Backend:** Supabase is fully managed in the cloud.

---

## 👤 Demo Users

| Username      | Role             | Password  |
|---------------|------------------|-----------|
| `admin`       | Admin            | demo123   |
| `commander`   | Base Commander   | demo123   |
| `logistics`   | Logistics Officer| demo123   |

---

## 📊 Screenshots





---

## 🛠️ Development Notes

- **Styling:** Uses a military color palette with high-contrast text for visibility.
- **Animations:** Framer Motion for modals, transitions, and interactive feedback.
- **Charts:** Chart.js for visualizing asset movement and balances.
- **Accessibility:** ARIA labels, keyboard navigation, and high-contrast support.

---

## 📈 Roadmap

- [ ] Mobile app (React Native/PWA)
- [ ] Predictive analytics for asset usage
- [ ] Barcode/QR code scanning for inventory
- [ ] Advanced permissions and approval workflows

---

## 🤝 Contributing

Pull requests are welcome! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

---

## 📄 License

[MIT](LICENSE)

---

## 🏅 Credits

Developed by Chirag Sahani


---

*System Classification: FOR OFFICIAL USE ONLY. Unauthorized access is prohibited.*
```
---

