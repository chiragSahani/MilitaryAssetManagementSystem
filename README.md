# Military Asset Management System

A comprehensive, secure web application for managing military assets across multiple bases with role-based access control.

## 🎯 Features

### Core Functionality
- **Dashboard**: Real-time metrics, asset tracking, and activity monitoring
- **Purchases**: Asset procurement management with approval workflows
- **Transfers**: Inter-base asset transfers with tracking
- **Assignments**: Personnel asset assignments and returns
- **Expenditures**: Asset expenditure recording and justification
- **Analytics**: Comprehensive reporting and data visualization

### Security & Access Control
- **Role-Based Access Control (RBAC)**:
  - **Admin**: Full system access
  - **Base Commander**: Base-specific access with approval rights
  - **Logistics Officer**: Limited to purchases and transfers
- **JWT Authentication** with secure token management
- **Comprehensive Audit Logging** for all API calls
- **Rate Limiting** and security headers

### Technical Features
- **Responsive Design**: Mobile-friendly interface
- **Real-time Updates**: Live data synchronization
- **Advanced Filtering**: Date ranges, asset types, status filters
- **Export Capabilities**: Data export for reporting
- **Interactive Charts**: Visual data representation

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Axios** for API communication
- **Recharts** for data visualization
- **Lucide React** for icons

### Backend
- **Node.js** with Express
- **PostgreSQL** database
- **JWT** for authentication
- **Winston** for logging
- **Helmet** for security
- **Rate limiting** for API protection

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 12+
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/chiragSahani/MilitaryAssetManagementSystem.git
   cd MilitaryAssetManagementSystem
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Database Setup**
   ```bash
   # Create PostgreSQL database
   createdb military_assets
   
   # Run schema and seed scripts
   psql -d military_assets -f server/database/schema.sql
   psql -d military_assets -f server/database/seed.sql
   ```

4. **Environment Configuration**
   ```bash
   # Copy environment template
   cp .env.example .env
   
   # Edit .env with your database credentials
   ```

5. **Start the application**
   ```bash
   # Development mode (runs both frontend and backend)
   npm run dev
   
   # Or run separately:
   npm run client  # Frontend only
   npm run server  # Backend only
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001
   - Health Check: http://localhost:3001/health



## 📊 Database Schema

### Core Tables
- **users**: User accounts with role-based access
- **bases**: Military base information
- **asset_types**: Asset categories and specifications
- **assets**: Current inventory tracking
- **purchases**: Procurement records
- **transfers**: Inter-base asset movements
- **assignments**: Personnel asset assignments
- **expenditures**: Asset usage and consumption
- **personnel**: Military personnel records
- **api_logs**: Comprehensive audit trail

### Key Relationships
- Users belong to bases and have specific roles
- Assets are tracked by type and location
- All transactions maintain full audit trails
- Role-based permissions control data access

## 🔐 Security Features

### Authentication & Authorization
- JWT-based authentication with secure token storage
- Role-based access control with granular permissions
- Base-level data isolation for non-admin users
- Session management with automatic token refresh

### Data Protection
- SQL injection prevention with parameterized queries
- XSS protection with input sanitization
- CORS configuration for secure cross-origin requests
- Rate limiting to prevent abuse
- Comprehensive audit logging

### API Security
- Helmet.js for security headers
- Request validation and sanitization
- Error handling without information leakage
- Secure password hashing (production ready)

## 📈 API Endpoints

### Authentication
- `POST /api/auth/login` - User authentication
- `GET /api/auth/profile` - Get current user profile
- `POST /api/auth/logout` - User logout

### Dashboard
- `GET /api/dashboard/metrics` - Dashboard metrics with filters
- `GET /api/dashboard/activities` - Recent activity feed

### Asset Management
- `GET /api/purchases` - List purchases with pagination
- `POST /api/purchases` - Create new purchase
- `PATCH /api/purchases/:id/status` - Update purchase status
- `GET /api/transfers` - List transfers
- `POST /api/transfers` - Create new transfer
- `GET /api/assignments` - List assignments
- `POST /api/assignments` - Create new assignment

### Reference Data
- `GET /api/assets/types` - Asset types and categories
- `GET /api/assets/bases` - Available bases
- `GET /api/assets/inventory` - Current inventory levels
- `GET /api/personnel` - Personnel records

## 🔧 Configuration

### Environment Variables
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=military_assets
DB_USER=postgres
DB_PASSWORD=your_password

# Security
JWT_SECRET=your-super-secret-jwt-key

# Application
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:5173
```

### Database Configuration
- Connection pooling for optimal performance
- SSL support for production environments
- Automatic connection retry and error handling
- Query optimization with proper indexing

## 📱 Responsive Design

The application is fully responsive and optimized for:
- **Desktop**: Full-featured dashboard and management interface
- **Tablet**: Optimized layouts for medium screens
- **Mobile**: Touch-friendly interface for field operations

## 🚀 Deployment

### Production Deployment Options

#### Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up -d
```

#### Cloud Deployment (Heroku/Render)
1. Set up PostgreSQL database
2. Configure environment variables
3. Deploy application code
4. Run database migrations

#### Traditional Server Deployment
1. Set up Node.js and PostgreSQL
2. Clone repository and install dependencies
3. Configure environment variables
4. Set up process manager (PM2)
5. Configure reverse proxy (Nginx)

### Production Considerations
- Use environment-specific JWT secrets
- Enable SSL/TLS encryption
- Set up database backups
- Configure monitoring and logging
- Implement CI/CD pipelines

## 🔍 Monitoring & Logging

### Application Logging
- Winston-based structured logging
- API call logging with request/response details
- Error tracking and stack traces
- Performance metrics and timing

### Audit Trail
- Complete transaction history
- User action tracking
- Data modification logs
- Security event monitoring

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Check the documentation
- Review the API endpoints
- Examine the database schema
- Test with provided demo credentials

## 🔮 Future Enhancements

- Real-time notifications
- Advanced analytics and reporting
- Mobile application
- Integration with external systems
- Automated inventory management
- Predictive maintenance scheduling
