// api/tests/setup.js
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.DB_NAME = 'webai_db_test'; // Use a test DB or mock

// We will mock the database globally to avoid hitting real database in isolated API tests
jest.mock('../config/database.js', () => {
    return {
        query: jest.fn(),
        execute: jest.fn(),
        getConnection: jest.fn().mockResolvedValue({
            query: jest.fn(),
            release: jest.fn(),
        }),
    };
});
