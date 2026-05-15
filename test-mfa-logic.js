const speakeasy = require('speakeasy');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

// Mock User and Session for verification
const mockUser = {
    _id: 'test_user_id',
    username: 'test_admin',
    mfaSecret: '',
    isMfaEnabled: true
};

const secret = speakeasy.generateSecret({ name: 'Test' });
mockUser.mfaSecret = secret.base32;

console.log('--- Testing MFA Logic ---');

// 1. Generate a token
const token = speakeasy.totp({
    secret: mockUser.mfaSecret,
    encoding: 'base32'
});

console.log(`Generated Token: ${token}`);

// 2. Verify the token (Simulating loginMfa logic)
const verified = speakeasy.totp.verify({
    secret: mockUser.mfaSecret,
    encoding: 'base32',
    token: token
});

console.log(`Verification Result: ${verified}`);

if (verified) {
    console.log('SUCCESS: MFA logic is working correctly.');
} else {
    console.log('FAILURE: MFA logic failed.');
}
