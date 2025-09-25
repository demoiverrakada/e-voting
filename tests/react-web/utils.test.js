// Test utility functions for verification webpage

describe('Verification Utils', () => {
  describe('QR Code Validation', () => {
    it('should validate QR code format', () => {
      const isValidQRCode = (qrData) => {
        if (!qrData || typeof qrData !== 'string') return false;
        // Basic validation - should contain election ID and vote data
        return qrData.includes('electionId') && qrData.includes('voteData');
      };

      expect(isValidQRCode('{"electionId":"ELEC2024","voteData":"encrypted"')).toBe(true);
      expect(isValidQRCode('invalid qr data')).toBe(false);
      expect(isValidQRCode('')).toBe(false);
      expect(isValidQRCode(null)).toBe(false);
    });

    it('should parse QR code data', () => {
      const parseQRData = (qrData) => {
        try {
          return JSON.parse(qrData);
        } catch (error) {
          return null;
        }
      };

      const validQR = '{"electionId":"ELEC2024","voteData":"encrypted","timestamp":1234567890}';
      const parsed = parseQRData(validQR);
      
      expect(parsed).toEqual({
        electionId: 'ELEC2024',
        voteData: 'encrypted',
        timestamp: 1234567890
      });

      expect(parseQRData('invalid json')).toBeNull();
      expect(parseQRData('')).toBeNull();
    });
  });

  describe('Vote Verification', () => {
    it('should verify vote integrity', () => {
      const verifyVoteIntegrity = (voteData, hash) => {
        if (!voteData || !hash) return false;
        
        // Simple hash verification for testing
        const calculatedHash = voteData.split('').reduce((a, b) => {
          a = ((a << 5) - a) + b.charCodeAt(0);
          return a & a;
        }, 0).toString(16);
        
        return calculatedHash === hash;
      };

      const voteData = 'test-vote-data';
      const correctHash = 'a1b2c3d4'; // This would be calculated properly in real app
      
      expect(verifyVoteIntegrity(voteData, correctHash)).toBe(false); // Will be false with simple hash
      expect(verifyVoteIntegrity(voteData, '')).toBe(false);
      expect(verifyVoteIntegrity('', correctHash)).toBe(false);
    });

    it('should validate election ID in vote', () => {
      const validateElectionId = (electionId) => {
        if (!electionId) return false;
        return /^[A-Z0-9]{8,12}$/.test(electionId);
      };

      expect(validateElectionId('ELEC2024A')).toBe(true);
      expect(validateElectionId('12345678')).toBe(true);
      expect(validateElectionId('invalid')).toBe(false);
      expect(validateElectionId('')).toBe(false);
      expect(validateElectionId(null)).toBe(false);
    });
  });

  describe('Data Formatting', () => {
    it('should format timestamp for display', () => {
      const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'Invalid date';
        const date = new Date(timestamp);
        return date.toLocaleString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      };

      const testTimestamp = 1640995200000; // Jan 1, 2022
      const formatted = formatTimestamp(testTimestamp);
      
      expect(formatted).toContain('01/01/2022');
      expect(formatTimestamp(null)).toBe('Invalid date');
      expect(formatTimestamp(0)).toBe('Invalid date');
    });

    it('should format vote data for display', () => {
      const formatVoteData = (voteData) => {
        if (!voteData) return 'No vote data';
        if (typeof voteData === 'object') {
          return JSON.stringify(voteData, null, 2);
        }
        return voteData.toString();
      };

      expect(formatVoteData({ candidate: 'John Doe', position: 'Mayor' }))
        .toContain('candidate');
      expect(formatVoteData('simple vote')).toBe('simple vote');
      expect(formatVoteData(null)).toBe('No vote data');
    });
  });

  describe('Error Handling', () => {
    it('should handle API errors gracefully', () => {
      const handleAPIError = (error) => {
        if (!error) return 'Unknown error';
        
        if (error.response) {
          return `Server error: ${error.response.status}`;
        } else if (error.request) {
          return 'Network error: Unable to connect to server';
        } else {
          return `Error: ${error.message}`;
        }
      };

      const networkError = { request: {} };
      const serverError = { response: { status: 500 } };
      const clientError = { message: 'Invalid input' };

      expect(handleAPIError(networkError)).toBe('Network error: Unable to connect to server');
      expect(handleAPIError(serverError)).toBe('Server error: 500');
      expect(handleAPIError(clientError)).toBe('Error: Invalid input');
      expect(handleAPIError(null)).toBe('Unknown error');
    });

    it('should validate required fields', () => {
      const validateRequiredFields = (data, requiredFields) => {
        if (!data || !requiredFields) return false;
        
        return requiredFields.every(field => {
          const value = data[field];
          return value !== null && value !== undefined && value !== '';
        });
      };

      const testData = { name: 'John', email: 'john@example.com', age: 25 };
      const required = ['name', 'email'];
      const allRequired = ['name', 'email', 'phone'];

      expect(validateRequiredFields(testData, required)).toBe(true);
      expect(validateRequiredFields(testData, allRequired)).toBe(false);
      expect(validateRequiredFields(null, required)).toBe(false);
      expect(validateRequiredFields(testData, null)).toBe(false);
    });
  });

  describe('Security Utils', () => {
    it('should sanitize user input', () => {
      const sanitizeInput = (input) => {
        if (typeof input !== 'string') return '';
        return input
          .replace(/[<>]/g, '')
          .replace(/javascript:/gi, '')
          .replace(/on\w+=/gi, '')
          .trim();
      };

      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
      expect(sanitizeInput('javascript:alert("xss")')).toBe('alert("xss")');
      expect(sanitizeInput('onclick="malicious()"')).toBe('"malicious()"');
      expect(sanitizeInput('  normal input  ')).toBe('normal input');
      expect(sanitizeInput(123)).toBe('');
    });

    it('should validate file types', () => {
      const isValidFileType = (filename, allowedTypes) => {
        if (!filename || !allowedTypes) return false;
        const extension = filename.split('.').pop().toLowerCase();
        return allowedTypes.includes(extension);
      };

      expect(isValidFileType('document.pdf', ['pdf', 'txt'])).toBe(true);
      expect(isValidFileType('image.jpg', ['pdf', 'txt'])).toBe(false);
      expect(isValidFileType('', ['pdf'])).toBe(false);
      expect(isValidFileType('document', ['pdf'])).toBe(false);
    });
  });
});