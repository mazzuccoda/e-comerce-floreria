'use client';

import React from 'react';
import Link from 'next/link';

const TestCartPage = () => {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>🛒 Test Cart Page</h1>
      <p>This is a simple test page to verify routing works.</p>
      <p>If you can see this, the cart route is working.</p>
      <Link href="/" style={{ color: 'blue', textDecoration: 'underline' }}>
        ← Back to Home
      </Link>
    </div>
  );
};

export default TestCartPage;
