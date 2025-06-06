#!/usr/bin/env bun

// Simple test script to verify Better Auth endpoints work

const BASE_URL = 'http://localhost:3000/api/auth';

async function testSignup() {
    console.log('🧪 Testing signup...');

    const formData = new FormData();
    formData.append('username', 'testuser');
    formData.append('password', 'testpass123');

    try {
        const response = await fetch(`${BASE_URL}/signup`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();
        console.log('Signup response:', data);

        if (response.ok) {
            console.log('✅ Signup successful!');

            // Extract session cookie
            const setCookie = response.headers.get('set-cookie');
            if (setCookie) {
                const sessionMatch = setCookie.match(
                    /better-auth\.session_token=([^;]+)/,
                );
                if (sessionMatch) {
                    return sessionMatch[1];
                }
            }
        } else {
            console.log('❌ Signup failed:', data);
        }
    } catch (error) {
        console.error('❌ Signup error:', error);
    }

    return null;
}

async function testLogin() {
    console.log('🧪 Testing login...');

    const formData = new FormData();
    formData.append('username', 'testuser');
    formData.append('password', 'testpass123');

    try {
        const response = await fetch(`${BASE_URL}/login`, {
            method: 'POST',
            body: formData,
        });

        const data = await response.json();
        console.log('Login response:', data);

        if (response.ok) {
            console.log('✅ Login successful!');

            // Extract session cookie
            const setCookie = response.headers.get('set-cookie');
            if (setCookie) {
                const sessionMatch = setCookie.match(
                    /better-auth\.session_token=([^;]+)/,
                );
                if (sessionMatch) {
                    return sessionMatch[1];
                }
            }
        } else {
            console.log('❌ Login failed:', data);
        }
    } catch (error) {
        console.error('❌ Login error:', error);
    }

    return null;
}

async function testUser(sessionToken: string) {
    console.log('🧪 Testing user endpoint...');

    try {
        const response = await fetch(`${BASE_URL}/user`, {
            headers: {
                Cookie: `better-auth.session_token=${sessionToken}`,
            },
        });

        const data = await response.json();
        console.log('User response:', data);

        if (response.ok) {
            console.log('✅ User fetch successful!');
        } else {
            console.log('❌ User fetch failed:', data);
        }
    } catch (error) {
        console.error('❌ User fetch error:', error);
    }
}

async function testLogout(sessionToken: string) {
    console.log('🧪 Testing logout...');

    try {
        const response = await fetch(`${BASE_URL}/logout`, {
            headers: {
                Cookie: `better-auth.session_token=${sessionToken}`,
            },
        });

        console.log('Logout status:', response.status);

        if (response.status === 302 || response.ok) {
            console.log('✅ Logout successful!');
        } else {
            console.log('❌ Logout failed');
        }
    } catch (error) {
        console.error('❌ Logout error:', error);
    }
}

async function runTests() {
    console.log('🚀 Starting Better Auth tests...\n');

    // Test signup
    const signupToken = await testSignup();
    console.log('');

    if (signupToken) {
        // Test user endpoint with signup token
        await testUser(signupToken);
        console.log('');

        // Test logout
        await testLogout(signupToken);
        console.log('');
    }

    // Test login
    const loginToken = await testLogin();
    console.log('');

    if (loginToken) {
        // Test user endpoint with login token
        await testUser(loginToken);
        console.log('');

        // Test logout
        await testLogout(loginToken);
    }

    console.log('🏁 Tests completed!');
}

runTests();
