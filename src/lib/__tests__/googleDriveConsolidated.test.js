import googleDriveConsolidatedService from '../googleDriveConsolidated.js';

// Mock del servicio de auth
jest.mock('../googleDriveAuthService.js', () => ({
  __esModule: true,
  default: {
    initialize: jest.fn(),
    refreshAccessToken: jest.fn().mockResolvedValue({ access_token: 'new-token' }),
    getValidCredentials: jest.fn().mockResolvedValue({
      access_token: 'test-token',
      token_type: 'Bearer',
      expiry_date: Date.now() + 3600000
    })
  }
}));

describe('GoogleDriveConsolidatedService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize service correctly', async () => {
    const result = await googleDriveConsolidatedService.initialize('test-user-id');
    
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  test('should handle folder creation with retry on 401', async () => {
    // Mock fetch para simular 401 primero, luego éxito
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        status: 401,
        json: () => Promise.resolve({ error: 'Invalid credentials' })
      })
      .mockResolvedValueOnce({
        status: 200,
        json: () => Promise.resolve({ id: 'folder-123', name: 'Test Folder' })
      });

    const result = await googleDriveConsolidatedService.createFolder('Test Folder', null);
    
    expect(result).toBeDefined();
    expect(result.id).toBe('folder-123');
    expect(global.fetch).toHaveBeenCalledTimes(2); // Retry funcionó
  });

  test('should handle errors gracefully', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 500,
      json: () => Promise.resolve({ error: 'Server error' })
    });

    const result = await googleDriveConsolidatedService.createFolder('Test Folder', null);
    
    expect(result).toBeNull();
  });

  test('should list files successfully', async () => {
    const mockFiles = {
      files: [
        { id: 'file-1', name: 'test1.txt' },
        { id: 'file-2', name: 'test2.txt' }
      ]
    };

    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      json: () => Promise.resolve(mockFiles)
    });

    const result = await googleDriveConsolidatedService.listFiles();
    
    expect(result).toEqual(mockFiles.files);
    expect(result).toHaveLength(2);
  });
});