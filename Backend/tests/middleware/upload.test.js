const multer = require('multer');
const fs = require('fs');
const path = require('path');

// Mock fs and path modules
jest.mock('fs');

describe('Upload Middleware', () => {
  let upload;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // We need to require the middleware fresh to test the dynamic logic
    jest.isolateModules(() => {
      upload = require('../../src/middleware/upload');
    });
  });

  describe('Storage destination', () => {
    test('Should create /materi folder if url includes /materi', () => {
      const storage = upload.storage;
      const req = { originalUrl: '/api/materi/upload' };
      const cb = jest.fn();
      
      fs.existsSync.mockReturnValue(false); // Force directory creation

      storage.getDestination(req, {}, cb);

      expect(fs.existsSync).toHaveBeenCalled();
      expect(fs.mkdirSync).toHaveBeenCalledWith(expect.stringContaining('materi'), { recursive: true });
      expect(cb).toHaveBeenCalledWith(null, expect.stringContaining('materi'));
    });

    test('Should create /tugas folder if url includes /tugas', () => {
      const storage = upload.storage;
      const req = { originalUrl: '/api/tugas/baru' };
      const cb = jest.fn();
      
      fs.existsSync.mockReturnValue(true); // Don't create directory

      storage.getDestination(req, {}, cb);

      expect(fs.mkdirSync).not.toHaveBeenCalled();
      expect(cb).toHaveBeenCalledWith(null, expect.stringContaining('tugas'));
    });

    test('Should create /submit folder if url includes /submit', () => {
      const storage = upload.storage;
      const req = { originalUrl: '/api/tugas/submit/1' };
      const cb = jest.fn();
      
      fs.existsSync.mockReturnValue(false); 

      storage.getDestination(req, {}, cb);

      expect(cb).toHaveBeenCalledWith(null, expect.stringContaining('submit'));
    });
  });

  describe('Storage filename', () => {
    test('Should generate safe filename with timestamp', () => {
      const storage = upload.storage;
      const file = { originalname: 'my test file.pdf' };
      const cb = jest.fn();
      
      const realDateNow = Date.now.bind(global.Date);
      const dateNowStub = jest.fn(() => 1234567890);
      global.Date.now = dateNowStub;

      storage.getFilename({}, file, cb);

      expect(cb).toHaveBeenCalledWith(null, '1234567890-my_test_file.pdf');
      
      global.Date.now = realDateNow;
    });
  });
});
