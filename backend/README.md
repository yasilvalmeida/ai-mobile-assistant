# AI Mobile Assistant - Backend API

NestJS backend API for the AI Mobile Assistant application, providing endpoints for field agents to manage reports, locations, OCR processing, and AI assistant features.

## Features

- **Authentication**: JWT-based authentication with role-based access control
- **Reports Management**: CRUD operations for field reports with file attachments
- **GPS Location Tracking**: Real-time location logging and route history
- **OCR Processing**: Document scanning and text extraction using Tesseract/Google Vision
- **AI Integration**: OpenAI/Claude integration for report summarization and suggestions
- **Offline Sync**: Data synchronization for offline-first mobile experience
- **File Management**: Secure file upload and storage
- **Database**: PostgreSQL with Prisma ORM

## Tech Stack

- **Framework**: NestJS (Node.js)
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT with Passport
- **AI Integration**: OpenAI GPT, Claude (Anthropic)
- **OCR**: Tesseract.js, Google Vision API
- **File Upload**: Multer
- **Validation**: class-validator
- **Documentation**: Swagger/OpenAPI

## Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm or yarn

## Installation

1. **Clone the repository and install dependencies**:
```bash
cd backend
npm install
```

2. **Environment Setup**:
```bash
# Copy the environment template
cp .env.example .env

# Edit .env with your configuration
# Required variables:
# - DATABASE_URL
# - JWT_SECRET
# - OPENAI_API_KEY or CLAUDE_API_KEY
```

3. **Database Setup**:
```bash
# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev

# Seed the database (optional)
npx prisma db seed
```

4. **Start the development server**:
```bash
npm run start:dev
```

The API will be available at `http://localhost:3000`

## API Documentation

Once the server is running, visit:
- **Swagger UI**: `http://localhost:3000/api`
- **JSON Schema**: `http://localhost:3000/api-json`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh JWT token

### Reports
- `GET /api/reports` - List reports with filters
- `POST /api/reports` - Create new report
- `GET /api/reports/:id` - Get report details
- `PUT /api/reports/:id` - Update report
- `DELETE /api/reports/:id` - Delete report

### Locations
- `GET /api/locations` - List GPS locations
- `POST /api/locations` - Log new location
- `GET /api/locations/routes` - Get route history

### OCR
- `POST /api/ocr/process` - Process document image
- `GET /api/ocr/results` - List OCR results
- `GET /api/ocr/results/:id` - Get OCR result details

### AI Assistant
- `POST /api/ai/summarize` - Generate report summary
- `POST /api/ai/suggest` - Get AI suggestions
- `POST /api/ai/chat` - Chat with AI assistant

### Sync
- `POST /api/sync/upload` - Upload offline data
- `GET /api/sync/download` - Download updates
- `GET /api/sync/status` - Get sync status

## Environment Variables

### Required
```env
DATABASE_URL="postgresql://username:password@localhost:5432/ai_mobile_assistant"
JWT_SECRET="your-jwt-secret"
OPENAI_API_KEY="your-openai-key"  # or CLAUDE_API_KEY
```

### Optional
```env
PORT=3000
NODE_ENV=development
CORS_ORIGIN=*
OCR_PROVIDER=tesseract
MAX_FILE_SIZE=10485760
UPLOAD_DIRECTORY=./uploads
```

## Database Schema

The application uses the following main entities:

- **Users**: Field agents and administrators
- **FieldReports**: Field inspection reports
- **GPSLocations**: Location tracking data
- **OCRResults**: Document processing results
- **AIRequests/Responses**: AI interaction logs
- **Attachments**: File uploads

## Development

### Scripts
```bash
npm run start:dev     # Development server with hot reload
npm run build         # Build for production
npm run start:prod    # Production server
npm run test          # Run tests
npm run lint          # Lint code
npm run format        # Format code
```

### Database Operations
```bash
npx prisma studio     # Open Prisma Studio (DB browser)
npx prisma migrate dev # Create and apply migration
npx prisma db push    # Push schema changes
npx prisma db seed    # Seed database
```

### Adding New Features

1. Generate NestJS resource:
```bash
nest g resource feature-name
```

2. Update Prisma schema if needed:
```bash
# Edit prisma/schema.prisma
npx prisma migrate dev --name add-feature
```

3. Add authentication/authorization as needed
4. Write tests
5. Update API documentation

## Production Deployment

### Environment Setup
- Set `NODE_ENV=production`
- Use strong `JWT_SECRET`
- Configure proper database URL
- Set up file storage (AWS S3, etc.)
- Configure proper CORS origins

### Docker Deployment
```dockerfile
# Dockerfile example
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
```

### Health Checks
- `GET /api/health` - Health check endpoint
- Monitor database connections
- Set up logging and monitoring

## Security Considerations

- JWT tokens with appropriate expiration
- Input validation on all endpoints
- Rate limiting configured
- File upload security (type, size limits)
- CORS properly configured
- Environment variables secured
- Database connections encrypted

## Troubleshooting

### Common Issues

1. **Database Connection Issues**:
   - Verify PostgreSQL is running
   - Check DATABASE_URL format
   - Ensure database exists

2. **Prisma Issues**:
   - Run `npx prisma generate` after schema changes
   - Check migration status with `npx prisma migrate status`

3. **JWT Issues**:
   - Verify JWT_SECRET is set
   - Check token expiration

4. **File Upload Issues**:
   - Check UPLOAD_DIRECTORY permissions
   - Verify MAX_FILE_SIZE setting

## Support

For issues and questions:
1. Check the API documentation at `/api`
2. Review the logs for error details
3. Verify environment configuration
4. Check database connectivity

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Write tests
5. Submit a pull request 