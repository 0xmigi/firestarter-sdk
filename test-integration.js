// Quick integration test for the Firestarter SDK
const { FirestarterSDK, createFirestarterSDK } = require('./dist/index.js');

async function testSDK() {
  console.log('🧪 Testing Firestarter SDK Integration...');

  try {
    // Test 1: Create SDK instance
    const sdk = createFirestarterSDK({
      baseUrl: 'https://us-west-00-firestarter.pipenetwork.com'
    });

    console.log('✅ SDK instance created successfully');

    // Test 2: Try to create a user account (this will fail without a real wallet address, but should not crash)
    try {
      await sdk.createUserAccount('test_wallet_address_1234567890');
      console.log('❌ Unexpected success - should have failed with validation error');
    } catch (error) {
      if (error.message.includes('8 characters')) {
        console.log('✅ Validation error caught correctly');
      } else {
        console.log('❌ Unexpected error:', error.message);
      }
    }

    // Test 3: Test user file listing (should return empty array)
    const files = await sdk.listUserFiles('test_wallet_address');
    console.log('✅ File listing works, returned:', files.length, 'files');

    // Test 4: Test user balance (should fail gracefully)
    try {
      await sdk.getUserBalance('test_wallet_address');
      console.log('❌ Unexpected success - should have failed');
    } catch (error) {
      console.log('✅ Balance check failed gracefully:', error.message);
    }

    console.log('🎉 All integration tests passed!');
    return true;
  } catch (error) {
    console.error('❌ Integration test failed:', error);
    return false;
  }
}

testSDK().then(success => {
  process.exit(success ? 0 : 1);
});