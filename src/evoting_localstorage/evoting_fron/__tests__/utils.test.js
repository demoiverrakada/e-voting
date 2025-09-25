// Test utility functions and business logic

describe('Voting App Utilities', () => {
  describe('String Utilities', () => {
    it('should validate email format', () => {
      const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
      };

      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user@domain.co.uk')).toBe(true);
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('@domain.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
    });

    it('should format voter ID correctly', () => {
      const formatVoterId = (id) => {
        if (!id) return '';
        return id.toString().padStart(8, '0');
      };

      expect(formatVoterId(123)).toBe('00000123');
      expect(formatVoterId(12345678)).toBe('12345678');
      expect(formatVoterId('')).toBe('');
      expect(formatVoterId(null)).toBe('');
    });

    it('should sanitize input strings', () => {
      const sanitizeInput = (input) => {
        if (typeof input !== 'string') return '';
        return input.trim().replace(/[<>]/g, '');
      };

      expect(sanitizeInput('  test input  ')).toBe('test input');
      expect(sanitizeInput('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
      expect(sanitizeInput(123)).toBe('');
      expect(sanitizeInput(null)).toBe('');
    });
  });

  describe('Array Utilities', () => {
    it('should shuffle array elements', () => {
      const shuffleArray = (array) => {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
      };

      const original = [1, 2, 3, 4, 5];
      const shuffled = shuffleArray(original);
      
      expect(shuffled).toHaveLength(original.length);
      expect(shuffled).toEqual(expect.arrayContaining(original));
      expect(original).toEqual([1, 2, 3, 4, 5]); // Original should not be modified
    });

    it('should find unique elements', () => {
      const getUniqueElements = (array) => {
        return [...new Set(array)];
      };

      expect(getUniqueElements([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
      expect(getUniqueElements(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
      expect(getUniqueElements([])).toEqual([]);
    });
  });

  describe('Date Utilities', () => {
    it('should format date for display', () => {
      const formatDate = (date) => {
        if (!date) return '';
        const d = new Date(date);
        return d.toLocaleDateString('en-US', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
      };

      const testDate = new Date('2024-01-15');
      expect(formatDate(testDate)).toBe('01/15/2024');
      expect(formatDate(null)).toBe('');
      expect(formatDate('invalid')).toBe('Invalid Date');
    });

    it('should check if date is in the future', () => {
      const isFutureDate = (date) => {
        if (!date) return false;
        return new Date(date) > new Date();
      };

      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      expect(isFutureDate(futureDate)).toBe(true);
      expect(isFutureDate(pastDate)).toBe(false);
      expect(isFutureDate(null)).toBe(false);
    });
  });

  describe('Validation Utilities', () => {
    it('should validate voter age', () => {
      const isValidVoterAge = (birthDate) => {
        if (!birthDate) return false;
        const today = new Date();
        const birth = new Date(birthDate);
        const age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          return age - 1 >= 18;
        }
        return age >= 18;
      };

      const adultBirthDate = new Date();
      adultBirthDate.setFullYear(adultBirthDate.getFullYear() - 25);
      
      const minorBirthDate = new Date();
      minorBirthDate.setFullYear(minorBirthDate.getFullYear() - 16);

      expect(isValidVoterAge(adultBirthDate)).toBe(true);
      expect(isValidVoterAge(minorBirthDate)).toBe(false);
      expect(isValidVoterAge(null)).toBe(false);
    });

    it('should validate election ID format', () => {
      const isValidElectionId = (id) => {
        if (!id) return false;
        const idStr = id.toString();
        return /^[A-Z0-9]{8,12}$/.test(idStr);
      };

      expect(isValidElectionId('ELEC2024A')).toBe(true);
      expect(isValidElectionId('12345678')).toBe(true);
      expect(isValidElectionId('invalid')).toBe(false);
      expect(isValidElectionId('')).toBe(false);
      expect(isValidElectionId(null)).toBe(false);
    });
  });

  describe('Crypto Utilities', () => {
    it('should generate random string', () => {
      const generateRandomString = (length) => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let result = '';
        for (let i = 0; i < length; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };

      const randomStr = generateRandomString(10);
      expect(randomStr).toHaveLength(10);
      expect(typeof randomStr).toBe('string');
      
      // Test multiple calls return different strings
      const str1 = generateRandomString(10);
      const str2 = generateRandomString(10);
      expect(str1).not.toBe(str2);
    });

    it('should hash sensitive data', () => {
      const hashData = (data) => {
        if (!data) return '';
        // Simple hash function for testing
        let hash = 0;
        const str = data.toString();
        for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash).toString(16);
      };

      expect(hashData('test')).toBeTruthy();
      expect(hashData('test')).toBe(hashData('test')); // Consistent
      expect(hashData('test')).not.toBe(hashData('different'));
      expect(hashData('')).toBe('');
      expect(hashData(null)).toBe('');
    });
  });
});