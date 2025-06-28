import { configureStore } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authReducer, {
  loginUser,
  registerUser,
  refreshToken,
  loadStoredAuth,
  logout,
  clearError,
  updateUser,
} from '../authSlice';
import { authAPI } from '../../../services/api/authAPI';
import { User, AuthTokens } from '@shared/types';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
}));

// Mock authAPI
jest.mock('../../../services/api/authAPI', () => ({
  authAPI: {
    login: jest.fn(),
    register: jest.fn(),
    refreshToken: jest.fn(),
    getProfile: jest.fn(),
  },
}));

const mockedAsyncStorage = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const mockedAuthAPI = authAPI as jest.Mocked<typeof authAPI>;

describe('authSlice', () => {
  let store: ReturnType<typeof configureStore>;

  const mockUser: User = {
    id: '1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'FIELD_AGENT' as any,
    organizationId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTokens: AuthTokens = {
    accessToken: 'access-token',
    refreshToken: 'refresh-token',
    expiresIn: 3600,
  };

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authReducer,
      },
    });
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = store.getState().auth;
      expect(state).toEqual({
        user: null,
        tokens: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      });
    });
  });

  describe('synchronous actions', () => {
    it('should handle logout', () => {
      // First set some state
      store.dispatch(loginUser.fulfilled({ user: mockUser, tokens: mockTokens }, '', {} as any));
      
      // Then logout
      store.dispatch(logout());
      
      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.tokens).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBeNull();
      expect(mockedAsyncStorage.removeItem).toHaveBeenCalledWith('auth_tokens');
    });

    it('should handle clearError', () => {
      // Set error state
      store.dispatch(loginUser.rejected({ name: 'Error', message: 'Login failed' }, '', {} as any, 'Login failed'));
      
      // Clear error
      store.dispatch(clearError());
      
      const state = store.getState().auth;
      expect(state.error).toBeNull();
    });

    it('should handle updateUser', () => {
      // First login
      store.dispatch(loginUser.fulfilled({ user: mockUser, tokens: mockTokens }, '', {} as any));
      
      // Update user
      const updates = { firstName: 'Jane', lastName: 'Smith' };
      store.dispatch(updateUser(updates));
      
      const state = store.getState().auth;
      expect(state.user?.firstName).toBe('Jane');
      expect(state.user?.lastName).toBe('Smith');
      expect(state.user?.email).toBe(mockUser.email); // Other fields unchanged
    });
  });

  describe('loginUser async thunk', () => {
    it('should handle successful login', async () => {
      const credentials = { email: 'test@example.com', password: 'password' };
      const response = { user: mockUser, tokens: mockTokens };
      
      mockedAuthAPI.login.mockResolvedValue(response);
      
      await store.dispatch(loginUser(credentials));
      
      const state = store.getState().auth;
      expect(state.isLoading).toBe(false);
      expect(state.user).toEqual(mockUser);
      expect(state.tokens).toEqual(mockTokens);
      expect(state.isAuthenticated).toBe(true);
      expect(state.error).toBeNull();
      expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
        'auth_tokens',
        JSON.stringify(mockTokens)
      );
    });

    it('should handle login failure', async () => {
      const credentials = { email: 'test@example.com', password: 'wrong' };
      const errorMessage = 'Invalid credentials';
      
      mockedAuthAPI.login.mockRejectedValue({
        response: { data: { message: errorMessage } }
      });
      
      await store.dispatch(loginUser(credentials));
      
      const state = store.getState().auth;
      expect(state.isLoading).toBe(false);
      expect(state.user).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(state.error).toBe(errorMessage);
    });

    it('should handle login loading state', () => {
      const credentials = { email: 'test@example.com', password: 'password' };
      mockedAuthAPI.login.mockImplementation(() => new Promise(() => {})); // Never resolves
      
      store.dispatch(loginUser(credentials));
      
      const state = store.getState().auth;
      expect(state.isLoading).toBe(true);
      expect(state.error).toBeNull();
    });
  });

  describe('registerUser async thunk', () => {
    it('should handle successful registration', async () => {
      const userData = {
        email: 'new@example.com',
        password: 'password',
        firstName: 'New',
        lastName: 'User',
      };
      
      mockedAuthAPI.register.mockResolvedValue(mockUser);
      
      await store.dispatch(registerUser(userData));
      
      const state = store.getState().auth;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
      // Note: registration doesn't automatically log in
      expect(state.isAuthenticated).toBe(false);
    });

    it('should handle registration failure', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password',
        firstName: 'New',
        lastName: 'User',
      };
      const errorMessage = 'User already exists';
      
      mockedAuthAPI.register.mockRejectedValue({
        response: { data: { message: errorMessage } }
      });
      
      await store.dispatch(registerUser(userData));
      
      const state = store.getState().auth;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe(errorMessage);
    });
  });

  describe('refreshToken async thunk', () => {
    it('should handle successful token refresh', async () => {
      // First set initial tokens
      store.dispatch(loginUser.fulfilled({ user: mockUser, tokens: mockTokens }, '', {} as any));
      
      const newTokens = { ...mockTokens, accessToken: 'new-access-token' };
      mockedAuthAPI.refreshToken.mockResolvedValue({ tokens: newTokens });
      
      await store.dispatch(refreshToken());
      
      const state = store.getState().auth;
      expect(state.tokens).toEqual(newTokens);
      expect(mockedAsyncStorage.setItem).toHaveBeenCalledWith(
        'auth_tokens',
        JSON.stringify(newTokens)
      );
    });

    it('should handle token refresh failure', async () => {
      // First set initial state
      store.dispatch(loginUser.fulfilled({ user: mockUser, tokens: mockTokens }, '', {} as any));
      
      mockedAuthAPI.refreshToken.mockRejectedValue(new Error('Token expired'));
      
      await store.dispatch(refreshToken());
      
      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.tokens).toBeNull();
      expect(state.isAuthenticated).toBe(false);
      expect(mockedAsyncStorage.removeItem).toHaveBeenCalledWith('auth_tokens');
    });
  });

  describe('loadStoredAuth async thunk', () => {
    it('should load stored authentication successfully', async () => {
      const storedTokens = JSON.stringify(mockTokens);
      mockedAsyncStorage.getItem.mockResolvedValue(storedTokens);
      mockedAuthAPI.getProfile.mockResolvedValue(mockUser);
      
      await store.dispatch(loadStoredAuth());
      
      const state = store.getState().auth;
      expect(state.isLoading).toBe(false);
      expect(state.user).toEqual(mockUser);
      expect(state.tokens).toEqual(mockTokens);
      expect(state.isAuthenticated).toBe(true);
    });

    it('should handle no stored tokens', async () => {
      mockedAsyncStorage.getItem.mockResolvedValue(null);
      
      await store.dispatch(loadStoredAuth());
      
      const state = store.getState().auth;
      expect(state.isLoading).toBe(false);
      expect(state.isAuthenticated).toBe(false);
    });

    it('should handle invalid stored tokens', async () => {
      const storedTokens = JSON.stringify(mockTokens);
      mockedAsyncStorage.getItem.mockResolvedValue(storedTokens);
      mockedAuthAPI.getProfile.mockRejectedValue(new Error('Invalid token'));
      
      await store.dispatch(loadStoredAuth());
      
      const state = store.getState().auth;
      expect(state.isLoading).toBe(false);
      expect(state.isAuthenticated).toBe(false);
      expect(mockedAsyncStorage.removeItem).toHaveBeenCalledWith('auth_tokens');
    });
  });
}); 