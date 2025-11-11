const { PipeClient } = require('./dist/index.js');

async function test() {
  const client = new PipeClient();

  console.log('Testing create account...');

  try {
    const account = await client.createAccount('testuser12345', 'password12345');
    console.log('✅ Account created!');
    console.log('Account:', account);
  } catch (error) {
    console.log('❌ Create failed:', error.message);
    console.log('Status:', error.status);

    if (error.status === 409) {
      console.log('\nAccount exists, trying login...');
      try {
        const account = await client.login('testuser12345', 'password12345');
        console.log('✅ Login successful!');
        console.log('Account:', account);
      } catch (loginError) {
        console.log('❌ Login also failed:', loginError.message);
      }
    }
  }
}

test();
