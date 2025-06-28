# Contributing to AI Mobile Assistant

Thank you for considering contributing to the AI Mobile Assistant! This document provides guidelines and information for contributors.

## 🎯 **Table of Contents**

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Documentation](#documentation)
- [Submitting Changes](#submitting-changes)
- [Release Process](#release-process)

## 📋 **Code of Conduct**

This project adheres to a code of conduct that all contributors are expected to follow. Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) to help us maintain a welcoming community.

## 🚀 **Getting Started**

### **Prerequisites**

Before contributing, ensure you have:

- **Node.js 18+** installed
- **Git** configured with your details
- **PostgreSQL** running locally
- **React Native development environment** set up
- **IDE/Editor** with TypeScript support (VS Code recommended)

### **Initial Setup**

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/ai-mobile-assistant.git
   cd ai-mobile-assistant
   ```

3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/original-org/ai-mobile-assistant.git
   ```

4. **Install dependencies**:
   ```bash
   npm run install:all
   ```

5. **Set up environment**:
   ```bash
   cp backend/.env.example backend/.env
   cp mobile/.env.example mobile/.env
   # Configure your environment variables
   ```

6. **Set up database**:
   ```bash
   npm run db:migrate
   npm run db:seed
   ```

7. **Run tests** to ensure everything works:
   ```bash
   npm test
   ```

## 🔄 **Development Workflow**

### **Branch Strategy**

We use **Git Flow** with the following branches:

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/feature-name` - New features
- `bugfix/bug-description` - Bug fixes
- `hotfix/critical-fix` - Critical production fixes

### **Working on Features**

1. **Sync with upstream**:
   ```bash
   git checkout develop
   git pull upstream develop
   ```

2. **Create feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes** following our coding standards

4. **Write tests** for your changes

5. **Run tests** and ensure they pass:
   ```bash
   npm test
   npm run lint
   ```

6. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add user profile management"
   ```

7. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

8. **Create Pull Request** on GitHub

### **Commit Message Convention**

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```bash
git commit -m "feat(auth): add JWT refresh token mechanism"
git commit -m "fix(mobile): resolve camera permission issue on Android"
git commit -m "docs: update API documentation for reports endpoint"
git commit -m "test(backend): add unit tests for auth service"
```

## 🎨 **Coding Standards**

### **General Guidelines**

- **Write clean, readable code** with meaningful names
- **Follow SOLID principles** and design patterns
- **Use TypeScript** with strict mode enabled
- **Write comprehensive tests** for all new features
- **Document complex logic** with comments
- **Keep functions small** and focused on single responsibility

### **TypeScript Standards**

```typescript
// ✅ Good: Explicit types and interfaces
interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

const createUser = async (userData: CreateUserRequest): Promise<UserProfile> => {
  // Implementation
};

// ❌ Bad: Any types and unclear naming
const createUser = async (data: any): Promise<any> => {
  // Implementation
};
```

### **React Native Standards**

```typescript
// ✅ Good: Functional components with hooks
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface UserProfileProps {
  userId: string;
  onUserLoad: (user: User) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ userId, onUserLoad }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, [userId]);

  const loadUser = async () => {
    try {
      const userData = await userAPI.getById(userId);
      setUser(userData);
      onUserLoad(userData);
    } catch (error) {
      console.error('Failed to load user:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{user?.firstName}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
```

### **Backend NestJS Standards**

```typescript
// ✅ Good: Proper service structure
@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    try {
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      
      const user = await this.prisma.user.create({
        data: {
          ...createUserDto,
          password: hashedPassword,
        },
      });

      this.logger.log(`User created with ID: ${user.id}`);
      return user;
    } catch (error) {
      this.logger.error(`Failed to create user: ${error.message}`);
      throw new BadRequestException('Failed to create user');
    }
  }
}
```

### **File Organization**

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Generic components
│   ├── forms/           # Form components
│   └── __tests__/       # Component tests
├── screens/             # Screen components
│   ├── auth/            # Authentication screens
│   ├── reports/         # Report management screens
│   └── __tests__/       # Screen tests
├── services/            # API and utility services
│   ├── api/             # API client services
│   ├── storage/         # Storage services
│   └── __tests__/       # Service tests
├── store/               # Redux store
│   ├── slices/          # Redux slices
│   └── __tests__/       # Store tests
├── utils/               # Utility functions
└── types/               # TypeScript type definitions
```

## 🧪 **Testing Guidelines**

### **Testing Philosophy**

- **Write tests first** (TDD when possible)
- **Test behavior, not implementation**
- **Aim for high coverage** (>90%) on critical paths
- **Mock external dependencies**
- **Use descriptive test names**

### **Test Structure**

```typescript
describe('AuthService', () => {
  describe('login', () => {
    it('should return user and tokens when credentials are valid', async () => {
      // Arrange
      const credentials = { email: 'test@example.com', password: 'password' };
      const expectedUser = { id: '1', email: 'test@example.com' };
      mockUserService.findByEmail.mockResolvedValue(expectedUser);

      // Act
      const result = await authService.login(credentials);

      // Assert
      expect(result.user).toEqual(expectedUser);
      expect(result.tokens).toBeDefined();
      expect(mockUserService.findByEmail).toHaveBeenCalledWith(credentials.email);
    });

    it('should throw error when credentials are invalid', async () => {
      // Arrange
      const credentials = { email: 'test@example.com', password: 'wrong' };
      mockUserService.findByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(authService.login(credentials)).rejects.toThrow('Invalid credentials');
    });
  });
});
```

### **Test Types**

**Unit Tests** - Test individual functions/components:
```typescript
// utils/__tests__/formatDate.test.ts
import { formatDate } from '../formatDate';

describe('formatDate', () => {
  it('should format date correctly', () => {
    const date = new Date('2024-01-15T10:30:00Z');
    const result = formatDate(date);
    expect(result).toContain('Jan 15, 2024');
  });
});
```

**Integration Tests** - Test API endpoints:
```typescript
// test/reports.e2e-spec.ts
describe('Reports API', () => {
  it('should create report with valid data', () => {
    return request(app.getHttpServer())
      .post('/api/reports')
      .set('Authorization', `Bearer ${token}`)
      .send(validReportData)
      .expect(201)
      .expect((res) => {
        expect(res.body.title).toBe(validReportData.title);
      });
  });
});
```

**Component Tests** - Test React components:
```typescript
// components/__tests__/UserProfile.test.tsx
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { UserProfile } from '../UserProfile';

describe('UserProfile', () => {
  it('should display user name when loaded', async () => {
    const mockUser = { id: '1', firstName: 'John', lastName: 'Doe' };
    mockUserAPI.getById.mockResolvedValue(mockUser);

    const { getByText } = render(<UserProfile userId="1" onUserLoad={jest.fn()} />);

    await waitFor(() => {
      expect(getByText('John')).toBeTruthy();
    });
  });
});
```

### **Running Tests**

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- auth.service.spec.ts

# Run tests for specific directory
npm test -- src/auth
```

## 📚 **Documentation**

### **Code Documentation**

- **Use JSDoc** for function documentation
- **Comment complex algorithms** and business logic
- **Update README** when adding new features
- **Document API changes** in the API documentation

```typescript
/**
 * Processes OCR results from document image
 * @param imageUri - URI of the image to process
 * @param documentType - Type of document for optimized processing
 * @returns Promise resolving to OCR results with extracted text and confidence
 * @throws {ValidationError} When image URI is invalid
 * @throws {ProcessingError} When OCR processing fails
 */
async processDocument(
  imageUri: string,
  documentType: DocumentType
): Promise<OCRResult> {
  // Implementation
}
```

### **API Documentation**

- **Use Swagger decorators** for API endpoints
- **Provide examples** for request/response
- **Document error responses**

```typescript
@ApiOperation({ summary: 'Create a new field report' })
@ApiBody({ type: CreateReportDto })
@ApiResponse({ status: 201, description: 'Report created successfully', type: FieldReport })
@ApiResponse({ status: 400, description: 'Invalid input data' })
@ApiResponse({ status: 401, description: 'Unauthorized' })
@Post()
async createReport(@Body() createReportDto: CreateReportDto): Promise<FieldReport> {
  return this.reportsService.create(createReportDto);
}
```

## 🔀 **Submitting Changes**

### **Pull Request Process**

1. **Ensure tests pass** and coverage is maintained
2. **Update documentation** if needed
3. **Follow the PR template**
4. **Request review** from maintainers
5. **Address feedback** promptly
6. **Squash commits** if requested

### **Pull Request Template**

```markdown
## Description
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Coverage threshold maintained

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added to complex code
- [ ] Documentation updated
- [ ] No breaking changes (or clearly documented)
```

### **Review Criteria**

**Code Quality:**
- Follows coding standards
- Proper error handling
- No code duplication
- Clear and meaningful names

**Testing:**
- Adequate test coverage
- Tests are meaningful
- Edge cases covered
- Mocks used appropriately

**Documentation:**
- Code is self-documenting
- Complex logic explained
- API changes documented
- README updated if needed

## 🚀 **Release Process**

### **Version Management**

We use [Semantic Versioning](https://semver.org/):

- **MAJOR** version for incompatible API changes
- **MINOR** version for backwards-compatible functionality
- **PATCH** version for backwards-compatible bug fixes

### **Release Steps**

1. **Create release branch** from `develop`
2. **Update version numbers** in package.json files
3. **Update CHANGELOG.md** with release notes
4. **Run full test suite**
5. **Create Pull Request** to `main`
6. **After merge, tag release**:
   ```bash
   git tag -a v1.2.0 -m "Release version 1.2.0"
   git push origin v1.2.0
   ```

## 🤝 **Getting Help**

- **GitHub Issues** - Report bugs or request features
- **Discussions** - Ask questions or discuss ideas
- **Discord** - Real-time chat with the community
- **Email** - Contact maintainers directly

## 📜 **License**

By contributing to this project, you agree that your contributions will be licensed under the same MIT License that covers the project.

---

Thank you for contributing to AI Mobile Assistant! 🎉 